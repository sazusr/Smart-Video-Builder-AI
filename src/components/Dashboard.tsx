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
import { generateVideoContent, VideoContent } from '../services/gemini';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { addDoc, collection, serverTimestamp, query, where, getDocs, Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

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
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState<'English' | 'Bangla'>('English');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VideoContent | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
      const content = await generateVideoContent(topic, false, language, profile?.geminiApiKey, profile?.geminiBackupApiKeys);
      setResult(content);

      // Save to Firestore
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
      
      toast.success('কন্টেন্ট সফলভাবে তৈরি হয়েছে!');
    } catch (error: any) {
      console.error(error);
      toast.error('কন্টেন্ট তৈরি করতে ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('ক্লিপবোর্ডে কপি হয়েছে');
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
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-extrabold tracking-tight text-white leading-tight">এআই কন্টেন্ট প্রোডাকশন</h1>
            {user?.email === 'freelancersazu3@gmail.com' && (
              <Link 
                to="/admin" 
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-bold hover:bg-purple-500/30 transition-all shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
              >
                <Shield size={12} className="fill-current" />
                ADMIN PANEL
              </Link>
            )}
          </div>
          <p className="text-slate-400 font-medium">আমাদের উন্নত SEO ইঞ্জিনের মাধ্যমে ভাইরাল ভিডিও সিস্টেম তৈরি করুন।</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5 backdrop-blur-sm relative overflow-hidden ring-1 ring-white/5">
          <div className="absolute top-0 right-0 p-4">
             <span className="bg-purple-500/10 text-purple-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest border border-purple-500/10">Stable Engine V4</span>
          </div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Mic size={14} />
            আজ আপনি কি তৈরি করছেন?
          </h3>
          
          <form onSubmit={handleGenerate} className="space-y-4">
            <textarea 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="এখানে টাইটেল, টপিক বা ট্রান্সক্রিপ্ট পেস্ট করুন..."
              className="w-full bg-transparent border-none text-xl font-medium text-white placeholder-slate-700 resize-none focus:ring-0 min-h-[100px]"
            />
            
            <div className="flex flex-wrap items-center justify-between pt-2 gap-4 border-t border-white/5">
              <div className="flex gap-2">
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
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 hover:bg-white/10 transition-colors"
                >
                  <Upload size={14} />
                  ভয়েস আপলোড
                </button>
                <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
                  <button 
                    type="button" 
                    onClick={() => setLanguage('English')}
                    className={cn("px-3 py-1 rounded-md text-[10px] font-bold transition-all", language === 'English' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500')}
                  >
                    EN
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setLanguage('Bangla')}
                    className={cn("px-3 py-1 rounded-md text-[10px] font-bold transition-all", language === 'Bangla' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500')}
                  >
                    BN
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !topic}
                className="px-8 py-2.5 rounded-xl gradient-btn text-white font-bold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw className="animate-spin" size={16} /> : <><Sparkles size={16} /> কন্টেন্ট তৈরি করুন</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Results Area */}
      <AnimatePresence mode="wait">
        {result && (
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

              <ResultCard 
                title="Tags" 
                icon={<Tag size={14} />} 
                content={result.tags.join(', ')}
                onCopy={() => copyToClipboard(result.tags.join(', '), 'tags')}
                isCopied={copiedField === 'tags'}
                tags={result.tags}
              />

              <ResultCard 
                title="Description" 
                icon={<FileText size={14} />} 
                content={result.description}
                onCopy={() => copyToClipboard(result.description, 'description')}
                isCopied={copiedField === 'description'}
                isLongText
              />

              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex-1 flex flex-col ring-1 ring-white/5">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 text-white">
                    <ImageIcon size={14} className="text-purple-400" />
                    Thumbnail
                  </h4>
                  <button 
                    onClick={() => copyToClipboard(result.thumbnailPrompt, 'thumb-p')}
                    className="text-[10px] text-purple-400 font-bold uppercase hover:text-purple-300 transition-colors"
                  >
                    {copiedField === 'thumb-p' ? 'Copied!' : 'Copy Prompt'}
                  </button>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed font-medium mb-6">
                  {result.thumbnailIdea}
                </p>
                <div className="mt-auto p-3 rounded-xl bg-black/20 border border-white/5">
                  <p className="text-[9px] font-bold uppercase text-slate-500 mb-1">DALL-E Prompt</p>
                  <p className="text-[11px] text-primary/80 italic line-clamp-2">{result.thumbnailPrompt}</p>
                </div>
                <button className="mt-4 w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] uppercase font-bold text-slate-300 hover:bg-white/10 transition-colors">
                  Generate AI Preview
                </button>
              </div>
            </div>

            {/* Right: Production Script */}
            <div className="col-span-12 lg:col-span-7 h-full">
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl flex flex-col h-full overflow-hidden shadow-2xl backdrop-blur-md ring-1 ring-white/10">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={14} className="text-blue-400" />
                    সম্পূর্ণ প্রোডাকশন স্ক্রিপ্ট
                  </h4>
                  <div className="flex gap-2">
                    <button 
                      onClick={copyAll}
                      className={cn(
                        "px-3 py-1 rounded text-[10px] font-bold text-white transition-all",
                        copiedField === 'all' ? "bg-green-600" : "bg-purple-600 hover:bg-purple-500"
                      )}
                    >
                      {copiedField === 'all' ? 'কপি হয়েছে' : 'সব কন্টেন্ট কপি করুন'}
                    </button>
                    <button className="px-3 py-1 bg-white/10 rounded text-[10px] font-bold text-slate-300 hover:bg-white/20 transition-colors">.DOC এক্সপোর্ট করুন</button>
                  </div>
                </div>
                <div className="flex-1 p-8 space-y-8 overflow-y-auto max-h-[600px] custom-scrollbar">
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
        <div className="py-20 space-y-8">
          <div className="max-w-md mx-auto text-center space-y-4">
             <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
             <p className="text-xl font-bold font-display animate-pulse">আপনার টপিক বিশ্লেষণ করা হচ্ছে...</p>
             <p className="text-slate-500 text-sm italic">"আমাদের এআই আপনার জন্য নিখুঁত SEO কৌশল তৈরি করছে। সামান্য অপেক্ষা করুন..."</p>
          </div>
        </div>
      )}
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
          className="p-1 text-slate-500 hover:text-slate-100 transition-colors"
        >
          {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>
      </div>
      <div className="p-6">
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
    <div className="flex gap-6 group">
      <span className={cn("w-20 text-[10px] font-bold mt-1 uppercase tracking-widest flex-shrink-0", color)}>
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
