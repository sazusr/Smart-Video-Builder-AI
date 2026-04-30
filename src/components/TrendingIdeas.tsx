import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Copy, Sparkles, Youtube, Instagram, Music2 } from 'lucide-react';
import { generateTrendingIdeas } from '../services/gemini';
import { toast } from 'react-hot-toast';
import { motion } from 'motion/react';

export default function TrendingIdeas() {
  const [ideas, setIdeas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchIdeas = async () => {
    setLoading(true);
    try {
      const data = await generateTrendingIdeas(9);
      setIdeas(data);
    } catch (error) {
      toast.error('ট্রেন্ডিং আইডিয়াস আনতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  const copyIdea = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('টপিক কপি করা হয়েছে');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">ট্রেন্ডিং আইডিয়াস</h1>
          <p className="text-slate-400">সোশ্যাল প্ল্যাটফর্ম জুড়ে কী ভাইরাল হচ্ছে তা আবিষ্কার করুন।</p>
        </div>
        <button 
          onClick={fetchIdeas}
          disabled={loading}
          className="gradient-btn px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2"
        >
          {loading ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
          ট্রেন্ড রিফ্রেশ করুন
        </button>
      </div>

      {loading && !ideas.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-panel h-48 animate-pulse bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={index}
              className="glass-panel group p-6 hover:bg-white/[0.07] transition-all cursor-pointer relative overflow-hidden"
              onClick={() => copyIdea(idea)}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                   <div className="flex -space-x-1 opacity-40">
                      <Youtube size={14} className="text-red-500" />
                      <Instagram size={14} className="text-pink-500" />
                      <Music2 size={14} className="text-cyan-400" />
                   </div>
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Trend</span>
                </div>
                <Copy size={14} className="text-slate-600 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">{idea}</h3>
              <p className="mt-4 text-xs text-slate-500 flex items-center gap-1 font-medium">
                <TrendingUp size={12} className="text-green-500" />
                High viral potential
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
