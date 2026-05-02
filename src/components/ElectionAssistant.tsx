import { useState, useRef, useEffect } from 'react';
import { logEvent } from 'firebase/analytics';
import { analytics, db } from '../lib/firebase';

import { User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { translateText, textToSpeech, speechToText } from '../lib/google-cloud';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Mic, Send, Volume2, Languages, Loader2, User as UserIcon, Bot } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  originalContent?: string;
  language?: string;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'hi', name: 'Hindi' },
  { code: 'zh', name: 'Chinese' },
];

export function ElectionAssistant({ user }: { user: User }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your VoterWise assistant. Ask me anything about the election process, voting requirements, or important timelines." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [targetLang, setTargetLang] = useState('en');
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);



  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const text = textOverride || input;
    if (!text.trim()) return;

    setLoading(true);
    setInput('');
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);

    try {
      if (analytics) logEvent(analytics, 'ask_question', { method: textOverride ? 'voice' : 'text', language: targetLang });
      
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      if (!chatRes.ok) throw new Error('Failed to get response');
      const chatData = await chatRes.json();
      let content = chatData.text || "I'm sorry, I couldn't generate a response.";
      
      // Save interaction
      await addDoc(collection(db, 'interactions'), {
        userId: user.uid,
        prompt: text,
        response: content,
        timestamp: serverTimestamp(),
        locale: targetLang,
        audioUsed: isRecording
      });

      // Handle translation if needed
      if (targetLang !== 'en') {
        const transRes = await translateText(content, targetLang);
        content = transRes.translatedText;
      }

      const assistantMsg: Message = { role: 'assistant', content };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const speakMessage = async (text: string) => {
    try {
      if (analytics) logEvent(analytics, 'text_to_speech', { language: targetLang });
      const res = await textToSpeech(text, targetLang);
      const audio = new Audio(`data:audio/mp3;base64,${res.audioContent}`);
      audio.play();
    } catch (error) {
      console.error('Speech error:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (analytics) logEvent(analytics, 'start_recording');
      
      const options = { mimeType: 'audio/webm;codecs=opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.warn('audio/webm;codecs=opus not supported, falling back to default');
        mediaRecorder.current = new MediaRecorder(stream);
      } else {
        mediaRecorder.current = new MediaRecorder(stream, options);
      }

      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = async () => {
        setIsRecording(false);
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        if (audioBlob.size === 0) return;

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          try {
            setIsTranscribing(true);
            const { transcription } = await speechToText(base64Audio, targetLang);
            if (transcription) {
              handleSend(transcription);
              toast.info(`Transcribed: "${transcription.slice(0, 30)}..."`);
            } else {
              toast.error("Could not understand the audio. Please try again.");
            }
          } catch (error) {
            console.error('Transcription error:', error);
            toast.error("Speech-to-Text failed. Service might be unavailable.");
          } finally {
            setIsTranscribing(false);
          }
        };
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      toast.error("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <Card className="shadow-xl bg-white border-none rounded-3xl overflow-hidden min-h-[600px] flex flex-col">
      <CardContent className="p-0 flex flex-col h-full flex-grow">
        <div className="p-4 border-b bg-zinc-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Languages size={18} className="text-zinc-500" />
            <select 
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            {isRecording && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            {isRecording ? 'Recording...' : isTranscribing ? 'Transcribing...' : 'Live Assistant'}
          </div>
        </div>

        <ScrollArea className="flex-grow p-4 h-[450px]" ref={scrollRef}>
          <div className="flex flex-col gap-4">
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  m.role === 'user' 
                    ? 'bg-zinc-900 text-white rounded-tr-none' 
                    : 'bg-zinc-100 text-zinc-900 rounded-tl-none'
                }`}>
                  <div className="flex items-center gap-2 mb-1 opacity-60">
                    {m.role === 'user' ? <UserIcon size={12} /> : <Bot size={12} />}
                    <span className="text-[10px] uppercase font-bold tracking-wider">
                      {m.role === 'user' ? 'You' : 'VoterWise'}
                    </span>
                  </div>
                  <div className="text-sm leading-relaxed prose prose-zinc max-w-none prose-sm prose-invert">
                    <Markdown>{m.content}</Markdown>
                  </div>
                  {m.role === 'assistant' && (
                    <button 
                      onClick={() => speakMessage(m.content)}
                      className="mt-2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      <Volume2 size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
            {(loading || isTranscribing) && (
              <div className="flex justify-start">
                <div className="bg-zinc-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                  <Loader2 className="animate-spin text-zinc-400" size={18} />
                  <span className="text-xs text-zinc-400 font-medium">
                    {isTranscribing ? 'Converting voice to text...' : 'Thinking...'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-zinc-50 border-t">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <Button 
              type="button"
              variant={isRecording ? "destructive" : "outline"}
              size="icon"
              className={cn(
                "rounded-xl h-12 w-12 flex-shrink-0 transition-all",
                isRecording && "ring-2 ring-red-500 ring-offset-2 animate-pulse"
              )}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={loading || isTranscribing}
            >
              <Mic size={20} />
            </Button>
            <Input 
              placeholder={isRecording ? "Listening... (Click to stop)" : isTranscribing ? "Processing audio..." : "Ask a question..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-12 rounded-xl bg-white border-zinc-200 focus-visible:ring-zinc-900"
              disabled={loading || isRecording || isTranscribing}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="rounded-xl h-12 w-12 flex-shrink-0 bg-zinc-900 hover:bg-zinc-800"
              disabled={loading || isTranscribing || !input.trim() || isRecording}
            >
              <Send size={20} />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
