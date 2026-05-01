import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { Mail, Lock, User as UserIcon, ArrowRight, PlayCircle, Phone, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('আপনাকে স্বাগতম!');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update profile with display name
        await updateProfile(user, {
          displayName: firstName
        });

        // Save extra details to Firestore
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            firstName,
            email,
            phone,
            role: 'user',
            status: 'pending',
            createdAt: new Date().toISOString()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }

        toast.success('অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!');
      }
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        toast.error('Please enable Email/Password in Firebase Console > Authentication > Sign-in method');
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Save Google user details to Firestore if they don't exist
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          firstName: user.displayName || '',
          email: user.email,
          phone: user.phoneNumber || '',
          role: 'user',
          status: 'active', // Google users are usually trusted or we can set to pending if needed, but usually active is fine for social login
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        // Log but don't block login
        console.error("Error saving Google user:", err);
      }

      toast.success('গুগল দিয়ে সাইন ইন করা হয়েছে!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg-dark relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-btn mb-4 shadow-xl shadow-primary/20">
            <PlayCircle className="text-white w-9 h-9" />
          </div>
          <h2 className="text-3xl font-display font-bold mb-2 tracking-tight">
            {isLogin ? 'আপনাকে স্বাগতম' : 'শুরু করুন'}
          </h2>
          <p className="text-slate-500">
            {isLogin ? 'কন্টেন্ট তৈরি চালিয়ে যেতে লগইন করুন' : 'ভিডিও তৈরি শুরু করতে একটি অ্যাকাউন্ট তৈরি করুন'}
          </p>
        </div>

        <div className="glass-panel p-8 shadow-2xl relative z-10">
          <div className="space-y-4 mb-6">
            <button 
              onClick={handleGoogleLogin}
              className="w-full py-3 rounded-xl bg-white text-slate-700 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-3 border border-slate-200 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
            <div className="flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-white/10"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">অথবা ইমেইল</span>
              <div className="h-[1px] flex-1 bg-white/10"></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider ml-1">Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input 
                    type="text" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John Doe"
                    required={!isLogin}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider ml-1">
                {isLogin ? 'Username or Email' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1XXX XXXXXX"
                    required={!isLogin}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 rounded-xl gradient-btn text-white font-bold flex items-center justify-center gap-2 group transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'সাইন ইন' : 'অ্যাকাউন্ট তৈরি করুন'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <button 
              type="button"
              onClick={async () => {
                setEmail('freelancersazu3@gmail.com');
                setPassword('Sazu807#');
                toast.success('ডেমো তথ্য পূরণ করা হয়েছে!');
              }}
              className="w-full py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold hover:bg-purple-500/20 transition-all flex items-center justify-center gap-2"
            >
              <UserIcon size={18} className="text-primary" />
              আমার অ্যাকাউন্টের বিবরণ ব্যবহার করুন
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-white/5">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-medium text-slate-400 hover:text-primary transition-colors"
            >
              {isLogin ? "অ্যাকাউন্ট নেই? সাইন আপ করুন" : "ইতিমধ্যেই অ্যাকাউন্ট আছে? সাইন ইন করুন"}
            </button>
          </div>
        </div>
        
        <p className="mt-8 text-center text-xs text-slate-500 leading-relaxed max-w-[280px] mx-auto">
          Notice: Ensure Email/Password is enabled in your Firebase Console.
        </p>
      </motion.div>
    </div>
  );
}
