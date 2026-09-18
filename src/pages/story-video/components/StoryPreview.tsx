import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Edit3, RefreshCw, Check, ChevronDown, ChevronUp, Copy, CheckCheck } from 'lucide-react';
import type { GeneratedStory } from '../../../types/storyVideo';

interface StoryPreviewProps {
  story: GeneratedStory;
  onApprove: () => void;
  onRegenerate: () => void;
  onEdit: (story: GeneratedStory) => void;
  loading: boolean;
}

export default function StoryPreview({ story, onApprove, onRegenerate, onEdit, loading }: StoryPreviewProps) {
  const [editing, setEditing] = useState(false);
  const [editedStory, setEditedStory] = useState(story.completeStory);
  const [showFullStory, setShowFullStory] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveEdit = () => {
    onEdit({ ...story, completeStory: editedStory });
    setEditing(false);
  };

  const cardClassName = "bg-[#0f172a] border border-slate-800 rounded-2xl p-6 mb-6 shadow-sm";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col w-full max-w-5xl mx-auto"
    >
      {/* Title Card */}
      <div className={cardClassName}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs font-semibold text-yellow-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <BookOpen size={14} /> গল্পের শিরোনাম
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-200 m-0 leading-snug">
              {story.title}
            </h2>
          </div>
          <button
            onClick={() => copyToClipboard(story.title, 'title')}
            className="p-2 bg-[#131926] border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
            title="কপি করুন"
          >
            {copiedField === 'title' ? <CheckCheck size={16} className="text-emerald-500" /> : <Copy size={16} />}
          </button>
        </div>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed m-0 italic">
          "{story.logline}"
        </p>
      </div>

      {/* Story Arc */}
      <div className={cardClassName}>
        <div className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <span>🎭</span> <span>গল্পের গঠন (Story Arc)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'সূচনা', text: story.storyArc.beginning, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', icon: '🌅' },
            { label: 'দ্বন্দ্ব', text: story.storyArc.conflict, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: '⚡' },
            { label: 'চরমবিন্দু', text: story.storyArc.climax, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', icon: '🔥' },
            { label: 'সমাপ্তি', text: story.storyArc.ending, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: '✨' },
          ].map((arc, i) => (
            <motion.div
              key={arc.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-4 rounded-xl border ${arc.bg} ${arc.border}`}
            >
              <div className={`text-xs font-bold ${arc.color} mb-2 flex items-center gap-1.5`}>
                <span>{arc.icon}</span> {arc.label}
              </div>
              <p className="text-sm text-slate-300 leading-relaxed m-0">
                {arc.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Full Story */}
      <div className={cardClassName}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <BookOpen size={16} className="text-yellow-500" />
            সম্পূর্ণ গল্প
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(story.completeStory, 'story')}
              className="px-3 py-1.5 flex items-center gap-1.5 bg-[#131926] border border-slate-800 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            >
              {copiedField === 'story' ? <CheckCheck size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copiedField === 'story' ? 'কপি হয়েছে' : 'কপি'}
            </button>
            <button
              onClick={() => setEditing(!editing)}
              className="px-3 py-1.5 flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs font-medium text-yellow-500 hover:bg-yellow-500/20 transition-colors"
            >
              <Edit3 size={14} />
              {editing ? 'বাতিল' : 'সম্পাদনা'}
            </button>
          </div>
        </div>

        {editing ? (
          <div className="flex flex-col gap-3">
            <textarea
              value={editedStory}
              onChange={e => setEditedStory(e.target.value)}
              rows={12}
              className="w-full p-4 rounded-xl bg-[#090d16] border border-slate-700 text-slate-200 text-sm leading-relaxed focus:outline-none focus:border-yellow-500 resize-y"
            />
            <button
              onClick={handleSaveEdit}
              className="self-end px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#090d16] rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <Check size={16} /> সংরক্ষণ করুন
            </button>
          </div>
        ) : (
          <div className="relative">
            <p className={`text-sm sm:text-base text-slate-300 leading-relaxed m-0 whitespace-pre-wrap transition-all ${!showFullStory ? 'max-h-[300px] overflow-hidden' : ''}`}>
              {story.completeStory}
            </p>
            {story.completeStory.length > 600 && !showFullStory && (
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0f172a] to-transparent pointer-events-none" />
            )}
            {story.completeStory.length > 600 && (
              <button
                onClick={() => setShowFullStory(!showFullStory)}
                className="mt-4 px-4 py-2 bg-[#131926] border border-slate-800 rounded-xl text-sm font-medium text-yellow-500 hover:text-yellow-400 hover:border-slate-600 transition-colors flex items-center gap-2 mx-auto"
              >
                {showFullStory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showFullStory ? 'কম দেখুন' : 'সম্পূর্ণ পড়ুন'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className={cardClassName}>
        <div className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <span>📝</span> <span>সারসংক্ষেপ</span>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed m-0">
          {story.summary}
        </p>
      </div>

      {/* Characters & Locations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            👤 চরিত্রসমূহ ({story.characters.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {story.characters.map((char, i) => (
              <div key={i} className="px-3 py-1.5 bg-[#131926] border border-slate-800 rounded-lg text-sm text-slate-300">
                {char}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            📍 লোকেশন ({story.locations.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {story.locations.map((loc, i) => (
              <div key={i} className="px-3 py-1.5 bg-[#131926] border border-slate-800 rounded-lg text-sm text-slate-300">
                {loc}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-16">
        <motion.button
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          onClick={onRegenerate}
          disabled={loading}
          className="flex-1 py-4 px-6 rounded-2xl border border-slate-700 bg-[#1e293b] text-slate-200 text-base font-bold flex items-center justify-center gap-2.5 transition-colors hover:bg-slate-800 disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <RefreshCw size={18} />
          <span>আবার তৈরি করুন</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          onClick={onApprove}
          disabled={loading}
          className="flex-[2] py-4 px-6 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-[#090d16] text-base font-bold flex items-center justify-center gap-2.5 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <Check size={20} />
          <span>গল্প Approve করুন</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
