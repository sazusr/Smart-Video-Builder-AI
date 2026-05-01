import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Mic, 
  Copy, 
  RefreshCw, 
  Languages, 
  FileText, 
  Tag, 
  Image as ImageIcon,
  Share2,
  Check,
  PlayCircle,
  AlertCircle,
  Shield,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { generateVideoContent, VideoContent } from '../services/gemini';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { addDoc, collection, serverTimestamp, query, where, getDocs, Timestamp, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { Youtube, Video, Zap, CheckCircle2 } from 'lucide-react';

// No daily limit for now

function TypingText({ text, speed = 20 }: { text: string; speed?: number }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayedText}</span>;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { language, setLanguage, t: globalT } = useLanguage();
  const t = globalT.dashboard;
  const [topic, setTopic] = useState('');
  const [videoType, setVideoType] = useState<'long' | 'shorts'>('long');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VideoContent | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [channelNameInput, setChannelNameInput] = useState('');
  const [savingChannel, setSavingChannel] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile && !profile.channelName && !showChannelModal) {
      setShowChannelModal(true);
    }
  }, [profile]);

  const handleSaveChannelName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelNameInput.trim() || !user) return;

    setSavingChannel(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        channelName: channelNameInput.trim(),
        updatedAt: serverTimestamp()
      });
      toast.success('চ্যানেল নাম সেভ করা হয়েছে!');
      setShowChannelModal(false);
    } catch (error) {
      toast.error('নাম সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setSavingChannel(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }

    toast.success(`Voice file "${file.name}" uploaded. Processing...`);
    // In a real app, you'd send this to a transcription service
    // For now, we'll just set a placeholder message
    setTopic(`Audio Transcript for ${file.name}: [AI Processing...]`);
    
    // Auto-generate if it were a real transcription
    // handleGenerate();
  };

  useEffect(() => {
    // Initialization if needed
  }, [user]);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;
    const isSuperAdmin = user?.email === 'freelancersazu3@gmail.com';
    if (profile?.status !== 'active' && !isSuperAdmin) {
      toast.error('আপনার অ্যাকাউন্ট সক্রিয় নয়। দয়া করে অ্যাডমিনের অনুমোদনের জন্য অপেক্ষা করুন।');
      return;
    }

    setLoading(true);
    
    setResult(null);
    try {
      const content = await generateVideoContent(
        topic, 
        false, 
        language, 
        profile?.geminiApiKey, 
        profile?.geminiBackupApiKeys,
        videoType,
        profile?.channelName
      );
      setResult(content);
      setLoading(false);

      // Save to Firestore (background)
      const path = 'content';
      try {
        await addDoc(collection(db, path), {
          userId: user?.uid,
          videoTopic: topic,
          language,
          status: 'generated',
          results: content,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
      
      toast.success(t.successMsg);
    } catch (error: any) {
      console.error(error);
      toast.error(t.errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(t.copySuccess);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAll = () => {
    if (!result) return;
    const allText = `
Title: ${result.title}
Tags: ${result.tags.join(', ')}
Description: ${result.description}

--- SCRIPT ---
Hook: ${result.script.hook}
Intro: ${result.script.intro}
Main: ${result.script.main}
Outro: ${result.script.outro}
`.trim();
    copyToClipboard(allText, 'all');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-10 pb-20 md:pb-24 px-4 md:px-0">
      {/* Channel Branding Bar - Premium Look */}
      {profile?.channelName && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 md:p-4 px-4 md:px-6 rounded-2xl md:rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-3xl shadow-xl ring-1 ring-white/5"
        >
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-inner">
              <Youtube size={20} className="md:w-[24px] md:h-[24px]" />
            </div>
            <div>
              <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">{t.activeBranding}</p>
              <h4 className="text-sm md:text-base font-bold text-white tracking-tight">{profile.channelName}</h4>
            </div>
          </div>
          <button 
            onClick={() => setShowChannelModal(true)}
            className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-white/5 border border-white/10 text-[9px] md:text-[10px] font-bold text-slate-400 hover:text-white transition-all active:scale-95"
          >
            {t.change}
          </button>
        </motion.div>
      )}

      {/* Hero Header - Desktop Centered / Mobile Clean */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div className="space-y-2 md:space-y-3">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-wrap items-center gap-2 md:gap-3"
          >
            <h1 className="text-2xl md:text-4xl font-display font-extrabold tracking-tight text-white leading-tight">
              {profile?.channelName || t.yourChannel}
            </h1>
            {user?.email === 'freelancersazu3@gmail.com' && (
              <Link 
                to="/admin" 
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-bold hover:bg-purple-500/20 transition-all shadow-xl"
              >
                <Shield size={10} className="fill-current" />
                ADMIN
              </Link>
            )}
          </motion.div>
          <p className="text-slate-400 font-medium flex items-center gap-2 text-xs md:text-base">
            <Sparkles size={14} className="text-purple-400 animate-pulse md:w-[16px] md:h-[16px]" />
            AI Video SEO Engine Professional
          </p>
        </div>
      </div>

      {/* Input Section - Glassmorphism Workspace */}
      <div className="grid grid-cols-1 gap-6">
        <motion.div 
          layout
          className="bg-slate-900/40 rounded-3xl md:rounded-[2rem] p-5 md:p-10 border border-white/[0.08] backdrop-blur-2xl relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] group"
        >
          {/* Animated background accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[100px] pointer-events-none group-hover:bg-purple-600/10 transition-colors" />
          
          <div className="absolute top-0 right-0 p-6 opacity-30 sm:opacity-100 hidden sm:block">
             <span className="bg-purple-500/5 text-purple-400 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border border-purple-500/10 backdrop-blur-md">Engine V4.2 Pro</span>
          </div>

          <h3 className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 md:mb-8 flex items-center gap-2">
            <Mic size={14} className="text-purple-500" />
            {t.workspace}
          </h3>
          
          <form onSubmit={handleGenerate} className="space-y-6 md:space-y-8">
            <textarea 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t.placeholder}
              className="w-full bg-transparent border-none text-lg md:text-2xl font-medium text-white placeholder-slate-700 resize-none focus:ring-0 min-h-[100px] md:min-h-[120px] custom-scrollbar"
            />
            
            <div className="flex flex-col xl:flex-row xl:items-center justify-between pt-4 md:pt-6 gap-4 md:gap-6 border-t border-white/[0.05]">
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                <div className="flex flex-wrap gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="audio/*" 
                    className="hidden" 
                  />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 text-[10px] md:text-xs font-bold text-slate-300 hover:bg-white/10 transition-all active:scale-95"
                  >
                    <Upload size={14} className="md:w-[16px] md:h-[16px]" />
                    {t.upload}
                  </button>
                  <div className="flex bg-black/20 border border-white/5 rounded-xl md:rounded-2xl p-0.5 md:p-1 shrink-0">
                    <button 
                      type="button" 
                      onClick={() => setLanguage('Bangla')}
                      className={cn("px-3 md:px-4 py-1.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold transition-all", language === 'Bangla' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-400')}
                    >
                      বাংলা
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setLanguage('English')}
                      className={cn("px-3 md:px-4 py-1.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold transition-all", language === 'English' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-400')}
                    >
                      EN
                    </button>
                  </div>
                </div>

                <div className="flex bg-black/20 border border-white/5 rounded-xl md:rounded-2xl p-0.5 md:p-1 shrink-0 ml-auto sm:ml-0">
                  <button 
                    type="button" 
                    onClick={() => setVideoType('long')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold transition-all whitespace-nowrap",
                      videoType === 'long' ? "bg-white text-slate-900 shadow-xl" : "text-slate-500 hover:text-slate-400"
                    )}
                  >
                    <Video size={12} className="md:w-[14px] md:h-[14px]" />
                    {t.long}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setVideoType('shorts')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold transition-all whitespace-nowrap",
                      videoType === 'shorts' ? "bg-white text-slate-900 shadow-xl" : "text-slate-500 hover:text-slate-400"
                    )}
                  >
                    <Zap size={12} className="md:w-[14px] md:h-[14px]" />
                    {t.shorts}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !topic}
                className="w-full xl:w-auto px-8 md:px-10 py-3.5 md:py-4 rounded-2xl md:rounded-[1.25rem] bg-gradient-to-tr from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2 md:gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(147,51,234,0.3)] hover:shadow-[0_15px_40px_rgba(147,51,234,0.4)] transition-all active:scale-[0.98]"
              >
                {loading ? <RefreshCw className="animate-spin" size={16} /> : <><Sparkles size={16} className="md:w-[18px] md:h-[18px]" /> {t.generate}</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Results Area */}
      <AnimatePresence mode="wait">
        {result && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-12 gap-6"
          >
            {/* Left: Metadata Assets */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
              <ResultCard 
                title={<span>SEO Optimization <span className="text-primary">Title</span></span>}
                icon={<BarChart3 size={14} />} 
                content={result.title}
                onCopy={() => copyToClipboard(result.title, 'title')}
                isCopied={copiedField === 'title'}
              />

              <div className="bg-slate-900/40 border border-white/[0.05] rounded-3xl p-6 backdrop-blur-xl ring-1 ring-white/[0.05] shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Tag size={14} className="text-purple-400" />
                    {t.tags}
                  </h4>
                  <button 
                    onClick={() => copyToClipboard(result.tags.join(', '), 'tags')}
                    className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-colors"
                  >
                    {copiedField === 'tags' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-xl bg-white/5 text-[10px] font-bold text-slate-300 border border-white/5 hover:border-purple-500/30 transition-colors">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <ResultCard 
                title={t.desc} 
                icon={<FileText size={14} />} 
                content={result.description}
                onCopy={() => copyToClipboard(result.description, 'description')}
                isCopied={copiedField === 'description'}
                isLongText
              />

              <div className="bg-slate-900/40 border border-white/[0.05] rounded-3xl p-6 flex flex-col backdrop-blur-xl ring-1 ring-white/[0.05] shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} className="text-purple-400" />
                    {t.thumbIdea}
                  </h4>
                  <button 
                    onClick={() => copyToClipboard(result.thumbnailPrompt, 'thumb-p')}
                    className="text-[10px] text-purple-400 font-bold uppercase hover:text-purple-300 transition-colors bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20"
                  >
                    {copiedField === 'thumb-p' ? 'Copied!' : 'Copy Prompt'}
                  </button>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-medium mb-8">
                  {result.thumbnailIdea}
                </p>
                <div className="mt-auto p-4 rounded-2xl bg-black/30 border border-white/5">
                  <p className="text-[9px] font-bold uppercase text-slate-500 mb-2 opacity-50 tracking-tighter text-blue-400">{t.thumbPrompt}</p>
                  <p className="text-[11px] text-slate-400 italic line-clamp-3 leading-relaxed">{result.thumbnailPrompt}</p>
                </div>
                <button className="mt-6 w-full py-3.5 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-white/10 rounded-2xl text-[11px] uppercase font-bold text-slate-200 hover:bg-white/5 transition-all shadow-lg active:scale-95">
                  {t.magicPreview}
                </button>
              </div>
            </div>

            {/* Right: Production Script */}
            <div className="col-span-12 lg:col-span-7 h-full">
              <div className="bg-slate-900/40 border border-white/[0.08] rounded-[2rem] flex flex-col h-full overflow-hidden shadow-2xl backdrop-blur-2xl ring-1 ring-white/[0.05]">
                <div className="p-6 border-b border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between bg-white/[0.02] gap-4">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={16} className="text-blue-500" />
                    Production Script v4.2
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={copyAll}
                      className={cn(
                        "flex-1 sm:flex-none px-5 py-2.5 rounded-2xl text-[11px] font-bold text-white transition-all whitespace-nowrap shadow-xl",
                        copiedField === 'all' ? "bg-green-600" : "bg-purple-600 hover:bg-purple-500"
                      )}
                    >
                      {copiedField === 'all' ? 'কপি হয়েছে' : 'সব কন্টেন্ট কপি করুন'}
                    </button>
                  </div>
                </div>
                <div className="flex-1 p-6 sm:p-10 space-y-8 sm:space-y-12 overflow-y-auto max-h-[500px] sm:max-h-[800px] custom-scrollbar">
                  <ScriptSection title="Hook" content={result.script.hook} color="text-purple-400" isTyping />
                  <ScriptSection title="Intro" content={result.script.intro} color="text-blue-400" isTyping />
                  <ScriptSection title="Content" content={result.script.main} color="text-slate-400" isTyping />
                  <ScriptSection title="Outro" content={result.script.outro} color="text-green-400" isTyping />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!result && !loading && (
        <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
          <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
            <Sparkles size={40} className="text-primary" />
          </div>
          <h2 className="text-xl font-display font-bold mb-2">তৈরি করতে প্রস্তুত?</h2>
          <p className="max-w-xs mx-auto">উপরে একটি টপিক লিখুন এবং এআই-এর জাদু দেখুন।</p>
        </div>
      )}

      {loading && (
        <div className="py-20 space-y-6">
          <div className="max-w-md mx-auto text-center space-y-4">
             <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
             <p className="text-xl font-bold font-display animate-pulse text-white">এসইও অপ্টিমাইজেশন চলছে...</p>
          </div>
        </div>
      )}

      {/* Channel Name Modal */}
      <AnimatePresence>
        {showChannelModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => profile?.channelName && setShowChannelModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Youtube size={120} className="rotate-12" />
              </div>

              <div className="relative space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-display font-bold text-white tracking-tight">আপনার ইউটিউব চ্যানেল?</h2>
                  <p className="text-slate-400 text-sm">আপনার ভিডিওর ব্র্যান্ডিং এবং SEO উন্নত করতে চ্যানেলের নাম দিন।</p>
                </div>

                <form onSubmit={handleSaveChannelName} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Channel Name</label>
                    <input 
                      type="text" 
                      value={channelNameInput}
                      onChange={(e) => setChannelNameInput(e.target.value)}
                      placeholder="যেমন: Tech Master BD"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={savingChannel}
                    className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-xl shadow-purple-500/20 transition-all flex items-center justify-center gap-2 group"
                  >
                    {savingChannel ? (
                      <RefreshCw className="animate-spin" size={18} />
                    ) : (
                      <>
                        <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
                        ব্র্যান্ডিং শুরু করুন
                      </>
                    )}
                  </button>
                </form>

                {profile?.channelName && (
                  <button 
                    onClick={() => setShowChannelModal(false)}
                    className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-400 transition-colors"
                  >
                    পরে করব
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultCard({ title, icon, content, onCopy, isCopied, tags, subContent, subTitle, isLongText }: any) {
  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden ring-1 ring-white/5">
      <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {icon}
          {title}
        </div>
        <button 
          onClick={onCopy}
          className="p-1 px-2 rounded-lg bg-white/5 border border-white/5 text-slate-500 hover:text-slate-100 transition-colors"
        >
          {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>
      </div>
      <div className="p-4 sm:p-6">
        {tags ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: string, i: number) => (
              <span key={i} className="px-2 py-1 rounded bg-slate-800 text-[10px] font-bold text-slate-300 uppercase border border-white/5">
                #{tag}
              </span>
            ))}
          </div>
        ) : (
          <p className={cn("text-white font-medium", isLongText ? "text-sm leading-relaxed" : "text-md")}>
            {content}
          </p>
        )}
      </div>
    </div>
  );
}

function ScriptSection({ title, content, color, isTyping }: any) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 group">
      <span className={cn("inline-block w-fit sm:w-20 text-[10px] font-bold mt-1 uppercase tracking-widest flex-shrink-0 px-2 py-0.5 rounded-md bg-white/5 sm:bg-transparent", color)}>
        [{title}]
      </span>
      <div className="text-sm text-slate-300 leading-relaxed font-medium group-hover:text-white transition-colors">
        {isTyping ? <TypingText text={content} /> : content}
      </div>
    </div>
  );
}

function BarChart3({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
