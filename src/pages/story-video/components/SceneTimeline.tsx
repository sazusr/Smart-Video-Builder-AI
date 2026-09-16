import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Clock, RefreshCw, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { StoryScene } from '../../../types/storyVideo';
import SceneCard from './SceneCard';

interface SceneTimelineProps {
  scenes: StoryScene[];
  onEditScene: (sceneId: string) => void;
  onDeleteScene: (sceneId: string) => void;
  onRegenerate: () => void;
  onApprove: () => void;
  loading: boolean;
}

export default function SceneTimeline({
  scenes,
  onEditScene,
  onDeleteScene,
  onRegenerate,
  onApprove,
  loading
}: SceneTimelineProps) {
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());
  const [showAllScenes, setShowAllScenes] = useState(false);

  const totalDuration = useMemo(() => 
    scenes.reduce((acc, scene) => acc + scene.durationSeconds, 0),
  [scenes]);

  const toggleExpandAll = () => {
    if (expandedScenes.size === scenes.length) {
      setExpandedScenes(new Set());
    } else {
      setExpandedScenes(new Set(scenes.map(s => s.sceneId)));
    }
  };

  const isAllExpanded = scenes.length > 0 && expandedScenes.size === scenes.length;
  
  const visibleScenes = showAllScenes ? scenes : scenes.slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* Top summary bar */}
      <div 
        style={{ 
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          borderRadius: '12px',
          gap: '16px',
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-light)' 
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            backgroundColor: 'var(--bg-secondary)', 
            padding: '6px 14px', 
            borderRadius: '9999px',
            border: '1px solid var(--border-light)'
          }}>
            <Film size={16} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
              মোট সিন: {scenes.length}
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            backgroundColor: 'var(--bg-secondary)', 
            padding: '6px 14px', 
            borderRadius: '9999px',
            border: '1px solid var(--border-light)'
          }}>
            <Clock size={16} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
              মোট সময়: {totalDuration} সেকেন্ড
            </span>
          </div>
        </div>
        
        <button
          onClick={toggleExpandAll}
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: 'var(--bg-overlay-5)',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            fontSize: '0.875rem'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--border-light)')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-overlay-5)')}
        >
          {isAllExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <span>{isAllExpanded ? 'সবগুলো গুটিয়ে নিন' : 'সবগুলো সম্প্রসারণ করুন'}</span>
        </button>
      </div>

      {/* Timeline */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        paddingLeft: '20px',
        borderLeft: '2px solid var(--accent-primary)',
        marginLeft: '8px'
      }}>
        <AnimatePresence>
          {visibleScenes.map((scene, index) => {
            const isExpanded = expandedScenes.has(scene.sceneId);
            
            return (
              <motion.div
                key={scene.sceneId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <SceneCard
                  scene={scene}
                  index={index}
                  totalScenes={scenes.length}
                  expanded={isExpanded}
                  onToggleExpand={() => {
                    const newSet = new Set(expandedScenes);
                    if (isExpanded) {
                      newSet.delete(scene.sceneId);
                    } else {
                      newSet.add(scene.sceneId);
                    }
                    setExpandedScenes(newSet);
                  }}
                  onEdit={() => onEditScene(scene.sceneId)}
                  onDelete={() => onDeleteScene(scene.sceneId)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Show more button */}
      {!showAllScenes && scenes.length > 3 && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}
        >
          <button
            onClick={() => setShowAllScenes(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-panel)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-panel)';
            }}
          >
            <ChevronDown size={18} />
            <span>আরো দেখুন ({scenes.length - 3})</span>
          </button>
        </motion.div>
      )}

      {/* Bottom Summary & Actions */}
      <div 
        style={{ 
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px',
          borderRadius: '12px',
          marginTop: '8px',
          gap: '24px',
          background: 'linear-gradient(to right, var(--bg-card), var(--bg-secondary))',
          border: '1px solid var(--border-light)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--text-primary)', fontWeight: 600 }}>
            স্ট্যাটাস সামারি
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            মোট {scenes.length}টি সিন, মোট ভিডিও দৈর্ঘ্য {totalDuration} সেকেন্ড।
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={onRegenerate}
            disabled={loading}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              borderRadius: '12px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              backgroundColor: 'var(--bg-overlay-5)', 
              color: 'var(--text-primary)',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--border-light)'; }}
            onMouseOut={(e) => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--bg-overlay-5)'; }}
          >
            <motion.div
              animate={{ rotate: loading ? 360 : 0 }}
              transition={{ repeat: loading ? Infinity : 0, duration: 1, ease: "linear" }}
              style={{ display: 'flex' }}
            >
              <RefreshCw size={18} />
            </motion.div>
            <span>আবার তৈরি করুন</span>
          </button>
          
          <button
            onClick={onApprove}
            disabled={loading || scenes.length === 0}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 32px',
              borderRadius: '12px',
              border: 'none',
              cursor: (loading || scenes.length === 0) ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              background: 'var(--gradient-brand)', 
              color: '#ffffff',
              opacity: (loading || scenes.length === 0) ? 0.7 : 1,
              transition: 'opacity 0.2s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => { if (!loading && scenes.length > 0) e.currentTarget.style.opacity = '0.9'; }}
            onMouseOut={(e) => { if (!loading && scenes.length > 0) e.currentTarget.style.opacity = '1'; }}
          >
            <Check size={18} />
            <span>অনুমোদন করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
}
