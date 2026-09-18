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
    <div className="w-full flex flex-col max-w-5xl mx-auto gap-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 m-0 mb-3 text-slate-200">
            <span>📋</span> <span>Veo Video Prompts</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#131926] border border-slate-800 text-slate-400">
              <Film size={14} /> <span>{scenes.length} সিন</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#131926] border border-slate-800 text-slate-400">
              <Clock size={14} /> <span>{totalDuration} সেকেন্ড</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#131926] border border-slate-800 text-slate-400">
              <span>{aspectRatio}</span>
            </span>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={handleCopyAll}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold cursor-pointer border border-slate-700 bg-[#1e293b] text-slate-200 text-sm hover:bg-slate-800 transition-colors">
            {copiedAll ? <CheckCheck size={16} className="text-emerald-500" /> : <Copy size={16} />}
            <span>{copiedAll ? 'কপি হয়েছে' : 'সবগুলো কপি'}</span>
          </button>
          <button onClick={handleExportText}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold cursor-pointer border-none bg-yellow-500 hover:bg-yellow-400 text-[#090d16] text-sm transition-colors shadow-sm">
            <Download size={16} /> <span>ডাউনলোড</span>
          </button>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-200">
              পেস্ট করা অগ্রগতি
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              doneCount === scenes.length 
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
            }`}>
              {doneCount}/{scenes.length} সিন ✓
            </span>
          </div>
          {doneCount > 0 && (
            <button onClick={resetAll}
              className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded-lg transition-colors">
              <RotateCcw size={14} /> রিসেট
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-[#131926] border border-slate-800/50 rounded-full overflow-hidden mb-4">
          <motion.div
            animate={{ width: `${scenes.length > 0 ? (doneCount / scenes.length) * 100 : 0}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={`h-full rounded-full ${doneCount === scenes.length ? 'bg-emerald-500' : 'bg-yellow-500'}`}
          />
        </div>

        {/* Scene dots */}
        <div className="flex flex-wrap gap-2">
          {scenes.map((scene, i) => {
            const isDone = doneSceneIds.has(scene.sceneId);
            return (
              <button
                key={scene.sceneId}
                onClick={() => toggleDone(scene.sceneId)}
                title={`সিন ${i + 1} — ${isDone ? 'সম্পন্ন, ক্লিক করলে রিসেট হবে' : 'ক্লিক করে সম্পন্ন মার্ক করুন'}`}
                className={`w-8 h-8 rounded-lg border-none cursor-pointer font-bold text-xs flex items-center justify-center transition-all ${
                  isDone 
                    ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30' 
                    : 'bg-[#131926] text-slate-500 hover:text-slate-300 hover:bg-[#1e293b]'
                }`}
              >
                {isDone ? '✓' : i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Guide Card */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-[#0f172a] shadow-sm">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h3 className="text-sm font-bold m-0 text-yellow-500">গুগল এআই স্টুডিও গাইড</h3>
          <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-200 bg-[#1e293b] border border-slate-700 hover:bg-slate-800 hover:text-white transition-colors no-underline">
            এআই স্টুডিও খুলুন <ExternalLink size={14} />
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-400">
          {['প্রম্পট কপি করুন', 'এআই স্টুডিওতে পেস্ট করুন', `রেশিও (${aspectRatio}) সিলেক্ট`, 'জেনারেট ও ডাউনলোড'].map((step, i) => (
            <div key={i} className="flex items-start gap-2 bg-[#131926] p-2.5 rounded-xl border border-slate-800/80">
              <div className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 bg-yellow-500 text-[#090d16]">
                {['১', '২', '৩', '৪'][i]}
              </div>
              <span className="mt-0.5">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scene Prompts List */}
      <div className="flex flex-col gap-5">
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
              className={`rounded-2xl relative overflow-hidden bg-[#0f172a] shadow-sm transition-all duration-300 ${
                isDone 
                  ? 'border border-emerald-500/30' 
                  : 'border border-slate-800'
              }`}
            >
              {/* Top accent line */}
              <div className={`absolute top-0 left-0 right-0 h-1 transition-colors duration-400 ${
                isDone ? 'bg-emerald-500' : 'bg-slate-700'
              }`} />

              <div className="p-4 sm:p-6 pb-2">
                {/* Scene header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Scene number badge */}
                    <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold text-sm transition-all ${
                      isDone ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30' : 'bg-[#131926] text-slate-300 border border-slate-800'
                    }`}>
                      {isDone ? '✓' : index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-bold text-slate-200">সিন {index + 1}</span>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-[#131926] border border-slate-800 text-slate-400">
                          {scene.durationSeconds}s
                        </span>
                        {isDone && (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            ✓ পেস্ট করা হয়েছে
                          </span>
                        )}
                      </div>
                      <p className="text-xs m-0 text-slate-400 leading-relaxed max-w-xl">
                        {scene.storySegment}
                      </p>
                    </div>
                  </div>

                  {/* Done Toggle Button */}
                  <button
                    onClick={() => toggleDone(scene.sceneId)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-none cursor-pointer text-xs font-semibold transition-all shrink-0 ${
                      isDone 
                        ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' 
                        : 'bg-[#131926] text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]'
                    }`}
                  >
                    {isDone ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    {isDone ? 'পেস্ট করেছি' : 'মার্ক করুন'}
                  </button>
                </div>

                {/* Video Prompt */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider">🎬 ভিডিও প্রম্পট</span>
                    <button
                      onClick={() => handleCopyScene(scene.sceneId, scene.videoPrompt)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-none cursor-pointer text-xs font-bold transition-colors ${
                        isPromptCopied 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-yellow-500 hover:bg-yellow-400 text-[#090d16]'
                      }`}
                    >
                      {isPromptCopied ? <CheckCheck size={14} /> : <Copy size={14} />}
                      {isPromptCopied ? 'কপি হয়েছে ✓' : 'কপি প্রম্পট'}
                    </button>
                  </div>
                  <div className={`p-4 rounded-xl text-sm whitespace-pre-wrap leading-relaxed transition-colors duration-300 overflow-y-auto max-h-[250px] ${
                    isDone 
                      ? 'bg-emerald-500/5 text-slate-300 border border-emerald-500/10' 
                      : 'bg-[#090d16] text-slate-300 border border-slate-800/80'
                  }`}>
                    {scene.videoPrompt}
                  </div>
                </div>

                {/* Negative Prompt */}
                {scene.negativePrompt && (
                  <div className="mb-4">
                    <span className="text-[11px] font-bold block mb-2 text-rose-500 uppercase">⛔ Negative Prompt</span>
                    <div className="p-3 rounded-lg text-xs italic bg-rose-500/5 text-rose-400 border border-rose-500/10">
                      {scene.negativePrompt}
                    </div>
                  </div>
                )}
              </div>

              {/* Narration + Dialogue + Continuity */}
              {(scene.narration?.enabled || (scene.dialogue && scene.dialogue.length > 0) || scene.continuity) && (
                <div className="px-4 sm:px-6 pb-6 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-3">
                      {scene.narration?.enabled && (
                        <div className="p-4 rounded-xl border border-slate-800 bg-[#131926]">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                              <Mic size={14} className="text-yellow-500" /> ন্যারেশন
                            </div>
                            <button onClick={() => handleCopyNarration(scene.sceneId, scene.narration!.text)}
                              className={`text-xs flex items-center gap-1 cursor-pointer border-none bg-transparent hover:text-white transition-colors ${
                                isNarrationCopied ? 'text-emerald-500' : 'text-slate-500'
                              }`}>
                              {isNarrationCopied ? <CheckCheck size={14} /> : <Copy size={14} />} কপি
                            </button>
                          </div>
                          <p className="text-sm italic m-0 text-slate-400 leading-relaxed">"{scene.narration.text}"</p>
                        </div>
                      )}

                      {scene.dialogue && scene.dialogue.length > 0 && (
                        <div className="p-4 rounded-xl border border-slate-800 bg-[#131926]">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                              <MessageCircle size={14} className="text-yellow-500" /> ডায়ালগ
                            </div>
                            <button onClick={() => handleCopyDialogue(scene.sceneId, dialogueText)}
                              className={`text-xs flex items-center gap-1 cursor-pointer border-none bg-transparent hover:text-white transition-colors ${
                                isDialogueCopied ? 'text-emerald-500' : 'text-slate-500'
                              }`}>
                              {isDialogueCopied ? <CheckCheck size={14} /> : <Copy size={14} />} কপি
                            </button>
                          </div>
                          <div className="flex flex-col gap-2">
                            {scene.dialogue.map((d, i) => (
                              <div key={i} className="text-sm">
                                <span className="font-bold text-yellow-500/90">{d.speaker}:</span>{' '}
                                <span className="text-slate-300">"{d.text}"</span>
                                <span className="text-[10px] ml-1.5 opacity-50 text-slate-400">({d.emotion})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {scene.continuity && (
                      <div className="p-4 rounded-xl border border-slate-800 bg-[#131926] h-fit">
                        <h5 className="text-xs font-bold mb-3 mt-0 text-slate-300">কন্টিনিউটি নোটস</h5>
                        <div className="flex flex-col gap-2 text-xs text-slate-400">
                          {scene.continuity.previousScene && <div><span className="font-bold text-slate-300">আগের:</span> {scene.continuity.previousScene}</div>}
                          <div><span className="font-bold text-slate-300">বর্তমান:</span> {scene.continuity.currentScene}</div>
                          {scene.continuity.nextScene && <div><span className="font-bold text-slate-300">পরবর্তী:</span> {scene.continuity.nextScene}</div>}
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
