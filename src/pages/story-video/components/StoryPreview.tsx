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

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border-light)',
    borderRadius: 20,
    padding: '20px',
    marginBottom: 16,
  };

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
      style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
    >
      {/* Title Card */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              📖 গল্পের শিরোনাম
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
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
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
          "{story.logline}"
        </p>
      </div>

      {/* Story Arc */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          🎭 গল্পের গঠন (Story Arc)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
                padding: '14px',
                background: `${arc.color}08`,
                border: `1px solid ${arc.color}20`,
                borderRadius: 14,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: arc.color, marginBottom: 6 }}>
                {arc.icon} {arc.label}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {arc.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Full Story */}
      <div style={cardStyle}>
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
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          📝 সারসংক্ষেপ
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
          {story.summary}
        </p>
      </div>

      {/* Characters & Locations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
            👤 চরিত্রসমূহ ({story.characters.length})
          </div>
          {story.characters.map((char, i) => (
            <div key={i} style={{
              padding: '6px 10px',
              background: 'var(--bg-secondary)',
              borderRadius: 8,
              fontSize: 13,
              color: 'var(--text-secondary)',
              marginBottom: 4,
            }}>
              {char}
            </div>
          ))}
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
            📍 লোকেশন ({story.locations.length})
          </div>
          {story.locations.map((loc, i) => (
            <div key={i} style={{
              padding: '6px 10px',
              background: 'var(--bg-secondary)',
              borderRadius: 8,
              fontSize: 13,
              color: 'var(--text-secondary)',
              marginBottom: 4,
            }}>
              {loc}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRegenerate}
          disabled={loading}
          style={{
            flex: 1,
            padding: '16px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-light)',
            borderRadius: 14,
            color: 'var(--text-secondary)',
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <RefreshCw size={16} />
          🔄 আবার তৈরি করুন
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onApprove}
          disabled={loading}
          style={{
            flex: 2,
            padding: '16px',
            background: 'linear-gradient(135deg, #22d3a0 0%, #10b981 100%)',
            border: 'none',
            borderRadius: 14,
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 6px 24px rgba(34, 211, 160, 0.3)',
          }}
        >
          <Check size={18} />
          ✅ গল্প Approve করুন
        </motion.button>
      </div>
    </motion.div>
  );
}
