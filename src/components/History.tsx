import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { VideoContent } from '../services/gemini';
import { 
  History as HistoryIcon, 
  Trash2, 
  ChevronRight, 
  Calendar,
  ExternalLink,
  Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';

interface ContentRecord {
  id: string;
  videoTopic: string;
  results: VideoContent;
  createdAt: any;
}

export default function History() {
  const { user } = useAuth();
  const { t: globalT } = useLanguage();
  const t = globalT.history;
  const [history, setHistory] = useState<ContentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<ContentRecord | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'content'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ContentRecord));
      setHistory(docs);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const deleteRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t.deleteConfirm)) return;
    try {
      await deleteDoc(doc(db, 'content', id));
      toast.success(t.deleteSuccess);
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (error) {
      toast.error(t.deleteError);
    }
  };

  const filteredHistory = history.filter(item => 
    item.videoTopic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-white leading-tight">{t.title}</h1>
          <p className="text-slate-400 font-medium font-sans">{t.subtitle}</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-primary/50 transition-colors w-full md:w-[240px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* List */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredHistory.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={cn(
                  "p-5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between",
                  selectedItem?.id === item.id 
                    ? "bg-purple-600/10 border-purple-500/30 ring-1 ring-purple-500/20" 
                    : "bg-slate-900/50 border-white/5 hover:border-white/20"
                )}
              >
                <div className="flex gap-4 items-center overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                    <HistoryIcon size={18} className={selectedItem?.id === item.id ? "text-purple-400" : "text-slate-500"} />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-purple-400 transition-colors">{item.videoTopic}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar size={12} className="text-slate-600" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                        {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => deleteRecord(item.id, e)}
                    className="p-2 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                  <ChevronRight size={16} className={cn("transition-transform", selectedItem?.id === item.id ? "text-purple-400 translate-x-1" : "text-slate-700")} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredHistory.length === 0 && !loading && (
            <div className="py-20 text-center opacity-40">
              <HistoryIcon size={48} className="mx-auto mb-4 text-slate-600" />
              <p className="font-semibold text-slate-400">{t.noHistory}</p>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="lg:col-span-12 xl:col-span-7">
          <AnimatePresence mode="wait">
            {selectedItem ? (
              <motion.div
                key={selectedItem.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden min-h-[500px] flex flex-col ring-1 ring-white/5 shadow-2xl"
              >
                <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-widest">{t.snapshotPreview}</h2>
                  </div>
                  <button 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 hover:bg-white/10 transition-colors uppercase whitespace-nowrap"
                    onClick={() => toast.error('Editor mode coming soon')}
                  >
                    {t.openInEditor}
                    <ExternalLink size={12} />
                  </button>
                </div>

                <div className="p-6 sm:p-10 space-y-8 overflow-y-auto max-h-[600px] custom-scrollbar">
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-2">{t.mainTopic}</span>
                    <h4 className="text-xl font-bold text-white leading-tight">{selectedItem.videoTopic}</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">{t.titleStrategy}</span>
                      <p className="text-sm font-medium text-slate-200">{selectedItem.results.title}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">{t.productionTone}</span>
                      <p className="text-sm font-medium text-slate-200">{selectedItem.results.analytics.tone}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">{t.scriptPreview}</span>
                    <div className="space-y-6">
                      <p className="text-sm text-slate-300 leading-relaxed"><span className="text-purple-400 font-bold mr-2 uppercase text-[10px]">[Hook]</span>{selectedItem.results.script.hook}</p>
                      <p className="text-sm text-slate-300 leading-relaxed"><span className="text-blue-400 font-bold mr-2 uppercase text-[10px]">[Intro]</span>{selectedItem.results.script.intro}</p>
                      <p className="text-sm text-slate-300 leading-relaxed"><span className="text-slate-400 font-bold mr-2 uppercase text-[10px]">[Main]</span>{selectedItem.results.script.main}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[500px] rounded-3xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center p-12">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <ChevronRight size={32} className="text-slate-700" />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-300 mb-2">{t.selectGeneration}</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto font-medium">{t.selectGenerationDesc}</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
