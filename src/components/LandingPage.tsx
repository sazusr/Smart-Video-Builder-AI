import { Link } from 'react-router-dom';
import { PlayCircle, Zap, Shield, Globe, Video, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import AuthForm from './AuthForm';
import { useLanguage } from '../context/LanguageContext';

export default function LandingPage() {
  const { t: globalT } = useLanguage();
  const t = globalT.landing;

  return (
    <div className="min-h-screen bg-bg-dark overflow-hidden selection:bg-primary/30 selection:text-white">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] animate-pulse [animation-delay:2s]" />
      </div>

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <PlayCircle className="text-primary w-8 h-8" />
          <span className="font-display font-bold text-xl sm:text-2xl tracking-tight text-white italic">Smart Video Builder</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/auth" className="hidden sm:block text-sm font-bold text-slate-400 hover:text-white transition-colors">{t.pricing}</Link>
          <div className="h-4 w-[1px] bg-white/10 hidden sm:block"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 animate-pulse hidden sm:block">{t.joinNow}</span>
        </div>
      </nav>

      {/* Hero with Integrated Auth */}
      <section className="relative z-10 pt-12 md:pt-20 pb-32 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Column: Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left"
          >

            <h1 className="text-6xl md:text-8xl font-display font-black mb-6 tracking-tighter leading-[0.8] text-white">
              {t.heroTitle1} <br />
              <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent italic [text-shadow:_4px_4px_0px_#4c1d95,_8px_8px_0px_rgba(0,0,0,0.2)]">
                {t.heroTitle2}
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 mb-8 max-w-sm leading-relaxed font-bold">
              {t.heroDesc}
            </p>
          </motion.div>

          {/* Right Column: Auth Form */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-5 relative"
          >
            {/* Background Glow for Form */}
            <div className="absolute -inset-4 bg-primary/20 rounded-[2.5rem] blur-2xl opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="relative group">
              <AuthForm />
              
              {/* Decorative elements around form */}
              <div className="absolute -top-6 -right-6 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-xl shadow-primary/20 text-white animate-bounce pointer-events-none">
                <Sparkles size={24} />
              </div>
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-primary/20 rounded-full blur-2xl animate-pulse" />
            </div>
          </motion.div>

        </div>
      </section>

      {/* Social Proof / Footer Logos */}
      <section className="bg-white/[0.02] border-t border-white/5 py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-12">{t.poweredBy}</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-30 grayscale saturate-0 hover:opacity-60 transition-opacity">
            <div className="flex items-center gap-2">
              <Video className="w-8 h-8 text-white" />
              <span className="font-bold text-lg text-white font-display">Tiktok</span>
            </div>
            <div className="flex items-center gap-2">
              <PlayCircle className="w-8 h-8 text-white" />
              <span className="font-bold text-lg text-white font-display">YouTube</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-8 h-8 text-white" />
              <span className="font-bold text-lg text-white font-display">Instagram</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-8 h-8 text-white" />
              <span className="font-bold text-lg text-white font-display">Facebook</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
