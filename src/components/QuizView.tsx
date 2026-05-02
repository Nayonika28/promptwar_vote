import { useState } from 'react';
import { db, analytics } from '../lib/firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Trophy, ChevronRight, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

const QUIZ_QUESTIONS = [
  {
    question: "What is the primary requirement to be eligible to vote in a national election?",
    options: ["Being a citizen of the country", "Owning property", "Having a college degree", "Being employed"],
    correct: 0,
    explanation: "Citizenship is the fundamental requirement for voting in national elections in almost all countries."
  },
  {
    question: "How can you check if you are correctly registered in the electoral roll?",
    options: ["Ask a neighbor", "Check the official election commission website", "Call the local police", "Visit a grocery store"],
    correct: 1,
    explanation: "The electoral commission maintains the official registry. Most offer online portals to verify your registration status."
  },
  {
    question: "What should you bring to the polling station on election day?",
    options: ["A valid national ID", "A signed letter from a friend", "A utility bill", "Nothing is needed"],
    correct: 0,
    explanation: "Identity verification is crucial to prevent fraud. A national ID card or passport is typically required."
  },
  {
    question: "When does voter registration typically close?",
    options: ["On election day", "A few weeks or months before election day", "One year before election day", "It never closes"],
    correct: 1,
    explanation: "Registration usually has a deadline to allow the commission to finalize rolls and print ballots."
  }
];

export function QuizView({ userId }: { userId: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    if (index === QUIZ_QUESTIONS[currentStep].correct) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = async () => {
    if (currentStep < QUIZ_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
      // Save progress to Firestore
      try {
        const progressRef = doc(db, 'userProgress', userId);
        await updateDoc(progressRef, {
          [`quizScores.general_knowledge`]: score + (selectedOption === QUIZ_QUESTIONS[currentStep].correct ? 1 : 0),
          lastAccessed: serverTimestamp()
        }).catch(async (err) => {
           // If doc doesn't exist, this might fail, though we usually initialize it on login/first access
           console.error("Failed to update quiz score", err);
        });
        
        if (analytics) {
          logEvent(analytics, 'quiz_complete', {
            score: score + (selectedOption === QUIZ_QUESTIONS[currentStep].correct ? 1 : 0),
            total: QUIZ_QUESTIONS.length
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setScore(0);
    setShowResult(false);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  if (showResult) {
    return (
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-12 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-zinc-900 text-white rounded-full flex items-center justify-center mb-6"
          >
            <Trophy size={48} />
          </motion.div>
          <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
          <p className="text-zinc-500 mb-8">
            You scored {score} out of {QUIZ_QUESTIONS.length}. 
            {score === QUIZ_QUESTIONS.length ? " Excellent work, you are election-ready!" : " Great effort! Review the explanations to learn more."}
          </p>
          <Button onClick={resetQuiz} className="h-12 px-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 gap-2">
            <RefreshCcw size={18} /> Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const q = QUIZ_QUESTIONS[currentStep];

  return (
    <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
      <CardHeader className="p-8 border-b bg-zinc-50">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Question {currentStep + 1} of {QUIZ_QUESTIONS.length}</span>
          <span className="text-xs font-bold text-zinc-900">
            {Math.round(((currentStep + (isAnswered ? 1 : 0)) / QUIZ_QUESTIONS.length) * 100)}% Complete
          </span>
        </div>
        <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden mb-6">
          <motion.div 
            className="h-full bg-zinc-900"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + (isAnswered ? 1 : 0)) / QUIZ_QUESTIONS.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <CardTitle className="text-2xl font-bold leading-tight">{q.question}</CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid gap-3 mb-8">
          {q.options.map((option, i) => {
            let variant: "outline" | "default" | "destructive" = "outline";
            let icon = null;
            
            if (isAnswered) {
              if (i === q.correct) {
                variant = "default"; // Will style manually
                icon = <CheckCircle2 className="ml-auto" size={18} />;
              } else if (i === selectedOption) {
                variant = "destructive";
                icon = <XCircle className="ml-auto" size={18} />;
              }
            }

            return (
              <Button
                key={i}
                variant="outline"
                className={`h-auto py-4 px-6 justify-start text-left text-wrap rounded-2xl border-2 transition-all transition-duration-200 ${
                  isAnswered 
                    ? i === q.correct 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 hover:bg-emerald-50' 
                      : i === selectedOption 
                        ? 'bg-red-50 border-red-500 text-red-900 hover:bg-red-50'
                        : 'opacity-50 border-zinc-100'
                    : 'hover:border-zinc-900 hover:bg-zinc-50'
                }`}
                onClick={() => handleAnswer(i)}
                disabled={isAnswered}
              >
                <div className="flex items-center gap-4 w-full">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center font-bold text-sm">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-grow font-medium">{option}</span>
                  {icon}
                </div>
              </Button>
            );
          })}
        </div>

        <AnimatePresence>
          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 mb-8"
            >
              <h4 className="font-bold text-zinc-900 mb-2 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500" /> Explanation
              </h4>
              <p className="text-sm text-zinc-600 leading-relaxed italic">{q.explanation}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end">
          <Button 
            onClick={nextQuestion} 
            disabled={!isAnswered}
            className="h-12 px-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 gap-2 shadow-lg"
          >
            {currentStep === QUIZ_QUESTIONS.length - 1 ? 'Finish Quiz' : 'Next Question'}
            <ChevronRight size={18} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
