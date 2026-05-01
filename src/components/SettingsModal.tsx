import React, { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../hooks/useAuth';
import { X, Key, Save, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
}

export default function SettingsModal({ isOpen, onClose, profile }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(profile?.geminiApiKey || '');
  const [backupApiKeys, setBackupApiKeys] = useState<string[]>(profile?.geminiBackupApiKeys || ['']);
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
        updatedAt: serverTimestamp()
      });
      toast.success('Settings saved successfully!');
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${profile.uid}`);
      toast.error('Failed to save settings');
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
            className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative z-10"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                সেটিংস
              </h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Key size={14} className="text-primary" />
                    Gemini API Key
                  </label>
                  <input 
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="আপনার Gemini API কি দিন..."
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all font-mono"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Key size={14} className="text-purple-500" />
                      Gemini API Key
                    </label>
                    <button 
                      type="button"
                      onClick={addBackupKey}
                      className="p-1 hover:bg-white/5 rounded text-primary transition-colors"
                      title="Add another key"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {backupApiKeys.map((key, index) => (
                      <div key={index} className="flex gap-2">
                        <input 
                          type="password"
                          value={key}
                          onChange={(e) => updateBackupKey(index, e.target.value)}
                          placeholder={`Gemini API Key ${index + 2} দিন...`}
                          className="flex-1 bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition-all font-mono"
                        />
                        {backupApiKeys.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => removeBackupKey(index)}
                            className="p-3 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-xl border border-white/10 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <AlertCircle size={14} className="text-primary mt-0.5 shrink-0" />
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    একাধিক API Key যোগ করলে একটির লিমিট শেষ হলে অন্যটি অটোমেটিক ব্যবহার হবে। এটি আপনার সার্ভিসকে নিরবিচ্ছিন্ন রাখবে।
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                >
                  বাতিল
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-primary text-white font-bold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={16} />
                      সেভ করুন
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
