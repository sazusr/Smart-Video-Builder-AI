import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Wand2,
  Trash2,
  Clock,
  Monitor,
  Globe,
  Palette,
  FileText,
  RefreshCw
} from "lucide-react";
import type {
  StoryInput,
  StoryGenre,
  VisualStyle,
  StoryDuration,
  StoryLanguage,
  AspectRatio,
} from "../../../types/storyVideo";
import { getDurationConfig } from "../../../types/storyVideo";
import { generateStoryIdea } from "../../../services/storyAiService";

interface StoryInputFormProps {
  onSubmit: (input: StoryInput) => void;
  loading: boolean;
  initialInput?: Partial<StoryInput>;
  apiKey?: string;
}

// ── 8 Short, Clean Viral Topics ───────────────────────────────────────────
const TOPIC_NICHES = [
  {
    id: "bd_doc",
    label: "🇧🇩 ডকুমেন্টারি",
    genre: "bd_documentary" as StoryGenre,
    hints: [
      "সুন্দরবনের গহীনে অবস্থিত শতবর্ষী এক ব্রিটিশ জাহাজ, যা প্রতি অমাবস্যার রাতে কুয়াশার ভেতর দেখা যায় বলে দাবি করেন স্থানীয় জেলেরা...",
      "১৯৭১ সালের মুক্তিযুদ্ধে এক অকুতোভয় কিশোরের গোপন অপারেশন, যে একা একটি গুরুত্বপূর্ণ পাকিস্তানি সেনা ক্যাম্প গুঁড়িয়ে দিয়েছিল...",
      "লালবাগ কেল্লার রহস্যময় গোপন সুড়ঙ্গ — যার ভেতরে ব্রিটিশ আমলে প্রবেশ করা সেনা দল কখনো আর ফিরে আসেনি...",
    ],
  },
  {
    id: "true_crime",
    label: "🕵️ ক্রাইম",
    genre: "true_crime" as StoryGenre,
    hints: [
      "১৯৮৫ সালে নিউ ইয়র্কের সবচেয়ে সুরক্ষিত ব্যাংক থেকে রাতের আঁধারে গায়েব হয় ১০০ মিলিয়ন ডলার। কোন সিসিটিভি নেই, কোন ফিঙ্গারপ্রিন্ট নেই...",
      "ক্যালিফোর্নিয়ার মরুভূমির গহীনে পাওয়া একটি ক্যাসেট টেপ যা ১০ বছর পর উন্মোচন করে এক ভয়ংকর সত্য...",
    ],
  },
  {
    id: "business",
    label: "🏢 বিজনেস",
    genre: "scandal_business" as StoryGenre,
    hints: [
      "সিলিকন ভ্যালির মাত্র ২৪ বছর বয়সী এক তরুণ দাবি করে সে ক্যান্সারের নিরাময়কারী চিপ আবিষ্কার করেছে...",
      "আমেরিকার সবচেয়ে দ্রুত বর্ধনশীল এনার্জি কোম্পানি যা একদিনের নোটিশে দেউলিয়া হয়ে যায়...",
    ],
  },
  {
    id: "success",
    label: "💪 মোটিভেশন",
    genre: "success_story" as StoryGenre,
    hints: [
      "এক পথশিশু যে ফুটপাতে খবরের কাগজ বিক্রি করত, রাতের ল্যাম্পপোস্টের নিচে পড়ে আজ সে সফল সফটওয়্যার ইঞ্জিনিয়ার...",
      "বারবার ব্যর্থ হওয়া এক চা বিক্রেতা কীভাবে নিজের উদ্ভাবনী শক্তিতে কোটি টাকার আন্তর্জাতিক ব্র্যান্ড তৈরি করলেন...",
    ],
  },
  {
    id: "emotional",
    label: "😢 ইমোশনাল",
    genre: "emotional_story" as StoryGenre,
    hints: [
      "একটি ভাঙা ঘড়ি আর শেষ এক টুকরো চিঠি — বিশ বছর পর বিদেশে থাকা ছেলে যখন গ্রামে ফেরে, তখন জানতে পারে মায়ের নীরব আত্মত্যাগ...",
      "প্রবাসে মাথার ঘাম পায়ে ফেলে পরিবারকে কোটিপতি বানানো এক রেমিট্যান্স যোদ্ধা, দেশে ফিরে দেখে নিজের ঘরেই তার জায়গা নেই...",
    ],
  },
  {
    id: "comedy",
    label: "😂 কমেডি",
    genre: "comedy" as StoryGenre,
    hints: [
      "একজন অতি-চালাক মধ্যবিত্ত লোক ভুল করে নিজেকে একজন আন্তর্জাতিক ভিআইপি অতিথির তালিকায় ঢুকিয়ে ফেলে...",
      "এক গ্রামে প্রথমবার সিসিটিভি ক্যামেরা বসানো হয়। গ্রামবাসীরা ক্যামেরাগুলোকে 'অদৃশ্য জিন' ভেবে চরম কাণ্ড শুরু করে...",
    ],
  },
  {
    id: "romantic",
    label: "💖 রোমান্স",
    genre: "romantic" as StoryGenre,
    hints: [
      "ভুল ঠিকানায় পাঠানো চিঠির মাধ্যমে প্রেমে পড়ে দুটি অচেনা মানুষ। বাস্তবে দেখা হলে জানা যায় তারা অফিসের চিরপ্রতিদ্বন্দ্বী...",
      "স্মৃতিশক্তি হারানো এক যুবতীকে তার স্বামী প্রতিদিন নতুন করে ভালোবাসতে শেখায়...",
    ],
  },
  {
    id: "horror",
    label: "👻 হরর",
    genre: "horror" as StoryGenre,
    hints: [
      "গভীর বনের ভেতর শতবর্ষী এক বাংলো। সেখানে রাত কাটালে মধ্যরাতে পিয়ানোতে এমন এক সুর বাজে যা শুনলে মানুষ নিজের নামও ভুলে যায়...",
      "একজন ট্যাক্সি ড্রাইভার মধ্যরাতে পাহাড়ি বাঁকে একা দাঁড়িয়ে থাকা এক যাত্রীকে তোলে, যার পা উল্টো দিকে ঘোরানো...",
    ],
  },
];

