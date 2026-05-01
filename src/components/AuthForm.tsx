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
import { Mail, Lock, User as UserIcon, ArrowRight, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AuthForm() {
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
        
        await updateProfile(user, {
          displayName: firstName
        });

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
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          firstName: user.displayName || '',
          email: user.email,
          phone: user.phoneNumber || '',
          role: 'user',
          status: 'active',
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error("Error saving Google user:", err);
      }

      toast.success('গুগল দিয়ে সাইন ইন করা হয়েছে!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass-panel p-6 sm:p-8 shadow-2xl relative z-10 border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-display font-bold mb-1 tracking-tight text-white">
            {isLogin ? 'Welcome Back' : 'Get Started'}
          </h2>
          <p className="text-slate-400 text-sm">
            {isLogin ? 'Sign in to continue creating' : 'Create an account to start'}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <button 
            onClick={handleGoogleLogin}
            className="w-full py-2.5 rounded-xl bg-white text-slate-700 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-3 border border-slate-200 shadow-sm text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-white/5"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">OR EMAIL</span>
            <div className="h-[1px] flex-1 bg-white/5"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider ml-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input 
                      type="text" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John Doe"
                      required={!isLogin}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+880 1XXX XXXXXX"
                      required={!isLogin}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 group hover:shadow-lg hover:shadow-primary/20 transition-all border border-white/10"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center pt-4 border-t border-white/5">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-bold text-slate-400 hover:text-primary transition-colors tracking-wide"
          >
            {isLogin ? "No account? Sign Up Free" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
