import React, { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, CheckCheck, Download, Volume2,
  Play, Pause, Square, Wand2, Music, Sparkles, ChevronDown, ChevronUp
} from "lucide-react";
import type { StoryScene, StoryProject } from "../../../types/storyVideo";
import {
  VOICE_OPTIONS,
  generateSpeech,
  downloadWav,
  createAudioBlobUrl,
  type SpeechSpeed,
  type SpeechMood,
} from "../../../services/ttsService";

interface AudioScriptProps {
  scenes: StoryScene[];
  project: StoryProject;
  apiKeys?: string[];
}

// Per-scene TTS state
interface SceneTtsState {
  voice: string;
  speed: SpeechSpeed;
  mood: SpeechMood;
  loading: boolean;
  audioUrl: string | null;
  wavBuffer: ArrayBuffer | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  expanded: boolean;
}

const defaultTts = (): SceneTtsState => ({
  voice: "Charon",
  speed: "normal",
  mood: "normal",
  loading: false,
  audioUrl: null,
  wavBuffer: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  expanded: false,
});

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AudioScript({ scenes, project, apiKeys = [] }: AudioScriptProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Record<string, string>>({});

  // Per-scene TTS state map
  const [ttsStates, setTtsStates] = useState<Record<string, SceneTtsState>>(() =>
    Object.fromEntries(scenes.map(s => [s.sceneId, defaultTts()]))
  );

  // Audio element refs per scene
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  // Global voice selector (applied when generating all)
  const [globalVoice, setGlobalVoice] = useState("Charon");
  const [globalSpeed, setGlobalSpeed] = useState<SpeechSpeed>("normal");
  const [globalMood, setGlobalMood] = useState<SpeechMood>("normal");
  const [generatingAll, setGeneratingAll] = useState(false);

  // Get API keys from sessionStorage-style approach via window
  const getApiKeys = (): { primary: string; all: string[] } => {
    try {
      // ttsService already handles key retrieval; we pass empty here and let
      // the caller supply keys. We read from localStorage same as dashboard.
      const stored = localStorage.getItem("app_api_keys");
      if (stored) {
        const keys: string[] = JSON.parse(stored);
        return { primary: keys[0] || "", all: keys };
      }
    } catch {}
    return { primary: "", all: [] };
  };

  // Build script text for a scene
  const buildSceneScript = (scene: StoryScene): string => {
    const parts: string[] = [];
    if (scene.narration?.enabled && scene.narration.text?.trim()) {
      const em = scene.narration.emotion ? `[${scene.narration.emotion}] ` : "";
      parts.push(`${em}${scene.narration.text.trim()}`);
    }
    if (scene.dialogue?.length) {
      scene.dialogue.forEach(d => {
        if (d.text?.trim()) {
          const em = d.emotion ? `[${d.emotion}] ` : "";
          parts.push(`${d.speaker}: ${em}"${d.text.trim()}"`);
        }
      });
    }
    if (!parts.length && scene.storySegment?.trim()) {
      parts.push(scene.storySegment.trim());
    }
    return parts.join("\n");
  };

  const fullScript = useMemo(() => {
    return scenes.map((scene, i) => ({
      index: i,
      sceneId: scene.sceneId,
      duration: scene.durationSeconds,
      sceneContext: scene.storySegment,
      scriptText: buildSceneScript(scene),
    }));
  }, [scenes]);

  const generateFullScriptText = () => {
    const header = `🎙️ অডিও স্ক্রিপ্ট — ${project.story?.title || "অজানা গল্প"}\n${"═".repeat(50)}\n\n`;
    const body = fullScript
      .map(s => `[সিন ${s.index + 1} — ${s.duration}s]\n${s.scriptText}`)
      .join("\n\n---\n\n");
    return header + body;
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(generateFullScriptText());
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {}
  };

  const handleCopyScene = async (sceneId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [sceneId]: "copied" }));
      setTimeout(() => setCopiedStates(prev => { const n = { ...prev }; delete n[sceneId]; return n; }), 2000);
    } catch {}
  };

  const handleDownload = () => {
    const blob = new Blob([generateFullScriptText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audio-script-${(project.story?.title || "story").replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Update a single scene's TTS state field
  const updateTts = (sceneId: string, patch: Partial<SceneTtsState>) => {
    setTtsStates(prev => ({ ...prev, [sceneId]: { ...prev[sceneId], ...patch } }));
  };

  // Read API keys — props first, then localStorage fallback
  const readAllKeys = (): string[] => {
    if (apiKeys && apiKeys.length > 0) return apiKeys.filter(Boolean);
    // localStorage fallback
    const tryParse = (key: string) => {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as string[] : []; } catch { return []; }
    };
    const userKeys  = tryParse("user_api_keys");
    const adminKeys = tryParse("admin_api_keys");
    return Array.from(new Set([...userKeys, ...adminKeys].filter(Boolean)));
  };

  // Generate TTS for one scene
  const handleGenerate = async (sceneId: string) => {
    const st = ttsStates[sceneId];
    const script = buildSceneScript(scenes.find(s => s.sceneId === sceneId)!);
    if (!script.trim()) { alert("এই সিনে কোনো স্ক্রিপ্ট নেই।"); return; }

    // Stop existing audio
    if (audioRefs.current[sceneId]) {
      audioRefs.current[sceneId]!.pause();
      audioRefs.current[sceneId] = null;
    }
    if (st.audioUrl) URL.revokeObjectURL(st.audioUrl);
    updateTts(sceneId, { loading: true, audioUrl: null, wavBuffer: null, isPlaying: false, progress: 0 });

    try {
      const keys = readAllKeys();
      const wavBuffer = await generateSpeech({
        script, voiceId: st.voice, speed: st.speed, mood: st.mood,
        primaryKey: keys[0], allKeys: keys,
      });
      const blobUrl = createAudioBlobUrl(wavBuffer);
      updateTts(sceneId, { loading: false, audioUrl: blobUrl, wavBuffer });
    } catch (e: any) {
      updateTts(sceneId, { loading: false });
      const msg = e?.message || "";
      if (msg === "API_KEY_MISSING" || msg.includes("API_KEY_MISSING")) {
        alert("Dashboard > Settings-এ Gemini API Key যোগ করুন!");
      } else if (msg === "QUOTA_EXCEEDED") {
        alert("API Quota শেষ হয়ে গেছে।");
      } else {
        alert(msg || "অডিও তৈরি করতে সমস্যা হয়েছে।");
      }
    }
  };

  // Play/Pause
  const handlePlayPause = (sceneId: string) => {
    const st = ttsStates[sceneId];
    if (!st.audioUrl) return;
    if (!audioRefs.current[sceneId]) {
      const audio = new Audio(st.audioUrl);
      audio.ontimeupdate = () => updateTts(sceneId, { progress: audio.currentTime });
      audio.onloadedmetadata = () => updateTts(sceneId, { duration: audio.duration });
      audio.onended = () => updateTts(sceneId, { isPlaying: false, progress: 0 });
      audioRefs.current[sceneId] = audio;
    }
    const audio = audioRefs.current[sceneId]!;
    if (st.isPlaying) { audio.pause(); updateTts(sceneId, { isPlaying: false }); }
    else { audio.play(); updateTts(sceneId, { isPlaying: true }); }
  };

  const handleStop = (sceneId: string) => {
    const audio = audioRefs.current[sceneId];
    if (audio) { audio.pause(); audio.currentTime = 0; }
    updateTts(sceneId, { isPlaying: false, progress: 0 });
  };

  const handleSeek = (sceneId: string, val: number) => {
    const audio = audioRefs.current[sceneId];
    if (audio) audio.currentTime = val;
    updateTts(sceneId, { progress: val });
  };

  const totalDuration = scenes.reduce((acc, s) => acc + s.durationSeconds, 0);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="w-full flex flex-col max-w-5xl mx-auto gap-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-200 m-0 mb-3 flex items-center gap-2">
            <span>🎤</span> <span>AI অডিও স্ক্রিপ্ট</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: "🎬", label: `${scenes.length} সিন` },
              { icon: "⏱️", label: `${totalDuration} সেকেন্ড` },
              { icon: "🎙️", label: "Gemini TTS" },
            ].map((b, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#131926] border border-slate-800 text-slate-400">
                <span>{b.icon}</span> <span>{b.label}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={handleCopyAll}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold cursor-pointer border border-slate-700 bg-[#1e293b] text-slate-200 text-sm hover:bg-slate-800 transition-colors">
            {copiedAll ? <CheckCheck size={16} className="text-emerald-500" /> : <Copy size={16} />}
            <span>{copiedAll ? "কপি হয়েছে ✓" : "স্ক্রিপ্ট কপি"}</span>
          </button>
          <button onClick={handleDownload}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold cursor-pointer border-none bg-yellow-500 hover:bg-yellow-400 text-[#090d16] text-sm transition-colors shadow-sm">
            <Download size={16} /> <span>ডাউনলোড</span>
          </button>
        </div>
      </div>

      {/* Global TTS Config — "Generate All" */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-yellow-500/10 text-yellow-500 p-2.5 rounded-xl shrink-0 border border-yellow-500/20">
            <Music size={18} />
          </div>
          <div>
            <div className="text-base font-bold text-slate-200 leading-snug">AI ভয়েসওভার — সব সিন একসাথে</div>
            <div className="text-sm text-slate-400">ভয়েস ও স্টাইল বেছে নিন, তারপর সব সিনের অডিও তৈরি করুন</div>
          </div>
        </div>

        {/* Voice grid */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-5">
          {VOICE_OPTIONS.map(v => (
            <button key={v.id} type="button" onClick={() => setGlobalVoice(v.id)}
              className={`rounded-xl p-3 cursor-pointer text-center transition-all ${
                globalVoice === v.id 
                  ? 'bg-yellow-500/10 border border-yellow-500/50 shadow-sm' 
                  : 'bg-[#131926] border border-slate-800 hover:border-slate-700'
              }`}>
              <div className="text-xl sm:text-2xl mb-1">
                {v.id === "Puck" ? "⚡" : v.id === "Charon" ? "🎙️" : v.id === "Kore" ? "🌟" : v.id === "Fenrir" ? "🔥" : "🌙"}
              </div>
              <div className={`text-xs font-bold truncate mb-1 ${globalVoice === v.id ? 'text-yellow-500' : 'text-slate-300'}`}>{v.name}</div>
              <div className="text-[10px] text-slate-500 leading-tight truncate">{v.description}</div>
            </button>
          ))}
        </div>

        {/* Speed + Mood */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[140px]">
            <div className="text-xs font-bold text-slate-500 mb-2">স্পিড</div>
            <div className="flex gap-2">
              {(["slow", "normal", "fast"] as SpeechSpeed[]).map(s => (
                <button key={s} type="button" onClick={() => setGlobalSpeed(s)} className={`
                  flex-1 py-2 px-1 rounded-lg border text-xs font-semibold cursor-pointer transition-colors
                  ${globalSpeed === s ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-500" : "bg-[#131926] border-slate-800 text-slate-400 hover:border-slate-700"}
                `}>
                  {s === "slow" ? "🐢 ধীর" : s === "normal" ? "🎯 স্বাভাবিক" : "⚡ দ্রুত"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 min-w-[180px]">
            <div className="text-xs font-bold text-slate-500 mb-2">মুড</div>
            <div className="flex gap-2">
              {(["normal", "excited", "calm", "dramatic"] as SpeechMood[]).map(m => (
                <button key={m} type="button" onClick={() => setGlobalMood(m)} className={`
                  flex-1 py-2 px-1 rounded-lg border text-xs font-semibold cursor-pointer transition-colors
                  ${globalMood === m ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-500" : "bg-[#131926] border-slate-800 text-slate-400 hover:border-slate-700"}
                `}>
                  {m === "normal" ? "😐" : m === "excited" ? "🤩" : m === "calm" ? "😌" : "🎭"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          disabled={generatingAll}
          onClick={async () => {
            setGeneratingAll(true);
            // Apply global settings to all scenes first, then generate sequentially
            const updatedStates: Record<string, SceneTtsState> = {};
            scenes.forEach(scene => {
              updatedStates[scene.sceneId] = {
                ...ttsStates[scene.sceneId],
                voice: globalVoice, speed: globalSpeed, mood: globalMood,
              };
            });
            setTtsStates(prev => ({ ...prev, ...updatedStates }));
            // Generate one at a time (sequential to avoid API rate limits)
            for (const scene of scenes) {
              const script = buildSceneScript(scene);
              if (!script.trim()) continue;
              const sceneId = scene.sceneId;
              setTtsStates(prev => ({ ...prev, [sceneId]: { ...prev[sceneId], loading: true, voice: globalVoice, speed: globalSpeed, mood: globalMood } }));
              try {
                const keys = readAllKeys();
                const wavBuffer = await generateSpeech({
                  script, voiceId: globalVoice, speed: globalSpeed, mood: globalMood,
                  primaryKey: keys[0], allKeys: keys,
                });
                const blobUrl = createAudioBlobUrl(wavBuffer);
                setTtsStates(prev => ({ ...prev, [sceneId]: { ...prev[sceneId], loading: false, audioUrl: blobUrl, wavBuffer } }));
              } catch {
                setTtsStates(prev => ({ ...prev, [sceneId]: { ...prev[sceneId], loading: false } }));
              }
            }
            setGeneratingAll(false);
          }}
          className={`w-full py-3.5 rounded-xl border-none font-bold text-sm flex items-center justify-center gap-2.5 transition-colors ${
            generatingAll ? 'bg-slate-800 text-slate-400 cursor-wait' : 'bg-yellow-500 hover:bg-yellow-400 text-[#090d16] cursor-pointer'
          }`}>
          {generatingAll ? (
            <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-4 h-4 border-2 border-slate-600 border-t-slate-400 rounded-full" />
              সব সিনের অডিও তৈরি হচ্ছে...</>
          ) : (
            <><Wand2 size={18} /> সব সিনের ভয়েসওভার তৈরি করুন</>
          )}
        </button>
      </div>

      {/* Per-Scene Cards */}
      <div className="flex flex-col gap-5">
        <h3 className="m-0 text-lg font-bold text-slate-200">
          📋 সিন-ভিত্তিক অডিও স্ক্রিপ্ট
        </h3>

        {fullScript.map(s => {
          const st = ttsStates[s.sceneId] || defaultTts();
          const scene = scenes[s.index];
          return (
            <motion.div key={s.sceneId}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(s.index * 0.04, 0.3) }}
              className={`rounded-2xl overflow-hidden bg-[#0f172a] shadow-sm transition-all duration-300 ${
                st.audioUrl ? 'border border-emerald-500/30' : 'border border-slate-800'
              }`}>

              {/* Accent bar */}
              <div className={`h-1 transition-colors duration-400 ${
                st.audioUrl ? 'bg-emerald-500' : 'bg-slate-700'
              }`} />

              <div className="p-4 sm:p-6 pb-4">
                {/* Scene header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold text-sm transition-all ${
                      st.audioUrl ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30' : 'bg-[#131926] text-slate-300 border border-slate-800'
                    }`}>
                      {st.audioUrl ? '✓' : s.index + 1}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-200">সিন {s.index + 1}</span>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-[#131926] border border-slate-800 text-slate-400">{s.duration}s</span>
                        {st.audioUrl && <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">✅ অডিও রেডি</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleCopyScene(s.sceneId, s.scriptText)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-none cursor-pointer text-xs font-bold transition-colors ${
                        copiedStates[s.sceneId] ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[#131926] text-slate-400 hover:text-slate-200'
                      }`}>
                      {copiedStates[s.sceneId] ? <CheckCheck size={14} /> : <Copy size={14} />} কপি
                    </button>
                    <button onClick={() => updateTts(s.sceneId, { expanded: !st.expanded })}
                      className="p-1.5 bg-[#131926] rounded-lg border-none cursor-pointer text-slate-400 hover:text-slate-200 transition-colors">
                      {st.expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Script preview (always visible) */}
                <div className="bg-[#090d16] border border-slate-800/80 rounded-xl p-4 mb-4">
                  {s.scriptText ? (
                    s.scriptText.split("\n").map((line, li) => (
                      <p key={li} className={`text-sm text-slate-300 leading-relaxed ${li === 0 ? 'm-0' : 'mt-2 mb-0'}`}>{line}</p>
                    ))
                  ) : (
                    <p className="m-0 text-sm text-slate-500 italic">এই সিনে কোনো স্ক্রিপ্ট নেই</p>
                  )}
                </div>

                {/* TTS Controls (expanded) */}
                <AnimatePresence>
                  {st.expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="border-t border-slate-800 pt-4 mb-4">
                        {/* Mini voice selector */}
                        <div className="text-xs font-bold text-slate-500 mb-2">ভয়েস বেছে নিন</div>
                        <div className="flex gap-2 flex-wrap mb-4">
                          {VOICE_OPTIONS.map(v => (
                            <button key={v.id} type="button" onClick={() => updateTts(s.sceneId, { voice: v.id })}
                              className={`px-3 py-1.5 rounded-full border text-xs font-bold cursor-pointer transition-colors ${
                                st.voice === v.id ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' : 'bg-[#131926] border-slate-800 text-slate-400'
                              }`}>
                              {v.id === "Puck" ? "⚡" : v.id === "Charon" ? "🎙️" : v.id === "Kore" ? "🌟" : v.id === "Fenrir" ? "🔥" : "🌙"} {v.name}
                            </button>
                          ))}
                        </div>

                        {/* Speed + Mood mini */}
                        <div className="flex gap-3 flex-wrap">
                          {(["slow", "normal", "fast"] as SpeechSpeed[]).map(sp => (
                            <button key={sp} type="button" onClick={() => updateTts(s.sceneId, { speed: sp })} className={`
                              px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors
                              ${st.speed === sp ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500" : "bg-transparent border-slate-800 text-slate-500"}
                            `}>
                              {sp === "slow" ? "🐢 ধীর" : sp === "normal" ? "🎯 স্বাভাবিক" : "⚡ দ্রুত"}
                            </button>
                          ))}
                          <div className="w-px bg-slate-800 mx-1" />
                          {(["normal", "excited", "calm", "dramatic"] as SpeechMood[]).map(md => (
                            <button key={md} type="button" onClick={() => updateTts(s.sceneId, { mood: md })} className={`
                              px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors
                              ${st.mood === md ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500" : "bg-transparent border-slate-800 text-slate-500"}
                            `}>
                              {md === "normal" ? "😐" : md === "excited" ? "🤩" : md === "calm" ? "😌" : "🎭"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Generate button */}
                <button onClick={() => handleGenerate(s.sceneId)} disabled={st.loading || !s.scriptText}
                  className={`w-full py-3 rounded-xl border-none font-bold text-sm flex items-center justify-center gap-2 mb-3 transition-colors ${
                    st.loading ? 'bg-slate-800 text-slate-400 cursor-wait' 
                    : st.audioUrl ? 'bg-[#1e293b] text-slate-300 hover:text-white cursor-pointer' 
                    : 'bg-[#1e293b] text-slate-200 border border-slate-700 hover:bg-slate-800 cursor-pointer'
                  } ${!s.scriptText ? 'opacity-40 cursor-not-allowed' : ''}`}>
                  {st.loading ? (
                    <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-4 h-4 border-2 border-slate-600 border-t-slate-400 rounded-full" />
                      তৈরি হচ্ছে...</>
                  ) : st.audioUrl ? (
                    <><Sparkles size={14} /> পুনরায় তৈরি করুন</>
                  ) : (
                    <><Wand2 size={14} /> এই সিনের ভয়েসওভার তৈরি করুন</>
                  )}
                </button>

                {/* Audio player */}
                {st.audioUrl && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                    <input type="range" min={0} max={st.duration || 1} step={0.1} value={st.progress}
                      onChange={e => handleSeek(s.sceneId, Number(e.target.value))}
                      className="w-full mb-2 accent-emerald-500 cursor-pointer" />
                    <div className="flex justify-between mb-3">
                      <span className="text-[10px] text-emerald-500/70">{formatTime(st.progress)}</span>
                      <span className="text-[10px] text-emerald-500/70">{formatTime(st.duration)}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handlePlayPause(s.sceneId)}
                        className="flex-1 py-2.5 rounded-lg border-none cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-[#090d16] font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                        {st.isPlaying ? <><Pause size={14} /> পজ</> : <><Play size={14} /> প্লে</>}
                      </button>
                      <button onClick={() => handleStop(s.sceneId)}
                        className="p-2.5 rounded-lg border border-emerald-500/20 cursor-pointer bg-transparent text-emerald-500 hover:bg-emerald-500/10 flex items-center transition-colors">
                        <Square size={14} />
                      </button>
                      <button onClick={() => st.wavBuffer && downloadWav(st.wavBuffer, `scene-${s.index + 1}-${st.voice}.wav`)}
                        className="px-4 py-2.5 rounded-lg border border-emerald-500/30 cursor-pointer bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 flex items-center gap-1.5 text-xs font-bold transition-colors">
                        <Download size={14} /> WAV
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