// ── 6 Core Visual Styles ───────────────────────────────────────────────────
const VISUAL_STYLES: { value: VisualStyle; emoji: string; label: string }[] = [
  { value: "cinematic_realistic", emoji: "🎬", label: "সিনেমাটিক" },
  { value: "ultra_realistic",     emoji: "📷", label: "রিয়েলিস্টিক" },
  { value: "3d_animation",        emoji: "🎮", label: "৩ডি অ্যানিমেশন" },
  { value: "anime",               emoji: "🌸", label: "অ্যানিমে" },
  { value: "film_look",           emoji: "🎞️", label: "ভিন্টেজ" },
  { value: "fantasy",             emoji: "🔮", label: "ফ্যান্টাসি" },
];

// ── Duration Presets ───────────────────────────────────────────────────────
const DURATION_PRESETS: { value: StoryDuration; label: string }[] = [
  { value: "20s",  label: "২০ সে." },
  { value: "30s",  label: "৩০ সে." },
  { value: "1min", label: "১ মিনিট" },
  { value: "2min", label: "২ মিনিট" },
  { value: "3min", label: "৩ মিনিট" },
  { value: "5min", label: "৫ মিনিট" },
];

// ── Aspect Ratio Options ───────────────────────────────────────────────────
const ASPECT_OPTIONS: { value: AspectRatio; label: string; sub: string; emoji: string }[] = [
  { value: "9:16", emoji: "📱", label: "9:16 Shorts", sub: "TikTok / Reels" },
  { value: "16:9", emoji: "🖥️",  label: "16:9 Cinema", sub: "YouTube / TV" },
];

// ── Language Options ───────────────────────────────────────────────────────
const LANGUAGE_OPTIONS: { value: StoryLanguage; label: string }[] = [
  { value: "bangla",   label: "বাংলা" },
  { value: "english",  label: "English" },
  { value: "banglish", label: "Banglish" },
];

