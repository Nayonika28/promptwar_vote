import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, analytics } from '../lib/firebase';
import { logEvent } from 'firebase/analytics';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { User as UserIcon, Mail, ShieldCheck, Calendar, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export function ProfileView({ user }: { user: User }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setUserData(snap.data());
          setDisplayName(snap.data().displayName || user.displayName || '');
        }
      } catch (e) {
        console.error("Error fetching user data:", e);
      }
    };
    fetchUserData();
  }, [user]);

  const handleUpdate = async () => {
    if (!displayName.trim()) return toast.error("Display name cannot be empty");
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        updatedAt: serverTimestamp()
      });
      
      if (analytics) logEvent(analytics, 'update_profile');
      
      setUserData({ ...userData, displayName: displayName.trim() });
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
        <div className="h-32 bg-zinc-900 relative">
          <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-full shadow-lg">
            <img 
              src={user.photoURL || ''} 
              className="w-24 h-24 rounded-full object-cover border-4 border-white" 
              alt="Profile" 
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <CardContent className="pt-16 pb-8 px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
                {userData?.displayName || user.displayName || 'Voter'}
              </h2>
              <p className="text-zinc-500 flex items-center gap-1.5 mt-1">
                <Mail size={14} /> {user.email}
              </p>
            </div>
            <Button 
              variant={isEditing ? "outline" : "default"}
              onClick={() => setIsEditing(!isEditing)}
              className="rounded-xl px-6 h-11"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>

          <div className="grid gap-6">
            {isEditing && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 p-6 bg-zinc-50 rounded-2xl border border-zinc-100"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Display Name</label>
                  <div className="flex gap-2">
                    <Input 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter display name"
                      className="bg-white rounded-xl h-12"
                    />
                    <Button onClick={handleUpdate} disabled={loading} className="rounded-xl flex-shrink-0 gap-2 h-12 px-6">
                      <Save size={16} /> Save
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-zinc-600">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-tighter">Status</p>
                  <p className="text-sm font-bold text-emerald-600">Verified Member</p>
                </div>
              </div>
              
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-zinc-600">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-tighter">Joined</p>
                  <p className="text-sm font-bold text-zinc-900">
                    {userData?.createdAt?.toDate ? userData.createdAt.toDate().toLocaleDateString() : 'Recent'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl bg-zinc-50 overflow-hidden">
        <CardContent className="p-6">
          <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <UserIcon size={18} /> Account Security
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm py-2 border-b border-zinc-200">
              <span className="text-zinc-600">Email Verification</span>
              <span className="font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] uppercase font-bold">Verified</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2">
              <span className="text-zinc-600">Identity Provider</span>
              <span className="font-mono text-zinc-500 text-[10px] uppercase font-bold">Google OAuth</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
