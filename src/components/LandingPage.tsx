import { Link } from 'react-router-dom';
import { PlayCircle, Zap, Shield, Globe, ArrowRight, Video, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-dark overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-600/20 rounded-full blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <PlayCircle className="text-primary w-8 h-8" />
          <span className="font-display font-bold text-2xl tracking-tight">SmartVideo AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-slate-100 transition-colors">Features</a>
          <a href="#pricing" className="hover:text-slate-100 transition-colors">Pricing</a>
          <Link to="/auth" className="px-6 py-2 rounded-full gradient-btn text-white font-semibold">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-20 pb-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
              The Future of Content Creation
            </span>
            <h1 className="text-5xl md:text-7xl font-display font-extrabold mb-8 tracking-tight leading-[1.1]">
              Generate Viral Video Content <br />
              <span className="gradient-text">In Seconds with AI</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
              SmartVideo AI helps you craft high-converting scripts, SEO titles, descriptions, 
              and thumbnail ideas. Just speak or type your topic and let our AI do the heavy lifting.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth" className="w-full sm:w-auto px-10 py-4 rounded-2xl gradient-btn text-white font-bold text-lg flex items-center justify-center gap-2 group">
                Start Creating Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="w-full sm:w-auto px-10 py-4 rounded-2xl glass-panel text-white font-bold text-lg hover:bg-white/10 transition-colors">
                Watch Demo
              </button>
            </div>
          </motion.div>

          {/* Floating UI Elements */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-20 relative"
          >
            <div className="glass-panel p-2 shadow-2xl relative z-10 overflow-hidden">
               <img 
                src="https://picsum.photos/seed/dashboard/1200/600" 
                alt="Dashboard Preview" 
                className="w-full rounded-xl opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-white/[0.02] border-y border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm font-semibold uppercase tracking-widest mb-10">Trusted by creators worldwide</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-40 grayscale contrast-125">
            <Video size={40} />
            <Sparkles size={40} />
            <Globe size={40} />
            <Zap size={40} />
            <Shield size={40} />
          </div>
        </div>
      </section>
    </div>
  );
}
