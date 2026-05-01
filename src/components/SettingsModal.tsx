import React, { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../hooks/useAuth';
import { X, Key, Save, AlertCircle, Plus, Trash2, TrendingUp, User as UserIcon, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
}

export default function SettingsModal({ isOpen, onClose, profile }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(profile?.geminiApiKey || '');
  const [backupApiKeys, setBackupApiKeys] = useState<string[]>(profile?.geminiBackupApiKeys || ['']);
  const [channelName, setChannelName] = useState(profile?.channelName || '');
  const [loading, setLoading] = useState(false);

  const addBackupKey = () => {
    setBackupApiKeys([...backupApiKeys, '']);
  };

  const removeBackupKey = (index: number) => {
    const newKeys = [...backupApiKeys];
    newKeys.splice(index, 1);
    setBackupApiKeys(newKeys.length > 0 ? newKeys : ['']);
  };

  const updateBackupKey = (index: number, value: string) => {
    const newKeys = [...backupApiKeys];
    newKeys[index] = value;
    setBackupApiKeys(newKeys);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        geminiApiKey: apiKey,
        geminiBackupApiKeys: backupApiKeys.filter(k => k.trim() !== ''),
        channelName: channelName.trim(),
        updatedAt: serverTimestamp()
      });
      toast.success('সেটিংস সফলভাবে সেভ হয়েছে!');
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${profile.uid}`);
      toast.error('সেটিংস সেভ করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertCircle size={20} className="text-primary" />
                অ্যাপ সেটিংস ও আপডেট
              </h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <form onSubmit={handleSave} className="space-y-10">
                {/* Section 1: Profile Branding */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <UserIcon size={18} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">প্রোফাইল সেটিংস</h4>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      চ্যানেল নাম (YouTube Branding)
                    </label>
                    <input 
                      type="text"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder="আপনার চ্যানেলের নাম দিন..."
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-medium"
                    />
                    <p className="text-[10px] text-slate-500 italic">এই নামটি আপনার ভিডিওর Title এবং Description-এ অটোমেটিক যোগ হবে।</p>
                  </div>
                </div>

                {/* Section 2: API Configuration */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                      <Key size={18} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">এপিআই কনফিগুরেশন (ম্যান্ডেটরি)</h4>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      Primary Gemini API Key
                    </label>
                    <input 
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="আপনার Gemini API কি দিন..."
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        Backup API Keys (লিমিট শেষ হলে কাজ করবে)
                      </label>
                      <button 
                        type="button"
                        onClick={addBackupKey}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-[10px] font-bold hover:bg-purple-500/20 transition-all"
                      >
                        <Plus size={14} />
                        নতুন কী যোগ করুন
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {backupApiKeys.map((key, index) => (
                        <div key={index} className="flex gap-2 group">
                          <div className="flex-1 relative">
                            <input 
                              type="password"
                              value={key}
                              onChange={(e) => updateBackupKey(index, e.target.value)}
                              placeholder={`Backup Key ${index + 1}...`}
                              className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all font-mono"
                            />
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeBackupKey(index)}
                            className="p-3 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-xl border border-white/10 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 3: Update check */}
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <TrendingUp size={14} className="text-green-400" />
                        সরাসরি অ্যাপ আপডেট
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                        অ্যাপের নতুন সব ফিচার এবং দ্রুত গতির জন্য নিয়মিত আপডেট চেক করুন।
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-2 px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Latest vV4.2</span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    type="button"
                    className="w-full py-2.5 rounded-xl border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-500/10 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={14} />
                    চেক আপডেট (Check For Updates)
                  </button>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-white text-slate-900 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 transition-all disabled:opacity-50 shadow-2xl shadow-white/5"
                  >
                    {loading ? (
                      <RefreshCw className="animate-spin" size={18} />
                    ) : (
                      <>
                        <Save size={18} />
                        অ্যাপ সেটিংস সেভ করুন
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
