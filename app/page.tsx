'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Stethoscope, User as UserIcon, LogOut, BookOpen, Download } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Ensure user profile exists
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || 'Doctor',
            createdAt: serverTimestamp(),
          });
        }
        
        // Fetch practice sessions
        const q = query(collection(db, 'practiceSessions'), where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const userSessions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSessions(userSessions);
      } else {
        setSessions([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-100 p-2 rounded-lg">
            <Stethoscope className="w-6 h-6 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">FSP Prep</h1>
        </div>
        
        {user ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <UserIcon className="w-4 h-4" />
              {user.displayName || user.email}
            </div>
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        ) : (
          <button 
            onClick={handleSignIn}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md transition-colors shadow-sm"
          >
            Sign In with Google
          </button>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {!user ? (
          <div className="text-center max-w-2xl mx-auto mt-12">
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-6">
              Master the German Doctors Exam
            </h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Sign in to track your Fachsprachprüfung (FSP) practice sessions, save your progress, and access the AI-powered patient simulator with authentic Bavarian accents and emotional responses.
            </p>
            <button 
              onClick={handleSignIn}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold rounded-lg transition-colors shadow-md"
            >
              Get Started Now
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome back, Doctor!</h2>
              <p className="text-slate-600 mb-6">Your repository fixes have been applied successfully.</p>
              
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Repository Fixes Applied
                </h3>
                <ul className="space-y-2 text-emerald-700 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">&bull;</span>
                    <span><strong>ElevenLabs TTS Fix:</strong> Removed the unsupported <code>speed</code> parameter from <code>VOICE_SETTINGS</code> to prevent the 422 error and fallback to standard TTS.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">&bull;</span>
                    <span><strong>Bavarian Accent:</strong> Updated the AI prompt in <code>voice-fsp.tsx</code> to explicitly instruct the model to use a Bavarian accent and typical dialect words (e.g., &quot;Grüß Gott&quot;, &quot;Servus&quot;, &quot;Schmarrn&quot;).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">&bull;</span>
                    <span><strong>Emotional Markers:</strong> Updated <code>processTextForNaturalSpeech</code> to inject hesitations, sighs, and emotional markers based on the patient&apos;s state (anxious, pain, frustrated, confused).</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  Your Practice Sessions
                </h3>
                <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {sessions.length} Total
                </span>
              </div>
              
              {sessions.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <p className="text-slate-500 mb-2">No practice sessions recorded yet.</p>
                  <p className="text-sm text-slate-400">Start a session in the mobile app to see it here.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div>
                        <p className="font-medium text-slate-800">Scenario: {session.scenarioId}</p>
                        <p className="text-sm text-slate-500">
                          {session.createdAt?.toDate ? session.createdAt.toDate().toLocaleDateString() : 'Recent'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-600">Score</p>
                        <p className="text-lg font-bold text-emerald-600">{session.score || 0}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