export default function StoryInputForm({ onSubmit, loading, initialInput, apiKey }: StoryInputFormProps) {
  const [input, setInput] = useState<StoryInput>({
    storyHint:       initialInput?.storyHint       || "",
    language:        initialInput?.language         || "bangla",
    duration:        initialInput?.duration         || "3min",
    genre:           initialInput?.genre            || "bd_documentary",
    visualStyle:     initialInput?.visualStyle      || "cinematic_realistic",
    aspectRatio:     initialInput?.aspectRatio === "1:1" ? "9:16" : (initialInput?.aspectRatio || "9:16"),
    voiceMode:       "narration",
    voiceStyle:      "auto",
    backgroundMusic: initialInput?.backgroundMusic ?? true,
    soundEffects:    initialInput?.soundEffects    ?? true,
  });

  const [activeNicheId, setActiveNicheId] = useState<string>("bd_doc");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [promptCycleIndex, setPromptCycleIndex] = useState(0);

  // Duration custom state
  const isPreset = DURATION_PRESETS.some(p => p.value === input.duration);
  const [isCustomDuration, setIsCustomDuration] = useState(!isPreset);
  const [customVal, setCustomVal] = useState(() => {
    if (!isPreset) {
      const num = input.duration.replace(/[^0-9]/g, '');
      return num || "45";
    }
    return "45";
  });
  const [customUnit, setCustomUnit] = useState<"s" | "min">(() => {
    if (!isPreset && input.duration.includes("min")) return "min";
    return "s";
  });

  const update = <K extends keyof StoryInput>(key: K, val: StoryInput[K]) =>
    setInput(prev => ({ ...prev, [key]: val }));

  const currentNiche = TOPIC_NICHES.find(n => n.id === activeNicheId) || TOPIC_NICHES[0];
  const currentDurationConfig = getDurationConfig(input.duration);

  const handleSelectNiche = (niche: typeof TOPIC_NICHES[0]) => {
    setActiveNicheId(niche.id);
    update("genre", niche.genre);
    if (!input.storyHint.trim()) {
      update("storyHint", niche.hints[0] || "");
      setPromptCycleIndex(0);
    }
  };

  const handleCyclePrompt = () => {
    const hints = currentNiche.hints;
    if (hints.length === 0) return;
    const nextIdx = (promptCycleIndex + 1) % hints.length;
    setPromptCycleIndex(nextIdx);
    update("storyHint", hints[nextIdx]);
  };

  const handleGenerateWithAi = async () => {
    const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) {
      handleCyclePrompt();
      return;
    }

    setAiGenerating(true);
    try {
      const generated = await generateStoryIdea(key, currentNiche.label, input.language);
      if (generated) {
        update("storyHint", generated);
      }
    } catch {
      handleCyclePrompt();
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSelectPreset = (val: StoryDuration) => {
    setIsCustomDuration(false);
    update("duration", val);
  };

  const handleToggleCustom = () => {
    setIsCustomDuration(true);
    const num = Math.max(customUnit === "s" ? 20 : 1, parseInt(customVal || "20", 10));
    update("duration", `${num}${customUnit}`);
  };

  const handleCustomChange = (valStr: string, unit: "s" | "min") => {
    setCustomVal(valStr);
    setCustomUnit(unit);
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed > 0) {
      const clamped = unit === "s" ? Math.max(20, parsed) : parsed;
      update("duration", `${clamped}${unit}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.storyHint.trim() || loading) return;
    onSubmit(input);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-5xl mx-auto flex flex-col gap-6">

      {/* ── CARD 1: STORY PROMPT & NICHES ──────────────────────────────── */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <FileText size={16} className="text-slate-400" /> স্ক্রিপ্ট লিখুন
          </h3>
        </div>

        {/* Textarea Container */}
        <div className="relative flex flex-col rounded-xl border border-slate-800 bg-[#090d16] overflow-hidden focus-within:border-yellow-500/50 transition-colors">
          <textarea
            value={input.storyHint}
            onChange={e => update("storyHint", e.target.value.slice(0, 1000))}
            placeholder="এখানে আপনার গল্পের সারসংক্ষেপ লিখুন..."
            required
            rows={5}
            className="w-full p-4 text-sm md:text-base leading-relaxed bg-transparent text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none"
          />

          {/* Toolbar Below Textarea */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#0b0f19] border-t border-slate-800/50">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateWithAi}
                disabled={aiGenerating}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-[#090d16] bg-yellow-500 hover:bg-yellow-400 transition-all cursor-pointer shadow-sm"
              >
                <Wand2 size={16} />
                <span>{aiGenerating ? "ভাবছে..." : "AI আইডিয়া"}</span>
              </button>

              <button
                type="button"
                onClick={handleCyclePrompt}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
                title="নতুন আইডিয়া জেনারেট করুন"
              >
                <RefreshCw size={16} />
              </button>
              
              {input.storyHint && (
                <button
                  type="button"
                  onClick={() => update("storyHint", "")}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
                  title="লেখা মুছুন"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{input.storyHint.length} / ১০০০</span>
          </div>
        </div>

        {/* Niche Selection - Below Textarea in a nice shape */}
        <div className="mt-5 p-5 rounded-xl bg-[#131926] border border-slate-800/80">
          <h4 className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-2">
            অথবা নিচের যেকোনো একটি টপিক বেছে নিন:
          </h4>
          <div className="flex flex-wrap items-center gap-2.5">
            {TOPIC_NICHES.map(topic => {
              const isActive = activeNicheId === topic.id;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => handleSelectNiche(topic)}
                  className={`px-6 py-3 rounded-full text-sm sm:text-[15px] font-semibold transition-all cursor-pointer border shadow-sm ${
                    isActive
                      ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/50"
                      : "bg-[#090d16] text-slate-300 border-slate-800 hover:border-slate-600 hover:text-white"
                  }`}
                >
                  {topic.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CARD 2: FORMAT ────────────────────────────────────────────── */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4">
          <Monitor size={16} className="text-slate-400" /> ফরম্যাট
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {ASPECT_OPTIONS.map(opt => {
            const active = input.aspectRatio === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("aspectRatio", opt.value)}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  active
                    ? "bg-yellow-500/10 border-yellow-500 text-yellow-500"
                    : "bg-[#1e293b] border-transparent text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <div className="text-2xl">{opt.emoji}</div>
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="text-[11px] opacity-70">{opt.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CARD 3: DURATION ──────────────────────────────────────────── */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Clock size={16} className="text-slate-400" /> সময়কাল
          </h3>
          <span className="text-xs font-medium text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
            {input.duration}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
          {DURATION_PRESETS.map(opt => {
            const active = !isCustomDuration && input.duration === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelectPreset(opt.value)}
                className={`py-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                  active
                    ? "bg-yellow-500/10 border-yellow-500 text-yellow-500"
                    : "bg-[#1e293b] border-transparent text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="button"
            onClick={handleToggleCustom}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
              isCustomDuration
                ? "bg-yellow-500/10 border-yellow-500 text-yellow-500"
                : "bg-[#1e293b] border-transparent text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            ⚙️ কাস্টম
          </button>
          
          <AnimatePresence>
            {isCustomDuration && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-2 overflow-hidden w-full sm:w-auto"
              >
                <input
                  type="number"
                  min={customUnit === "s" ? 20 : 1}
                  max={customUnit === "s" ? 600 : 30}
                  value={customVal}
                  onChange={e => handleCustomChange(e.target.value, customUnit)}
                  className="w-20 px-3 py-2 text-sm font-medium rounded-xl border border-slate-700 bg-[#090d16] text-slate-200 text-center focus:outline-none focus:border-yellow-500"
                />
                <div className="flex rounded-xl border border-slate-700 overflow-hidden bg-[#090d16]">
                  <button
                    type="button"
                    onClick={() => handleCustomChange(customVal, "s")}
                    className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                      customUnit === "s" ? "bg-yellow-500/20 text-yellow-500" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    সেকেন্ড
                  </button>
                  <div className="w-px bg-slate-700"></div>
                  <button
                    type="button"
                    onClick={() => handleCustomChange(customVal, "min")}
                    className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                      customUnit === "min" ? "bg-yellow-500/20 text-yellow-500" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    মিনিট
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4 text-[13px] text-slate-500 flex items-center gap-1.5">
          <span className="text-yellow-500/70">💡</span> 
          <span>এই সময়ে আনুমানিক {currentDurationConfig.minScenes} থেকে {currentDurationConfig.maxScenes} টি সিন তৈরি হবে।</span>
        </div>
      </div>

      {/* ── CARD 4 & 5: VISUAL STYLE & LANGUAGE (Combined & Compacted) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4">
            <Palette size={16} className="text-slate-400" /> ভিজুয়াল স্টাইল
          </h3>
          <div className="flex flex-wrap gap-2">
            {VISUAL_STYLES.map(style => {
              const active = input.visualStyle === style.value;
              return (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => update("visualStyle", style.value)}
                  className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                    active
                      ? "bg-yellow-500/10 border-yellow-500 text-yellow-500"
                      : "bg-[#1e293b] border-transparent text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <span className="text-lg">{style.emoji}</span>
                  <span className="text-[13px] font-medium">{style.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4">
            <Globe size={16} className="text-slate-400" /> ভাষা
          </h3>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map(opt => {
              const active = input.language === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update("language", opt.value)}
                  className={`px-5 py-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    active
                      ? "bg-yellow-500/10 border-yellow-500 text-yellow-500"
                      : "bg-[#1e293b] border-transparent text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SUBMIT BUTTON ──────────────────────────────────────────────── */}
      <motion.button
        type="submit"
        disabled={!input.storyHint.trim() || loading}
        whileHover={{ scale: loading || !input.storyHint.trim() ? 1 : 1.01 }}
        whileTap={{ scale: loading || !input.storyHint.trim() ? 1 : 0.99 }}
        className={`w-full py-4 px-6 mt-6 mb-16 rounded-2xl text-base font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm ${
          loading || !input.storyHint.trim()
            ? "bg-[#1e293b] text-slate-500 border border-slate-800 cursor-not-allowed"
            : "bg-yellow-500 text-[#090d16] hover:bg-yellow-400"
        }`}
      >
        {loading ? (
          <span>গল্প তৈরি হচ্ছে...</span>
        ) : (
          <>
            <Sparkles size={18} className="text-[#090d16]" />
            <span>ভিডিও গল্প তৈরি করুন</span>
          </>
        )}
      </motion.button>
    </form>
  );
}
