import { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { LogIn, LogOut, Vote, MessageSquare, Calendar, BarChart3, Languages, BrainCircuit, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { ElectionAssistant } from './components/ElectionAssistant';
import { TimelineView } from './components/TimelineView';
import { ImpactDashboard } from './components/ImpactDashboard';
import { QuizView } from './components/QuizView';
import { ProfileView } from './components/ProfileView';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Sync user to Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
          });
          
          // Also init UserProgress
          await setDoc(doc(db, 'userProgress', user.uid), {
            userId: user.uid,
            completedSteps: [],
            quizScores: {},
            lastAccessed: serverTimestamp()
          });
        }
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Logged in successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Login failed');
    }
  };

  const logout = () => signOut(auth).then(() => toast.info('Logged out'));

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 text-white p-1.5 rounded-lg">
              <Vote size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight">VoterWise</span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border shadow-sm" alt="" referrerPolicy="no-referrer" />
                <Button variant="ghost" size="sm" onClick={logout} className="hidden sm:flex gap-2">
                  <LogOut size={16} /> Logout
                </Button>
              </div>
            ) : (
              <Button onClick={login} className="gap-2">
                <LogIn size={18} /> Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {!user ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="max-w-2xl">
              <h1 className="text-5xl font-extrabold tracking-tight mb-6 sm:text-6xl text-zinc-900">
                Understand the Power of Your Vote.
              </h1>
              <p className="text-xl text-zinc-600 mb-10 leading-relaxed">
                VoterWise is your personalized election guide. Powered by Gemini AI and Google Cloud, 
                we make the election process transparent, accessible, and understandable for everyone.
              </p>
              <Button size="lg" onClick={login} className="h-14 px-8 text-lg font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-all shadow-xl hover:shadow-2xl">
                Start Your Journey
              </Button>
            </div>
          </motion.div>
        ) : (
          <Tabs defaultValue="assistant" className="w-full">
            <TabsList className="grid w-full h-auto grid-cols-5 sm:w-[600px] mx-auto mb-8 p-1 bg-zinc-100 rounded-xl">
              <TabsTrigger value="assistant" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <MessageSquare className="mr-2 h-4 w-4" /> Assistant
              </TabsTrigger>
              <TabsTrigger value="quiz" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <BrainCircuit className="mr-2 h-4 w-4" /> Quiz
              </TabsTrigger>
              <TabsTrigger value="timeline" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Calendar className="mr-2 h-4 w-4" /> Timeline
              </TabsTrigger>
              <TabsTrigger value="impact" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <BarChart3 className="mr-2 h-4 w-4" /> Impact
              </TabsTrigger>
              <TabsTrigger value="profile" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <UserCircle className="mr-2 h-4 w-4" /> Profile
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              {/* Existing contents... */}
              <TabsContent value="assistant" key="assistant">
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                >
                  <ElectionAssistant user={user} />
                </motion.div>
              </TabsContent>

              <TabsContent value="quiz" key="quiz">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <QuizView userId={user.uid} />
                </motion.div>
              </TabsContent>

              <TabsContent value="timeline" key="timeline">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <TimelineView />
                </motion.div>
              </TabsContent>

              <TabsContent value="impact" key="impact">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <ImpactDashboard />
                </motion.div>
              </TabsContent>

              <TabsContent value="profile" key="profile">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <ProfileView user={user} />
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        )}
      </main>

      <footer className="mt-auto border-t py-12 bg-white/50">
        <div className="container mx-auto px-4 text-center text-zinc-500">
          <p className="text-sm">© 2026 VoterWise • Empowering citizens through accessible information.</p>
        </div>
      </footer>
    </div>
  );
}

