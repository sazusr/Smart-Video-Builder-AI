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
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 10 }}>
            🎤 AI অডিও স্ক্রিপ্ট
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { icon: "🎬", label: `${scenes.length} সিন` },
              { icon: "⏱️", label: `${totalDuration} সেকেন্ড` },
              { icon: "🎙️", label: "Gemini TTS রেডি" },
            ].map((b, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 500, padding: "4px 12px", borderRadius: 99, background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
                {b.icon} {b.label}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={handleCopyAll}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, fontWeight: 600, cursor: "pointer", border: "1px solid var(--border-light)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: 13 }}>
            {copiedAll ? <CheckCheck size={16} color="#4ade80" /> : <Copy size={16} />}
            {copiedAll ? "কপি হয়েছে ✓" : "সম্পূর্ণ স্ক্রিপ্ট কপি"}
          </button>
          <button onClick={handleDownload}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, fontWeight: 600, cursor: "pointer", border: "none", background: "var(--gradient-brand)", color: "#fff", fontSize: 13 }}>
            <Download size={16} /> TXT ডাউনলোড
          </button>
        </div>
      </div>

      {/* Global TTS Config — "Generate All" */}
      <div style={{ background: "linear-gradient(135deg,#6c47ff15,#3b82f615)", border: "1px solid #6c47ff30", borderRadius: 18, padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ background: "#6c47ff20", color: "#a78bfa", padding: 8, borderRadius: 10 }}>
            <Music size={18} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>AI ভয়েসওভার — সব সিন একসাথে</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>ভয়েস ও স্টাইল বেছে নিন, তারপর সব সিনের অডিও তৈরি করুন</div>
          </div>
        </div>

        {/* Voice grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 14 }}>
          {VOICE_OPTIONS.map(v => (
            <button key={v.id} type="button" onClick={() => setGlobalVoice(v.id)}
              style={{
                background: globalVoice === v.id ? `${v.color}20` : "var(--bg-secondary)",
                border: `2px solid ${globalVoice === v.id ? v.color : "transparent"}`,
                borderRadius: 12, padding: "10px 6px", cursor: "pointer", textAlign: "center", transition: "all 0.2s",
              }}>
              <div style={{ fontSize: 18, marginBottom: 3 }}>
                {v.id === "Puck" ? "⚡" : v.id === "Charon" ? "🎙️" : v.id === "Kore" ? "🌟" : v.id === "Fenrir" ? "🔥" : "🌙"}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: globalVoice === v.id ? v.color : "var(--text-primary)", marginBottom: 2 }}>{v.name}</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)", lineHeight: 1.2 }}>{v.description}</div>
            </button>
          ))}
        </div>

        {/* Speed + Mood */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>স্পিড</div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["slow", "normal", "fast"] as SpeechSpeed[]).map(s => (
                <button key={s} type="button" onClick={() => setGlobalSpeed(s)} style={{
                  flex: 1, padding: "7px 4px", borderRadius: 8, border: `1.5px solid ${globalSpeed === s ? "#3b82f6" : "var(--border)"}`,
                  background: globalSpeed === s ? "#3b82f620" : "transparent", color: globalSpeed === s ? "#60a5fa" : "var(--text-muted)",
                  fontSize: 11, fontWeight: 600, cursor: "pointer",
                }}>
                  {s === "slow" ? "🐢 ধীর" : s === "normal" ? "🎯 স্বাভাবিক" : "⚡ দ্রুত"}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>মুড</div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["normal", "excited", "calm", "dramatic"] as SpeechMood[]).map(m => (
                <button key={m} type="button" onClick={() => setGlobalMood(m)} style={{
                  flex: 1, padding: "7px 4px", borderRadius: 8, border: `1.5px solid ${globalMood === m ? "#8b5cf6" : "var(--border)"}`,
                  background: globalMood === m ? "#8b5cf620" : "transparent", color: globalMood === m ? "#a78bfa" : "var(--text-muted)",
                  fontSize: 10, fontWeight: 600, cursor: "pointer",
                }}>
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
          style={{
            width: "100%", padding: "14px", borderRadius: 14, border: "none", cursor: generatingAll ? "wait" : "pointer",
            background: generatingAll ? "#334155" : "linear-gradient(135deg, #6c47ff 0%, #3b82f6 100%)",
            color: "#fff", fontSize: 15, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
          {generatingAll ? (
            <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              style={{ width: 20, height: 20, border: "2.5px solid #555", borderTopColor: "#aaa", borderRadius: "50%" }} />
              সব সিনের অডিও তৈরি হচ্ছে...</>
          ) : (
            <><Wand2 size={18} /> সব সিনের ভয়েসওভার তৈরি করুন</>
          )}
        </button>
      </div>

      {/* Per-Scene Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
          📋 সিন-ভিত্তিক অডিও স্ক্রিপ্ট
        </h3>

        {fullScript.map(s => {
          const st = ttsStates[s.sceneId] || defaultTts();
          const scene = scenes[s.index];
          return (
            <motion.div key={s.sceneId}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(s.index * 0.04, 0.3) }}
              style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${st.audioUrl ? "#3b82f640" : "var(--border)"}`, background: "var(--bg-panel)" }}>

              {/* Accent bar */}
              <div style={{ height: 3, background: st.audioUrl ? "linear-gradient(90deg,#3b82f6,#8b5cf6)" : "var(--gradient-brand)" }} />

              <div style={{ padding: "16px 20px" }}>
                {/* Scene header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, background: "var(--gradient-brand)", color: "#fff" }}>
                    {s.index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>সিন {s.index + 1}</span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "var(--bg-secondary)", color: "var(--text-muted)", fontWeight: 600 }}>{s.duration}s</span>
                      {st.audioUrl && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#3b82f620", color: "#60a5fa", fontWeight: 600 }}>✅ অডিও রেডি</span>}
                    </div>
                  </div>
                  <button onClick={() => handleCopyScene(s.sceneId, s.scriptText)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: copiedStates[s.sceneId] ? "#10b981" : "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}>
                    {copiedStates[s.sceneId] ? <CheckCheck size={14} /> : <Copy size={14} />} কপি
                  </button>
                  <button onClick={() => updateTts(s.sceneId, { expanded: !st.expanded })}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                    {st.expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Script preview (always visible) */}
                <div style={{ background: "rgba(108,71,255,0.06)", border: "1px solid rgba(108,71,255,0.15)", borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
                  {s.scriptText ? (
                    s.scriptText.split("\n").map((line, li) => (
                      <p key={li} style={{ margin: li === 0 ? 0 : "6px 0 0", fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6 }}>{line}</p>
                    ))
                  ) : (
                    <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>এই সিনে কোনো স্ক্রিপ্ট নেই</p>
                  )}
                </div>

                {/* TTS Controls (expanded) */}
                <AnimatePresence>
                  {st.expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, marginBottom: 14 }}>
                        {/* Mini voice selector */}
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>ভয়েস বেছে নিন</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                          {VOICE_OPTIONS.map(v => (
                            <button key={v.id} type="button" onClick={() => updateTts(s.sceneId, { voice: v.id })}
                              style={{
                                padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${st.voice === v.id ? v.color : "transparent"}`,
                                background: st.voice === v.id ? `${v.color}18` : "var(--bg-secondary)",
                                color: st.voice === v.id ? v.color : "var(--text-muted)", fontSize: 11, fontWeight: 700, cursor: "pointer",
                              }}>
                              {v.id === "Puck" ? "⚡" : v.id === "Charon" ? "🎙️" : v.id === "Kore" ? "🌟" : v.id === "Fenrir" ? "🔥" : "🌙"} {v.name}
                            </button>
                          ))}
                        </div>

                        {/* Speed + Mood mini */}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {(["slow", "normal", "fast"] as SpeechSpeed[]).map(sp => (
                            <button key={sp} type="button" onClick={() => updateTts(s.sceneId, { speed: sp })} style={{
                              padding: "5px 10px", borderRadius: 8, border: `1px solid ${st.speed === sp ? "#3b82f6" : "var(--border)"}`,
                              background: st.speed === sp ? "#3b82f618" : "transparent", color: st.speed === sp ? "#60a5fa" : "var(--text-muted)",
                              fontSize: 10, fontWeight: 600, cursor: "pointer",
                            }}>
                              {sp === "slow" ? "🐢 ধীর" : sp === "normal" ? "🎯 স্বাভাবিক" : "⚡ দ্রুত"}
                            </button>
                          ))}
                          {(["normal", "excited", "calm", "dramatic"] as SpeechMood[]).map(md => (
                            <button key={md} type="button" onClick={() => updateTts(s.sceneId, { mood: md })} style={{
                              padding: "5px 10px", borderRadius: 8, border: `1px solid ${st.mood === md ? "#8b5cf6" : "var(--border)"}`,
                              background: st.mood === md ? "#8b5cf618" : "transparent", color: st.mood === md ? "#a78bfa" : "var(--text-muted)",
                              fontSize: 10, fontWeight: 600, cursor: "pointer",
                            }}>
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
                  style={{
                    width: "100%", padding: "11px", borderRadius: 12, border: "none",
                    cursor: st.loading ? "wait" : "pointer",
                    background: st.loading ? "#334155" : st.audioUrl ? "#1e3a5f" : "linear-gradient(135deg,#6c47ff,#3b82f6)",
                    color: "#fff", fontSize: 13, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10,
                    opacity: !s.scriptText ? 0.4 : 1,
                  }}>
                  {st.loading ? (
                    <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      style={{ width: 16, height: 16, border: "2px solid #555", borderTopColor: "#aaa", borderRadius: "50%" }} />
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
                    style={{ background: "#3b82f612", border: "1px solid #3b82f630", borderRadius: 12, padding: "12px 14px" }}>
                    <input type="range" min={0} max={st.duration || 1} step={0.1} value={st.progress}
                      onChange={e => handleSeek(s.sceneId, Number(e.target.value))}
                      style={{ width: "100%", marginBottom: 6, accentColor: "#3b82f6", cursor: "pointer" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{formatTime(st.progress)}</span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{formatTime(st.duration)}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handlePlayPause(s.sceneId)}
                        style={{ flex: 1, padding: "9px", borderRadius: 10, border: "none", cursor: "pointer", background: "#3b82f6", color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        {st.isPlaying ? <><Pause size={14} /> পজ</> : <><Play size={14} /> প্লে</>}
                      </button>
                      <button onClick={() => handleStop(s.sceneId)}
                        style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid var(--border)", cursor: "pointer", background: "transparent", color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
                        <Square size={13} />
                      </button>
                      <button onClick={() => st.wavBuffer && downloadWav(st.wavBuffer, `scene-${s.index + 1}-${st.voice}.wav`)}
                        style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid #22d3a040", cursor: "pointer", background: "#22d3a015", color: "#22d3a0", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700 }}>
                        <Download size={13} /> WAV
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
