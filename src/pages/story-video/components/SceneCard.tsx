import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Copy, Trash2, Camera, Clock, MapPin, User, Volume2, Check, Sparkles, MessageCircle, Mic } from 'lucide-react';
import type { StoryScene } from '../../../types/storyVideo';

interface SceneCardProps {
  scene: StoryScene;
  index: number;
  totalScenes: number;
  onEdit: (sceneId: string) => void;
  onDelete: (sceneId: string) => void;
  expanded: boolean;
  onToggleExpand: (sceneId: string) => void;
}

export default function SceneCard({
  scene,
  index,
  totalScenes,
  onEdit,
  onDelete,
  expanded,
  onToggleExpand
}: SceneCardProps) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedNarration, setCopiedNarration] = useState(false);

  const handleCopyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(scene.videoPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyNarration = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scene.narration?.text) {
      navigator.clipboard.writeText(scene.narration.text);
      setCopiedNarration(true);
      setTimeout(() => setCopiedNarration(false), 2000);
    }
  };

  const getDurationColor = (duration: number) => {
    if (duration <= 4) return '#3b82f6';
    if (duration <= 6) return '#f59e0b';
    return '#10b981';
  };

  const pillStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.78rem',
    fontWeight: 500,
    background: 'var(--bg-secondary)',
    color: 'var(--text-secondary)',
  };

  return (
    <motion.div
      layout
      style={{
        background: 'var(--bg-panel)',
        border: expanded ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
        borderRadius: '16px',
        overflow: 'hidden',
        marginBottom: '12px',
        transition: 'border-color 0.3s',
      }}
    >
      {/* Header */}
      <div 
        onClick={() => onToggleExpand(scene.sceneId)}
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
      >
        {/* Scene Number */}
        <div style={{
          width: '30px',
          height: '30px',
          borderRadius: '10px',
          background: expanded ? 'var(--gradient-brand)' : 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '0.85rem',
          color: expanded ? '#fff' : 'var(--text-primary)',
          flexShrink: 0,
          transition: 'all 0.3s',
        }}>
          {index + 1}
        </div>
        
        {/* Duration Badge */}
        <div style={{
          ...pillStyle,
          background: `${getDurationColor(scene.durationSeconds)}15`,
          color: getDurationColor(scene.durationSeconds),
          fontWeight: 600,
          flexShrink: 0,
        }}>
          <Clock size={12} />
          {scene.durationSeconds}s
        </div>

        {/* Story Segment */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ 
            margin: 0, 
            color: 'var(--text-primary)', 
            whiteSpace: expanded ? 'normal' : 'nowrap',
            overflow: expanded ? 'visible' : 'hidden',
            textOverflow: expanded ? 'clip' : 'ellipsis',
            fontSize: '0.9rem',
            fontWeight: expanded ? 600 : 400,
            lineHeight: 1.4,
          }}>
            {scene.storySegment}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(scene.sceneId); }}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex',
            }}
            title="মুছে ফেলুন"
          >
            <Trash2 size={16} />
          </button>
          <div style={{ color: 'var(--text-muted)', display: 'flex', padding: '4px' }}>
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 16px 16px' }}>
              
              {/* Metadata Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <div style={pillStyle}>
                  <MapPin size={12} /> {scene.locationId}
                </div>
                {scene.characters.map((char, i) => (
                  <div key={i} style={pillStyle}>
                    <User size={12} /> {char}
                  </div>
                ))}
                <div style={pillStyle}>
                  <Camera size={12} /> {scene.camera.shotType} · {scene.camera.movement}
                </div>
                <div style={pillStyle}>
                  <Sparkles size={12} /> {scene.lighting}
                </div>
              </div>

              {/* Video Prompt Section */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🎬 ভিডিও প্রম্পট
                  </div>
                  <button
                    onClick={handleCopyPrompt}
                    style={{
                      background: copiedPrompt ? '#10b98120' : 'var(--bg-secondary)',
                      border: '1px solid ' + (copiedPrompt ? '#10b98140' : 'var(--border-light)'),
                      padding: '6px 14px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      color: copiedPrompt ? '#10b981' : 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                  >
                    {copiedPrompt ? <Check size={13} /> : <Copy size={13} />} 
                    {copiedPrompt ? 'কপি হয়েছে!' : 'কপি প্রম্পট'}
                  </button>
                </div>
                <div style={{ 
                  background: 'var(--bg-secondary)', 
                  padding: '14px', 
                  borderRadius: '12px', 
                  fontSize: '0.82rem', 
                  color: 'var(--text-secondary)', 
                  whiteSpace: 'pre-wrap', 
                  lineHeight: 1.6,
                  border: '1px solid var(--border-light)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}>
                  {scene.videoPrompt}
                </div>
              </div>
              
              {/* Negative Prompt */}
              {scene.negativePrompt && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#ef4444', marginBottom: '6px' }}>⛔ নেগেটিভ প্রম্পট</div>
                  <div style={{ 
                    background: '#ef444408', 
                    padding: '10px 14px', 
                    borderRadius: '10px', 
                    fontSize: '0.8rem', 
                    color: '#f87171', 
                    whiteSpace: 'pre-wrap', 
                    border: '1px solid #ef444420',
                    fontStyle: 'italic',
                  }}>
                    {scene.negativePrompt}
                  </div>
                </div>
              )}

              {/* Dialogue Section */}
              {scene.dialogue && scene.dialogue.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <MessageCircle size={14} /> ডায়ালগ
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {scene.dialogue.map((d, i) => (
                      <div key={i} style={{ 
                        padding: '10px 14px', 
                        background: 'var(--bg-secondary)', 
                        borderRadius: '12px', 
                        borderLeft: '3px solid var(--accent-primary)',
                      }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '2px' }}>
                          {d.speaker} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.72rem' }}>({d.emotion})</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          "{d.text}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Narration Section */}
              {scene.narration && scene.narration.enabled && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mic size={14} /> ন্যারেশন
                    </div>
                    <button
                      onClick={handleCopyNarration}
                      style={{
                        background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', 
                        color: copiedNarration ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem'
                      }}
                    >
                      {copiedNarration ? <Check size={12} /> : <Copy size={12} />}
                      {copiedNarration ? 'কপি হয়েছে' : 'কপি'}
                    </button>
                  </div>
                  <div style={{ 
                    padding: '12px 14px', 
                    background: 'var(--bg-secondary)', 
                    borderRadius: '12px', 
                    fontSize: '0.85rem', 
                    color: 'var(--text-secondary)', 
                    fontStyle: 'italic', 
                    lineHeight: 1.6,
                    borderLeft: '3px solid #f59e0b',
                  }}>
                    "{scene.narration.text}"
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      আবেগ: {scene.narration.emotion}
                    </div>
                  </div>
                </div>
              )}

              {/* Audio Info */}
              <div style={{ 
                display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '12px', borderTop: '1px dashed var(--border)',
              }}>
                <div style={{ ...pillStyle, fontSize: '0.72rem' }}>
                  🎵 BGM: {scene.audio.backgroundMusic}
                </div>
                {scene.audio.soundEffects.length > 0 && (
                  <div style={{ ...pillStyle, fontSize: '0.72rem' }}>
                    🔊 SFX: {scene.audio.soundEffects.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
