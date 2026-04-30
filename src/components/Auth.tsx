import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { Mail, Lock, User as UserIcon, ArrowRight, PlayCircle, Chrome } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('আপনাকে স্বাগতম!');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
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
      await signInWithPopup(auth, provider);
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
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-3"
            >
              <Chrome size={20} className="text-blue-400" />
              গুগল দিয়ে চালিয়ে যান
            </button>
            <div className="flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-white/10"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">অথবা ইমেইল</span>
              <div className="h-[1px] flex-1 bg-white/10"></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">ইমেইল অ্যাড্রেস</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">পাসওয়ার্ড</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
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
