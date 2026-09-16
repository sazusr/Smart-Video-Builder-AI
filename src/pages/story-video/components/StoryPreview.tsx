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

  const cardClassName = "bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-2xl p-3.5 sm:p-5 mb-3 sm:mb-4";

  const badgeStyle = (color: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    background: `${color}15`,
    border: `1px solid ${color}30`,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 600,
    color: color,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-0"
    >
      {/* Title Card */}
      <div className={cardClassName}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              📖 গল্পের শিরোনাম
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-[var(--text-primary)] m-0 leading-snug">
              {story.title}
            </h2>
          </div>
          <button
            onClick={() => copyToClipboard(story.title, 'title')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--text-muted)' }}
          >
            {copiedField === 'title' ? <CheckCheck size={16} color="#22d3a0" /> : <Copy size={16} />}
          </button>
        </div>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed m-0 italic">
          "{story.logline}"
        </p>
      </div>

      {/* Story Arc */}
      <div className={cardClassName}>
        <div className="text-xs sm:text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
          <span>🎭</span> <span>গল্পের গঠন (Story Arc)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
          {[
            { label: 'সূচনা', text: story.storyArc.beginning, color: '#60a5fa', icon: '🌅' },
            { label: 'দ্বন্দ্ব', text: story.storyArc.conflict, color: '#f59e0b', icon: '⚡' },
            { label: 'চরমবিন্দু', text: story.storyArc.climax, color: '#ef4444', icon: '🔥' },
            { label: 'সমাপ্তি', text: story.storyArc.ending, color: '#22d3a0', icon: '✨' },
          ].map((arc, i) => (
            <motion.div
              key={arc.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{
                background: `${arc.color}08`,
                border: `1px solid ${arc.color}20`,
              }}
              className="p-2.5 sm:p-3.5 rounded-xl"
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: arc.color, marginBottom: 4 }}>
                {arc.icon} {arc.label}
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed m-0">
                {arc.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Full Story */}
      <div className={cardClassName}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <BookOpen size={16} color="#a78bfa" />
            সম্পূর্ণ গল্প
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => copyToClipboard(story.completeStory, 'story')}
              style={{ ...badgeStyle('#60a5fa'), cursor: 'pointer', border: 'none' }}
            >
              {copiedField === 'story' ? <CheckCheck size={12} /> : <Copy size={12} />}
              {copiedField === 'story' ? 'কপি হয়েছে' : 'কপি'}
            </button>
            <button
              onClick={() => setEditing(!editing)}
              style={{ ...badgeStyle('#f59e0b'), cursor: 'pointer', border: 'none' }}
            >
              <Edit3 size={12} />
              {editing ? 'বাতিল' : 'সম্পাদনা'}
            </button>
          </div>
        </div>

        {editing ? (
          <div>
            <textarea
              value={editedStory}
              onChange={e => setEditedStory(e.target.value)}
              rows={12}
              style={{
                width: '100%',
                padding: '16px',
                background: 'var(--bg-secondary)',
                border: '1px solid #6c47ff50',
                borderRadius: 14,
                color: 'var(--text-primary)',
                fontSize: 14,
                lineHeight: 1.7,
                resize: 'vertical',
                outline: 'none',
              }}
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSaveEdit}
              style={{
                marginTop: 10,
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #22d3a0, #10b981)',
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Check size={14} /> সংরক্ষণ করুন
            </motion.button>
          </div>
        ) : (
          <div>
            <p style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              margin: 0,
              whiteSpace: 'pre-wrap',
              maxHeight: showFullStory ? 'none' : 200,
              overflow: 'hidden',
              position: 'relative',
            }}>
              {story.completeStory}
            </p>
            {story.completeStory.length > 400 && (
              <button
                onClick={() => setShowFullStory(!showFullStory)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#a78bfa',
                  fontSize: 13,
                  fontWeight: 600,
                  marginTop: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: 0,
                }}
              >
                {showFullStory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showFullStory ? 'কম দেখুন' : 'সম্পূর্ণ পড়ুন'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className={cardClassName}>
        <div className="text-xs sm:text-sm font-bold text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
          <span>📝</span> <span>সারসংক্ষেপ</span>
        </div>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed m-0">
          {story.summary}
        </p>
      </div>

      {/* Characters & Locations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-2xl p-3 sm:p-4">
          <div className="text-xs sm:text-sm font-bold text-[var(--text-primary)] mb-2">
            👤 চরিত্রসমূহ ({story.characters.length})
          </div>
          <div className="space-y-1">
            {story.characters.map((char, i) => (
              <div key={i} className="px-2.5 py-1 bg-[var(--bg-secondary)] rounded-lg text-xs text-[var(--text-secondary)] truncate">
                {char}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-2xl p-3 sm:p-4">
          <div className="text-xs sm:text-sm font-bold text-[var(--text-primary)] mb-2">
            📍 লোকেশন ({story.locations.length})
          </div>
          <div className="space-y-1">
            {story.locations.map((loc, i) => (
              <div key={i} className="px-2.5 py-1 bg-[var(--bg-secondary)] rounded-lg text-xs text-[var(--text-secondary)] truncate">
                {loc}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRegenerate}
          disabled={loading}
          className="flex-1 py-2.5 sm:py-3 px-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} />
          <span>🔄 আবার তৈরি করুন</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onApprove}
          disabled={loading}
          className="flex-[2] py-3 sm:py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          <Check size={16} />
          <span>✅ গল্প Approve করুন</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
