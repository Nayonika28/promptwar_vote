import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { TranslationServiceClient } from '@google-cloud/translate';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { SpeechClient } from '@google-cloud/speech';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();
// Helper to get credentials
function getCredentials() {
    const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (!json || json === '{}') {
        return undefined; // Let the SDK handle default credentials
    }
    return JSON.parse(json);
}
async function startServer() {
    const app = express();
    const PORT = process.env.PORT || 8080;
    const credentials = getCredentials();
    const projectId = credentials?.project_id || process.env.GOOGLE_CLOUD_PROJECT || 'promptwar-2-495019';
    app.use(express.json({ limit: '10mb' }));
    // API Routes
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    app.post('/api/chat', async (req, res) => {
        try {
            const { text } = req.body;
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: text,
                config: {
                    systemInstruction: "You are a helpful election assistant named VoterWise. Provide accurate, non-partisan information about the election process, voting steps, and timelines. If asked about specific candidates, remain neutral and focus on their declared policies or the voting process itself.",
                },
            });
            res.json({ text: response.text });
        }
        catch (error) {
            console.error('Chat error:', error);
            res.status(500).json({ error: error.message });
        }
    });
    app.post('/api/translate', async (req, res) => {
        try {
            const { text, targetLanguage } = req.body;
            const translate = new TranslationServiceClient({ credentials, projectId });
            const [response] = await translate.translateText({
                parent: `projects/${projectId}/locations/global`,
                contents: [text],
                mimeType: 'text/plain',
                targetLanguageCode: targetLanguage,
            });
            res.json({ translatedText: response.translations?.[0].translatedText });
        }
        catch (error) {
            console.error('Translation error:', error);
            res.status(500).json({ error: error.message });
        }
    });
    app.post('/api/tts', async (req, res) => {
        try {
            const { text, languageCode } = req.body;
            const tts = new TextToSpeechClient({ credentials, projectId });
            const [response] = await tts.synthesizeSpeech({
                input: { text },
                voice: { languageCode, ssmlGender: 'NEUTRAL' },
                audioConfig: { audioEncoding: 'MP3' },
            });
            res.json({ audioContent: response.audioContent?.toString('base64') });
        }
        catch (error) {
            console.error('TTS error:', error);
            res.status(500).json({ error: error.message });
        }
    });
    app.post('/api/stt', async (req, res) => {
        try {
            const { audioContent, languageCode } = req.body;
            const speech = new SpeechClient({ credentials, projectId });
            const [response] = await speech.recognize({
                config: {
                    encoding: 'WEBM_OPUS',
                    sampleRateHertz: 48000,
                    languageCode,
                },
                audio: { content: audioContent },
            });
            const transcription = response.results
                ?.map(result => result.alternatives?.[0].transcript)
                .join('\n');
            res.json({ transcription });
        }
        catch (error) {
            console.error('STT error:', error);
            res.status(500).json({ error: error.message });
        }
    });
    // Vite integration
    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    }
    else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
startServer();
