import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, CheckCheck, Download, ExternalLink, Film, Clock, MessageCircle, Mic, CheckCircle2, Circle, RotateCcw } from 'lucide-react';
import type { StoryScene, CharacterProfile, AspectRatio } from '../../../types/storyVideo';

interface PromptExportProps {
  scenes: StoryScene[];
  characterBible: CharacterProfile[];
  aspectRatio: AspectRatio;
  projectId?: string;
}

// LocalStorage key per project
const getStorageKey = (projectId: string) => `prompt_done_${projectId}`;

export default function PromptExport({ scenes, characterBible, aspectRatio, projectId = 'default' }: PromptExportProps) {
  const storageKey = getStorageKey(projectId);

  // Load persisted "done" state from localStorage
  const [doneSceneIds, setDoneSceneIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSceneIds, setCopiedSceneIds] = useState<Set<string>>(new Set());
  const [copiedNarrationIds, setCopiedNarrationIds] = useState<Set<string>>(new Set());
  const [copiedDialogueIds, setCopiedDialogueIds] = useState<Set<string>>(new Set());

  const totalDuration = useMemo(() => scenes.reduce((acc, scene) => acc + scene.durationSeconds, 0), [scenes]);
  const doneCount = doneSceneIds.size;

  // Toggle a scene as "done/used"
  const toggleDone = useCallback((sceneId: string) => {
    setDoneSceneIds(prev => {
      const next = new Set(prev);
      if (next.has(sceneId)) {
        next.delete(sceneId);
      } else {
        next.add(sceneId);
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, [storageKey]);

  // Reset all done states
  const resetAll = () => {
    setDoneSceneIds(new Set());
    try { localStorage.removeItem(storageKey); } catch {}
  };

  const generateFullText = () => {
    let text = '';
    scenes.forEach((scene, index) => {
      text += `=== Scene ${index + 1} (${scene.durationSeconds}s) — ${scene.storySegment} ===\n\n`;
      text += `VIDEO PROMPT:\n${scene.videoPrompt}\n\n`;
      if (scene.negativePrompt) {
        text += `NEGATIVE PROMPT:\n${scene.negativePrompt}\n\n`;
      }
      if (scene.narration && scene.narration.enabled) {
        text += `NARRATION:\n${scene.narration.text}\n\n`;
      }
      if (scene.dialogue && scene.dialogue.length > 0) {
        text += `DIALOGUE:\n`;
        scene.dialogue.forEach(d => {
          text += `${d.speaker}: ${d.text} (${d.emotion})\n`;
        });
        text += `\n`;
      }
      text += `---\n\n`;
    });
    return text.trim();
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(generateFullText());
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) { console.error('Failed to copy', err); }
  };

  const handleExportText = () => {
    const blob = new Blob([generateFullText()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'veo-prompts.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyScene = async (sceneId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      const newSet = new Set(copiedSceneIds);
      newSet.add(sceneId);
      setCopiedSceneIds(newSet);
      // Auto-mark as done when copied
      setDoneSceneIds(prev => {
        const next = new Set(prev);
        next.add(sceneId);
        try { localStorage.setItem(storageKey, JSON.stringify([...next])); } catch {}
        return next;
      });
      setTimeout(() => {
        setCopiedSceneIds(prev => { const s = new Set(prev); s.delete(sceneId); return s; });
      }, 2000);
    } catch (err) { console.error('Failed to copy scene prompt', err); }
  };

  const handleCopyNarration = async (sceneId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      const newSet = new Set(copiedNarrationIds);
      newSet.add(sceneId);
      setCopiedNarrationIds(newSet);
      setTimeout(() => {
        setCopiedNarrationIds(prev => { const s = new Set(prev); s.delete(sceneId); return s; });
      }, 2000);
    } catch (err) { console.error('Failed to copy narration', err); }
  };

  const handleCopyDialogue = async (sceneId: string, dialogueText: string) => {
    try {
      await navigator.clipboard.writeText(dialogueText);
      const newSet = new Set(copiedDialogueIds);
      newSet.add(sceneId);
      setCopiedDialogueIds(newSet);
      setTimeout(() => {
        setCopiedDialogueIds(prev => { const s = new Set(prev); s.delete(sceneId); return s; });
      }, 2000);
    } catch (err) { console.error('Failed to copy dialogue', err); }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--text-primary)' }}>
            📋 Veo Video Prompts
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 500, padding: '4px 12px', borderRadius: '99px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              <Film size={13} /> {scenes.length} সিন
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 500, padding: '4px 12px', borderRadius: '99px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              <Clock size={13} /> {totalDuration} সেকেন্ড
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 500, padding: '4px 12px', borderRadius: '99px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              {aspectRatio}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button onClick={handleCopyAll}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13px' }}>
            {copiedAll ? <CheckCheck size={16} color="#4ade80" /> : <Copy size={16} />}
            {copiedAll ? 'কপি হয়েছে' : 'সবগুলো কপি'}
          </button>
          <button onClick={handleExportText}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', border: 'none', background: 'var(--gradient-brand)', color: '#fff', fontSize: '13px' }}>
            <Download size={16} /> ডাউনলোড
          </button>
        </div>
      </div>

      {/* Progress Tracker */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              পেস্ট করা অগ্রগতি
            </span>
            <span style={{
              fontSize: '13px', fontWeight: 700,
              padding: '3px 12px', borderRadius: '99px',
              background: doneCount === scenes.length ? '#10b98120' : '#f59e0b20',
              color: doneCount === scenes.length ? '#10b981' : '#f59e0b',
            }}>
              {doneCount}/{scenes.length} সিন ✓
            </span>
          </div>
          {doneCount > 0 && (
            <button onClick={resetAll}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '12px', padding: '4px 8px', borderRadius: '8px' }}>
              <RotateCcw size={12} /> রিসেট
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '99px', overflow: 'hidden', marginBottom: '12px' }}>
          <motion.div
            animate={{ width: `${scenes.length > 0 ? (doneCount / scenes.length) * 100 : 0}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ height: '100%', background: doneCount === scenes.length ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#6c47ff,#a78bfa)', borderRadius: '99px' }}
          />
        </div>

        {/* Scene dots */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {scenes.map((scene, i) => {
            const isDone = doneSceneIds.has(scene.sceneId);
            return (
              <button
                key={scene.sceneId}
                onClick={() => toggleDone(scene.sceneId)}
                title={`সিন ${i + 1} — ${isDone ? 'সম্পন্ন, ক্লিক করলে রিসেট হবে' : 'ক্লিক করে সম্পন্ন মার্ক করুন'}`}
                style={{
                  width: '32px', height: '32px', borderRadius: '10px', border: 'none',
                  cursor: 'pointer', fontWeight: 700, fontSize: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isDone ? '#10b98120' : 'var(--bg-secondary)',
                  color: isDone ? '#10b981' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                  outline: isDone ? '2px solid #10b98140' : 'none',
                }}
              >
                {isDone ? '✓' : i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Guide Card */}
      <div style={{ padding: '20px 24px', borderRadius: '16px', border: '1px solid var(--border-light)', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--accent-primary)' }}>গুগল এআই স্টুডিও গাইড</h3>
          <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, padding: '6px 14px', borderRadius: '8px', textDecoration: 'none', background: 'var(--gradient-brand)', color: 'white' }}>
            এআই স্টুডিও খুলুন <ExternalLink size={13} />
          </a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {['প্রম্পট কপি করুন', 'এআই স্টুডিওতে পেস্ট করুন', `রেশিও (${aspectRatio}) সিলেক্ট`, 'জেনারেট ও ডাউনলোড'].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '11px', flexShrink: 0, background: 'var(--gradient-brand)', color: '#fff' }}>
                {['১', '২', '৩', '৪'][i]}
              </div>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scene Prompts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {scenes.map((scene, index) => {
          const isPromptCopied = copiedSceneIds.has(scene.sceneId);
          const isNarrationCopied = copiedNarrationIds.has(scene.sceneId);
          const isDialogueCopied = copiedDialogueIds.has(scene.sceneId);
          const isDone = doneSceneIds.has(scene.sceneId);
          const dialogueText = scene.dialogue?.map(d => `${d.speaker}: ${d.text} (${d.emotion})`).join('\n') || '';

          return (
            <motion.div
              key={scene.sceneId}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.06, 0.4) }}
              style={{
                borderRadius: '16px',
                position: 'relative',
                overflow: 'hidden',
                background: isDone ? 'var(--bg-panel)' : 'var(--bg-panel)',
                border: isDone ? '1.5px solid #10b98150' : '1px solid var(--border)',
                boxShadow: isDone ? '0 0 0 2px #10b98110' : 'none',
                transition: 'border-color 0.3s, box-shadow 0.3s',
              }}
            >
              {/* Top accent line — green if done, gradient if not */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                background: isDone ? 'linear-gradient(90deg, #10b981, #34d399)' : 'var(--gradient-brand)',
                transition: 'background 0.4s',
              }} />

              <div style={{ padding: '20px 20px 0 20px' }}>
                {/* Scene header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {/* Scene number badge */}
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '14px',
                      background: isDone ? '#10b98120' : 'var(--bg-secondary)',
                      color: isDone ? '#10b981' : 'var(--text-primary)',
                      transition: 'all 0.3s',
                    }}>
                      {isDone ? '✓' : index + 1}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>সিন {index + 1}</span>
                        <span style={{ padding: '2px 8px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                          {scene.durationSeconds}s
                        </span>
                        {isDone && (
                          <span style={{ padding: '2px 10px', fontSize: '11px', fontWeight: 700, borderRadius: '99px', background: '#10b98120', color: '#10b981' }}>
                            ✓ পেস্ট করা হয়েছে
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '12px', margin: '2px 0 0', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {scene.storySegment}
                      </p>
                    </div>
                  </div>

                  {/* Done Toggle Button */}
                  <button
                    onClick={() => toggleDone(scene.sceneId)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '7px 14px', borderRadius: '10px', border: 'none',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                      background: isDone ? '#10b98120' : 'var(--bg-secondary)',
                      color: isDone ? '#10b981' : 'var(--text-muted)',
                      transition: 'all 0.25s',
                      flexShrink: 0,
                    }}
                  >
                    {isDone ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                    {isDone ? 'পেস্ট করেছি' : 'মার্ক করুন'}
                  </button>
                </div>

                {/* Video Prompt */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>🎬 ভিডিও প্রম্পট</span>
                    <button
                      onClick={() => handleCopyScene(scene.sceneId, scene.videoPrompt)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 14px', borderRadius: '8px', border: 'none',
                        cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                        background: isPromptCopied ? '#10b98120' : 'var(--gradient-brand)',
                        color: isPromptCopied ? '#10b981' : '#fff',
                        transition: 'all 0.2s',
                      }}
                    >
                      {isPromptCopied ? <CheckCheck size={14} /> : <Copy size={14} />}
                      {isPromptCopied ? 'কপি হয়েছে ✓' : 'কপি প্রম্পট'}
                    </button>
                  </div>
                  <div style={{
                    padding: '14px 16px', borderRadius: '12px', fontSize: '13px',
                    whiteSpace: 'pre-wrap', lineHeight: 1.7,
                    background: isDone ? '#10b98108' : 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid ' + (isDone ? '#10b98125' : 'var(--border-light)'),
                    maxHeight: '200px', overflowY: 'auto',
                    transition: 'background 0.3s, border-color 0.3s',
                  }}>
                    {scene.videoPrompt}
                  </div>
                </div>

                {/* Negative Prompt */}
                {scene.negativePrompt && (
                  <div style={{ marginBottom: '14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '6px', color: '#ef4444', textTransform: 'uppercase' }}>⛔ Negative Prompt</span>
                    <div style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontStyle: 'italic', background: 'rgba(239,68,68,0.05)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                      {scene.negativePrompt}
                    </div>
                  </div>
                )}
              </div>

              {/* Narration + Dialogue + Continuity */}
              {(scene.narration?.enabled || (scene.dialogue && scene.dialogue.length > 0) || scene.continuity) && (
                <div style={{ padding: '0 20px 20px', marginTop: '4px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {scene.narration?.enabled && (
                        <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'var(--bg-card)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              <Mic size={14} /> ন্যারেশন
                            </div>
                            <button onClick={() => handleCopyNarration(scene.sceneId, scene.narration!.text)}
                              style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', border: 'none', background: 'transparent', color: isNarrationCopied ? '#4ade80' : 'var(--text-muted)' }}>
                              {isNarrationCopied ? <CheckCheck size={13} /> : <Copy size={13} />} কপি
                            </button>
                          </div>
                          <p style={{ fontSize: '13px', fontStyle: 'italic', margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>"{scene.narration.text}"</p>
                        </div>
                      )}

                      {scene.dialogue && scene.dialogue.length > 0 && (
                        <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'var(--bg-card)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              <MessageCircle size={14} /> ডায়ালগ
                            </div>
                            <button onClick={() => handleCopyDialogue(scene.sceneId, dialogueText)}
                              style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', border: 'none', background: 'transparent', color: isDialogueCopied ? '#4ade80' : 'var(--text-muted)' }}>
                              {isDialogueCopied ? <CheckCheck size={13} /> : <Copy size={13} />} কপি
                            </button>
                          </div>
                          {scene.dialogue.map((d, i) => (
                            <div key={i} style={{ fontSize: '13px', marginBottom: '6px' }}>
                              <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{d.speaker}:</span>{' '}
                              <span style={{ color: 'var(--text-secondary)' }}>"{d.text}"</span>
                              <span style={{ fontSize: '11px', marginLeft: '6px', opacity: 0.5 }}>({d.emotion})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {scene.continuity && (
                      <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'var(--bg-card)', height: 'fit-content' }}>
                        <h5 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', marginTop: 0, color: 'var(--text-primary)' }}>কন্টিনিউটি নোটস</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {scene.continuity.previousScene && <div><span style={{ fontWeight: 600 }}>আগের:</span> {scene.continuity.previousScene}</div>}
                          <div><span style={{ fontWeight: 600 }}>বর্তমান:</span> {scene.continuity.currentScene}</div>
                          {scene.continuity.nextScene && <div><span style={{ fontWeight: 600 }}>পরবর্তী:</span> {scene.continuity.nextScene}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
