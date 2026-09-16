import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Globe, Clock, Film, Palette, Monitor, RefreshCw, Wand2, Dices, X
} from "lucide-react";
import type {
  StoryInput, StoryGenre, VisualStyle, StoryDuration, StoryLanguage, AspectRatio,
} from "../../../types/storyVideo";
import { VISUAL_STYLE_LABELS } from "../../../types/storyVideo";
import { generateStoryIdea } from "../../../services/storyAiService";

interface StoryInputFormProps {
  onSubmit: (input: StoryInput) => void;
  loading: boolean;
  initialInput?: Partial<StoryInput>;
  apiKey?: string;
}

interface CategorySuggestion {
  label: string;
  genre: StoryGenre;
  badge?: string;
  hints: string[];
}

// ── Story Suggestions with Rich Categories & Hints ───────────────────────
const CATEGORY_SUGGESTIONS: CategorySuggestion[] = [
  {
    label: "🇺🇸 US ক্রাইম ডকুমেন্টারি",
    genre: "true_crime",
    badge: "🔥 ভাইরাল",
    hints: [
      "১৯৮৫ সালে নিউ ইয়র্কের সবচেয়ে সুরক্ষিত ব্যাংক থেকে রাতের আঁধারে গায়েব হয় ১০০ মিলিয়ন ডলার। কোন সিসিটিভি নেই, কোন ফিঙ্গারপ্রিন্ট নেই — ২০ বছর পর এফবিআই যা খুঁজে পায় তা সবাইকে স্তব্ধ করে দেয়...",
      "ক্যালিফোর্নিয়ার এক নিরিবিলি শহর থেকে নিখোঁজ হয় তরুণী বিলিয়নিয়ার। সবাই ভেবেছিল সে নিজেই পালিয়েছে, কিন্তু ১০ বছর পর মরুভূমির গহীনে পাওয়া একটি ক্যাসেট টেপ উন্মোচন করে এক ভয়ংকর সত্য...",
      "আমেরিকান ইতিহাসের সবচেয়ে ধুরন্ধর কন-ম্যান, যে একই সাথে এফবিআই এজেন্ট ও ওয়াল স্ট্রিট ব্যাংকার সেজে ২০টি ব্যাংককে ধোঁকা দিয়েছিল — শেষমেশ কীভাবে সে ধরা পড়ে?",
      "শিকাগোর একটি প্রাচীন ম্যানশনে পাওয়া যায় এমন এক গোপন ডায়েরি, যা আমেরিকার সবচেয়ে প্রভাবশালী তিন রাষ্ট্রনেতার অমীমাংসিত হত্যাকাণ্ডের যোগসূত্র প্রকাশ করে...",
      "টেক্সাসের মরুভূমির ভেতর একটি অজ্ঞাত লাশ। ১৫ বছর ধরে কেউ তার পরিচয় বের করতে পারেনি, যতক্ষণ না এক অবসরপ্রাপ্ত ডিটেকটিভ নতুন ডিএনএ প্রযুক্তি ব্যবহার করে...",
    ],
  },
  {
    label: "🏢 US বিজনেস স্ক্যান্ডাল",
    genre: "scandal_business",
    badge: "Wall St",
    hints: [
      "সিলিকন ভ্যালির মাত্র ২৪ বছর বয়সী এক তরুণ দাবি করে সে ক্যান্সারের নিরাময়কারী চিপ আবিষ্কার করেছে। রাতারাতি কোম্পানির মূল্য ওঠে ১০ বিলিয়ন ডলার — কিন্তু ল্যাবের ভেতর আসলে কি ঘটছিল?",
      "ওয়াল স্ট্রিটের এক হেজ ফান্ড ম্যানেজার যার প্রতিটা প্রেডিকশন ১০০% সঠিক হত। সবাই তাকে অর্থনৈতিক জাদুকর ভাবত, যতক্ষণ না একজন ইন্টার্ন লক্ষ্য করে তার সব ট্রেড মধ্যরাতে একই নির্দিষ্ট কম্পিউটার থেকে হচ্ছে...",
      "আমেরিকার সবচেয়ে দ্রুত বর্ধনশীল এনার্জি কোম্পানি যা একদিনের নোটিশে দেউলিয়া হয়ে যায়। তাদের ভুয়ো অডিট এবং কর্পোরেট চক্রান্তের অজানা ইনসাইড স্টোরি...",
      "একটি বিখ্যাত সোশ্যাল মিডিয়া অ্যাপ যা গোপনে লাখ লাখ ব্যবহারকারীর ব্যক্তিগত কথোপকথন বিক্রি করছিল — একজন হুইসেলব্লোয়ার কর্মীর জীবন বাজি রেখে সত্য প্রকাশের গল্প...",
    ],
  },
  {
    label: "🕵️ US রহস্য ও এরিয়া ৫১",
    genre: "us_documentary",
    hints: [
      "নেভাডার দুর্গম মরুভূমিতে অবস্থিত এরিয়া ৫১ থেকে পালিয়ে আসা এক সাবেক বিমানবাহিনীর প্রকৌশলী দাবি করেন — ১৯৮৯ সালে তারা এমন এক মহাকাশযান রিভার্স-ইঞ্জিনিয়ারিং করছিলেন যা মানুষের তৈরি নয়...",
      "১৯৭১ সালে মাঝ আকাশে বিমান হাইজ্যাক করে ২ লাখ ডলার মুক্তিপণ নিয়ে প্যারাস্যুট দিয়ে লাফিয়ে অদৃশ্য হয়ে যায় ডি. বি. কুপার। ৫০ বছর পরও এফবিআই তার কোনো চিহ্ন পায়নি — সে আসলে কোথায় গেল?",
      "আমেরিকার এক সামরিক সাবমেরিন যা প্রশান্ত মহাসাগরের গভীরে নিখোঁজ হয়। উদ্ধারকারী দল যখন সাবমেরিনটি পায়, তখন তার ভেতরে থাকা ১০০ নাবিকের কেউই ছিল না — কিন্তু সব খাবার তখনও গরম ছিল...",
      "ওয়াশিংটন ডিসির মাটির নিচে তৈরি গোপন বাঙ্কার নেটওয়ার্ক — যা সাধারণ মানুষের অজানা। কোল্ড ওয়ারের সময় তৈরি এই ভূগর্ভস্থ শহরের গোপন ইতিহাস...",
    ],
  },
  {
    label: "🎬 হলিউড ডার্ক সিক্রেটস",
    genre: "us_documentary",
    hints: [
      "১৯৬০ এর দশকের হলিউডের সবচেয়ে জনপ্রিয় সুপারস্টারের রহস্যজনক মৃত্যু। সরকারি রিপোর্টে আত্মহত্যা বলা হলেও, ব্যক্তিগত লকারে থাকা গোপন চিঠিগুলো অন্য এক নির্মম ষড়যন্ত্রের ইঙ্গিত দেয়...",
      "হলিউডের এক বিখ্যাত অস্কারজয়ী পরিচালকের হারিয়ে যাওয়া শেষ সিনেমা, যা প্রদর্শনের আগেই রহস্যজনকভাবে নিষিদ্ধ করা হয়। ৪০ বছর পর তার প্রিন্ট উদ্ধার হতে যা বেরিয়ে আসে...",
      "হলিউডের নেপথ্যের এক শ্যাডো এজেন্ট, যে দশকের পর দশক ধরে নামিদামি তারকাদের ব্ল্যাকমেইল করে ইন্ডাস্ট্রি নিয়ন্ত্রণ করছিল...",
    ],
  },
  {
    label: "😄 কমেডি ও ফানি ভিডিও",
    genre: "comedy",
    hints: [
      "একজন অতি-চালাক মধ্যবিত্ত লোক ভুল করে নিজেকে একজন আন্তর্জাতিক ভিআইপি অতিথির তালিকায় ঢুকিয়ে ফেলে। এখন ৫ তারকা হোটেলে তাকে নিয়ে শুরু হয় হাস্যকর কান্ডকারখানা...",
      "এক গ্রামে প্রথমবার সিসিটিভি ক্যামেরা বসানো হয়। গ্রামবাসীরা ক্যামেরাগুলোকে 'অদৃশ্য জিন' ভেবে যা যা শুরু করে, তা দেখে পুরো থানার পুলিশ হাসতে হাসতে শেষ...",
      "দুই প্রতিবেশী ছাদের টবের ফুল চুরি নিয়ে কোর্ট পর্যন্ত মামলা করে। জজ সাহেব শেষমেশ চোরকে ধরতে যা করলেন, তা পুরো আদালতকে হাসির রোল ফেলে দেয়...",
      "এক লোভী পাত্রপক্ষ কোটি টাকার যৌতুক চেয়ে বিয়ের আসরে বসে দেখে কনের বদলে এসেছে এক বৃদ্ধ মাতব্বর — এবং বরের পুরনো সব কাণ্ড ফাঁস করে দেয়...",
    ],
  },
  {
    label: "👻 ভৌতিক ও প্যারানরমাল",
    genre: "horror",
    hints: [
      "গভীর বনের ভেতর শতবর্ষী এক ব্রিটিশ বাংলো। সেখানে রাত কাটালে প্রতি মধ্যরাতে পিয়ানোতে এমন এক সুর বাজে, যা শুনলে মানুষ নিজের নামও ভুলে যায়...",
      "একটি পরিবার কম দামে নতুন কেনা বাড়িতে ওঠে। কিন্তু প্রতিরাতে দেয়ালের অপর পাশ থেকে বাচ্চাদের কান্নার শব্দ এবং পুরনো ফটোগ্রাফে অদ্ভুত মুখের প্রতিচ্ছবি দেখা যায়...",
      "একজন ট্যাক্সি ড্রাইভার মধ্যরাতে পাহাড়ি বাঁকে একা দাঁড়িয়ে থাকা এক যাত্রীকে তোলে। রিয়ারভিউ মিররে চোখ পড়তেই সে বুঝতে পারে যাত্রীটির পা উল্টো দিকে ঘোরানো...",
    ],
  },
  {
    label: "🔍 রহস্য / ইনভেস্টিগেশন",
    genre: "mystery",
    hints: [
      "এক নামকরা চিত্রশিল্পীকে তার স্টুডিওতে মৃত পাওয়া যায়। তার আঁকা শেষ অসমাপ্ত ছবিতে লুকানো ছিল এমন এক ক্লু, যা শহরের সবচেয়ে বড় মাফিয়া চক্রকে ধরিয়ে দেয়...",
      "একটি বন্ধ ট্রেনের বগিতে পাওয়া যায় একদল ঘুমন্ত যাত্রী — কিন্তু তাদের মধ্যে এক কোটিপতি ব্যবসায়ী নিখোঁজ, তার জায়গায় রেখে যাওয়া হয়েছে একটি কাঠের দাবার রাজা...",
      "শহরে পরপর ৫টি ডাকাতি ঘটে, কোন তালা ভাঙা হয়নি, কোন সিসিটিভি অফ করা হয়নি। এক তরুণী ডিটেকটিভ তদন্তে নেমে পায় এক অপ্রত্যাশিত প্রযুক্তিগত ষড়যন্ত্র...",
    ],
  },
  {
    label: "💘 রোমান্টিক লাভ স্টোরি",
    genre: "romantic",
    hints: [
      "দুটি অচেনা মানুষ ভুল ঠিকানায় পাঠানো চিঠির মাধ্যমে প্রেমে পড়ে। যখন তারা বাস্তবে দেখা করার সিদ্ধান্ত নেয়, তখন জানা যায় তারা একই অফিসের চিরপ্রতিদ্বন্দ্বী সহকর্মী...",
      "স্মৃতিশক্তি হারানো এক যুবতী প্রতিদিন সকালে ঘুম থেকে উঠে তার পাশের মানুষটিকে অচেনা ভাবে। আর সেই যুবক প্রতিদিন নতুন করে তাকে ভালোবাসতে শেখায়...",
      "যুদ্ধবিধ্বস্ত শহরে এক নার্স ও একজন চিকিৎসকের নিঃস্বার্থ ভালোবাসা — বিশ বছর পর এক পুরনো ডায়েরির মাধ্যমে তাদের সন্তান তাদের আসল ত্যাগ জানতে পারে...",
    ],
  },
  {
    label: "⚔️ সারভাইভাল ও অ্যাডভেঞ্চার",
    genre: "adventure",
    hints: [
      "প্রশান্ত মহাসাগরের এক অজানা প্রবাল দ্বীপে বিমান বিধ্বস্ত হয়ে বেঁচে যায় মাত্র তিনজন। পানির সংকট, হিংস্র প্রাণী এবং অজানা এক আদিম গোত্রের সাথে তাদের জীবনযুদ্ধের গল্প...",
      "হিমালয়ের ৮০০০ মিটার উঁচুতে বরফের ঝড়ে আটকে পড়া এক দল পর্বতারোহী। অক্সিজেন প্রায় শেষ, নামার পথ বরফে ঢাকা — এমন সময় একজনের অলৌকিক সাহসিকতা...",
      "আমাজনের দুর্গম অরণ্যে হারিয়ে যাওয়া প্রাচীন এক স্বর্ণের শহরের খোঁজে বেরিয়ে দলটির সদস্যরা একে একে উন্মাদ হতে থাকে...",
    ],
  },
  {
    label: "🤖 সাই-ফাই ও ফিউচার",
    genre: "us_documentary",
    hints: [
      "২০৭৫ সালে মানুষের মস্তিষ্ককে সরাসরি ইন্টারনেটের সাথে যুক্ত করার প্রযুক্তি আসে। কিন্তু হঠাৎ এক অজানা কোড মানুষের স্মৃতির ভেতরে ঢুকে বাস্তবতা আর কল্পনাকে উল্টে দেয়...",
      "মঙ্গল গ্রহে প্রথম মানব বসতি স্থাপনকারী দল মাটির নিচে এমন এক প্রাচীন স্থাপত্য খুঁজে পায়, যা প্রমাণ করে কোটি বছর আগে মানুষের পূর্বপুরুষেরা আসলে মঙ্গল থেকেই পৃথিবীতে এসেছিল...",
    ],
  },
  {
    label: "💪 অনুপ্রেরণা ও সাফল্য",
    genre: "motivational",
    hints: [
      "এক পথশিশু যে ফুটপাতে খবরের কাগজ বিক্রি করত, রাতের ল্যাম্পপোস্টের নিচে পড়ে আজ সে বিশ্বমানের সফটওয়্যার ইঞ্জিনিয়ার ও বিলিয়নিয়ার উদ্যোক্তা...",
      "প্যারালাইজড হয়ে বিছানায় পড়ে থাকা এক তরুণী শুধুমাত্র চোখের পলক ফেলে লিখে ফেলে বেস্টসেলার বই — যা আজ কোটি কোটি মানুষকে ঘুরে দাঁড়ানোর সাহস জোগায়...",
    ],
  },
];

// ── Language options ──────────────────────────────────────────────────────
const LANGUAGE_OPTIONS: { value: StoryLanguage; label: string; sub: string; flag: string }[] = [
  { value: "bangla",   label: "বাংলা",    sub: "ভিডিওর পুরো অডিও বাংলায়",  flag: "🇧🇩" },
  { value: "english",  label: "English",  sub: "Global YouTube (English)", flag: "🇺🇸" },
  { value: "banglish", label: "Banglish", sub: "বাংলা + English মিশেল",    flag: "🔤" },
];

// ── Duration options ──────────────────────────────────────────────────────
const DURATION_OPTIONS: {
  value: StoryDuration; label: string; emoji: string; sub: string; badge?: string;
}[] = [
  { value: "1min", emoji: "⚡", label: "১ মিনিট",  sub: "Shorts বা দ্রুত" },
  { value: "2min", emoji: "🎯", label: "২ মিনিট",  sub: "সংক্ষিপ্ত গল্প" },
  { value: "3min", emoji: "✨", label: "৩ মিনিট",  sub: "সবচেয়ে জনপ্রিয়", badge: "🔥 সেরা" },
  { value: "4min", emoji: "🎬", label: "৪ মিনিট",  sub: "বিস্তারিত দৃশ্য" },
  { value: "5min", emoji: "🏆", label: "৫ মিনিট",  sub: "পূর্ণ ডকুমেন্টারি" },
];

// ── Aspect ratio options (only 2) ─────────────────────────────────────────
const ASPECT_OPTIONS: { value: AspectRatio; label: string; sub: string; emoji: string }[] = [
  { value: "9:16", emoji: "📱", label: "9:16 Shorts / Reels", sub: "TikTok, Shorts ও Reels এর জন্য" },
  { value: "16:9", emoji: "🖥️",  label: "16:9 YouTube",       sub: "YouTube লং ও ডকুমেন্টারির জন্য" },
];

// ── Genre options with updated Bengali labels ─────────────────────────────
const GENRE_OPTIONS: { value: StoryGenre; label: string; emoji: string; sub: string; isHot?: boolean }[] = [
  { value: "auto",             emoji: "🤖", label: "Auto AI",          sub: "AI নিজেই বেছে নেবে" },
  { value: "us_documentary",   emoji: "🇺🇸", label: "US ডকুমেন্টারি",    sub: "ইউএস ক্রাইম ও মিস্ট্রি", isHot: true },
  { value: "true_crime",       emoji: "🕵️", label: "ট্রু ক্রাইম",       sub: "তদন্ত ও সত্য ঘটনা",      isHot: true },
  { value: "scandal_business", emoji: "🏢", label: "বিজনেস স্ক্যান্ডাল", sub: "ওয়াল স্ট্রিট ও প্রতারণা", isHot: true },
  { value: "documentary",      emoji: "🎥", label: "সাধারণ ডকুমেন্টারি", sub: "বাস্তব ঘটনা ও ইতিহাস" },
  { value: "comedy",           emoji: "😄", label: "কমেডি ও ফানি",     sub: "হাস্যকর ও ভাইরাল" },
  { value: "mystery",          emoji: "🔍", label: "রহস্য (Mystery)",   sub: "সাসপেন্স ও গোপন ক্লু" },
  { value: "horror",           emoji: "👻", label: "ভৌতিক (Horror)",    sub: "ভয় ও প্যারানরমাল" },
  { value: "thriller",         emoji: "😱", label: "থ্রিলার",          sub: "রুদ্ধশ্বাস টানটান উত্তেজনা" },
  { value: "adventure",        emoji: "🌍", label: "অ্যাডভেঞ্চার",     sub: "অভিযান ও বেঁচে থাকা" },
  { value: "drama",            emoji: "🎭", label: "নাটকীয় (Drama)",   sub: "গভীর আবেগ ও সংঘাত" },
  { value: "action",           emoji: "💥", label: "অ্যাকশন",          sub: "উত্তেজনাপূর্ণ মারপিট" },
  { value: "motivational",     emoji: "💪", label: "অনুপ্রেরণামূলক",   sub: "সাফল্যের গল্প" },
  { value: "educational",      emoji: "📚", label: "শিক্ষামূলক",       sub: "জ্ঞান ও তথ্যভিত্তিক" },
  { value: "romantic",         emoji: "💕", label: "রোমান্টিক",        sub: "প্রেমের গল্প" },
];

// ── Visual Style options ──────────────────────────────────────────────────
const VISUAL_STYLE_EMOJIS: Record<string, string> = {
  cinematic_realistic: "🎬",
  ultra_realistic:     "📷",
  documentary:         "📹",
  "3d_animation":      "🎮",
  anime:               "🌸",
  fantasy:             "🔮",
  film_look:           "🎞️",
};


// ── Section Title helper ──────────────────────────────────────────────────
function SectionTitle({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: sub ? 2 : 0 }}>
        <span style={{ display: "flex", alignItems: "center", color: "#a78bfa" }}>{icon}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{title}</span>
      </div>
      {sub && <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, paddingLeft: 26 }}>{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
export default function StoryInputForm({ onSubmit, loading, initialInput, apiKey }: StoryInputFormProps) {
  const [input, setInput] = useState<StoryInput>({
    storyHint:       initialInput?.storyHint       || "",
    language:        initialInput?.language         || "bangla",
    duration:        initialInput?.duration         || "3min",
    genre:           initialInput?.genre            || "auto",
    visualStyle:     initialInput?.visualStyle      || "cinematic_realistic",
    aspectRatio:     initialInput?.aspectRatio === "1:1" ? "9:16" : (initialInput?.aspectRatio || "9:16"),
    voiceMode:       "narration",
    voiceStyle:      "auto",
    backgroundMusic: initialInput?.backgroundMusic ?? true,
    soundEffects:    initialInput?.soundEffects    ?? true,
  });

  const [activeCategory, setActiveCategory] = useState<string>("🇺🇸 US ক্রাইম ডকুমেন্টারি");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [lastIndexMap, setLastIndexMap] = useState<Record<string, number>>({});

  const update = <K extends keyof StoryInput>(key: K, val: StoryInput[K]) =>
    setInput(prev => ({ ...prev, [key]: val }));

  // Pick a random hint that does not repeat the last one
  const handleSelectCategory = useCallback((cat: CategorySuggestion) => {
    setActiveCategory(cat.label);
    update("genre", cat.genre);

    const prevIdx = lastIndexMap[cat.label] ?? -1;
    const pool = cat.hints.map((_, i) => i).filter(i => i !== prevIdx);
    const chosenIdx = pool[Math.floor(Math.random() * pool.length)] ?? 0;

    setLastIndexMap(prev => ({ ...prev, [cat.label]: chosenIdx }));
    update("storyHint", cat.hints[chosenIdx]);
  }, [lastIndexMap]);

  // Dynamic AI Generation of Fresh Premise via Gemini API
  const handleGenerateWithAi = async () => {
    const key = apiKey || (() => {
      try {
        const u = JSON.parse(localStorage.getItem("user_api_keys") || "[]");
        const a = JSON.parse(localStorage.getItem("admin_api_keys") || "[]");
        return u[0] || a[0] || "";
      } catch { return ""; }
    })();

    if (!key) {
      const currentCat = CATEGORY_SUGGESTIONS.find(c => c.label === activeCategory) || CATEGORY_SUGGESTIONS[0];
      handleSelectCategory(currentCat);
      return;
    }

    setAiGenerating(true);
    try {
      const generatedText = await generateStoryIdea(key, activeCategory, input.language);
      if (generatedText) {
        update("storyHint", generatedText);
      }
    } catch {
      const currentCat = CATEGORY_SUGGESTIONS.find(c => c.label === activeCategory) || CATEGORY_SUGGESTIONS[0];
      handleSelectCategory(currentCat);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.storyHint.trim() || loading) return;
    onSubmit(input);
  };

  const activeCard = (active: boolean, color = "#6c47ff"): React.CSSProperties => ({
    background:   active ? `${color}18` : "var(--bg-secondary)",
    border:       `2px solid ${active ? color : "var(--border-light)"}`,
    borderRadius: 14,
    cursor:       "pointer",
    transition:   "all 0.2s",
    position:     "relative",
  });

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >

      {/* ── 1. STORY IDEA SECTION ────────────────────────────────────── */}
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-light)", borderRadius: 20, padding: "22px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          <SectionTitle
            icon={<Sparkles size={18} />}
            title="গল্পের মূল ধারণা ও টপিক"
            sub="যেকোনো টপিকে চাপ দিলে নতুন গল্প আসবে — 'AI দিয়ে নতুন আইডিয়া' চাপলে সম্পূর্ণ নতুন গল্প লিখবে"
          />

          {/* AI Generate Button */}
          <button
            type="button"
            onClick={handleGenerateWithAi}
            disabled={aiGenerating}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 16px",
              borderRadius: 12,
              background: aiGenerating ? "#334155" : "linear-gradient(135deg, #6c47ff, #3b82f6)",
              border: "none",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: aiGenerating ? "wait" : "pointer",
              boxShadow: "0 4px 16px rgba(108, 71, 255, 0.25)",
              transition: "transform 0.15s, opacity 0.15s",
            }}
            onMouseOver={e => !aiGenerating && (e.currentTarget.style.opacity = "0.9")}
            onMouseOut={e => (e.currentTarget.style.opacity = "1")}
          >
            {aiGenerating ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  style={{ width: 14, height: 14, border: "2px solid #555", borderTopColor: "#fff", borderRadius: "50%" }} />
                AI ভাবছে...
              </>
            ) : (
              <>
                <Wand2 size={15} />
                ✨ AI দিয়ে নতুন আইডিয়া আনুন
              </>
            )}
          </button>
        </div>

        {/* Suggestion Chips */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 14,
          maxHeight: 180,
          overflowY: "auto",
          paddingBottom: 4,
        }}>
          {CATEGORY_SUGGESTIONS.map(cat => {
            const isSelected = activeCategory === cat.label;
            return (
              <button
                key={cat.label}
                type="button"
                onClick={() => handleSelectCategory(cat)}
                style={{
                  padding: "7px 14px",
                  background: isSelected ? "rgba(108, 71, 255, 0.18)" : "var(--bg-overlay-10)",
                  border: `1.5px solid ${isSelected ? "#8b5cf6" : "var(--border)"}`,
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? "#a78bfa" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                }}
              >
                <span>{cat.label}</span>
                {cat.badge && (
                  <span style={{
                    fontSize: 9,
                    fontWeight: 800,
                    padding: "1px 6px",
                    borderRadius: 99,
                    background: "linear-gradient(90deg, #ff416c, #ff4b2b)",
                    color: "#fff",
                  }}>
                    {cat.badge}
                  </span>
                )}
                <RefreshCw size={11} style={{ opacity: isSelected ? 0.9 : 0.4 }} />
              </button>
            );
          })}
        </div>

        {/* Textarea */}
        <div style={{ position: "relative" }}>
          <textarea
            value={input.storyHint}
            onChange={e => update("storyHint", e.target.value.slice(0, 1000))}
            placeholder={"এখানে আপনার গল্পের বিস্তারিত বা সারসংক্ষেপ লিখুন...\n\nযেমন: ১৯৮৫ সালে নিউ ইয়র্কের একটি ব্যাংকে ঘটে যাওয়া রহস্যময় ডাকাতি, যেখানে টাকা উদ্ধার হলেও মূল চোর কখনো ধরা পড়েনি..."}
            required
            rows={5}
            style={{
              width: "100%",
              padding: "16px",
              paddingBottom: "36px",
              background: "var(--bg-secondary)",
              border: "1.5px solid var(--border-light)",
              borderRadius: 14,
              color: "var(--text-primary)",
              fontSize: 15,
              lineHeight: 1.65,
              resize: "vertical",
              outline: "none",
              minHeight: 120,
              boxSizing: "border-box",
              fontFamily: "inherit",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={e => {
              e.target.style.borderColor = "#6c47ff";
              e.target.style.boxShadow = "0 0 0 3px rgba(108, 71, 255, 0.15)";
            }}
            onBlur={e => {
              e.target.style.borderColor = "var(--border-light)";
              e.target.style.boxShadow = "none";
            }}
          />

          {/* Bottom Bar inside Textarea */}
          <div style={{
            position: "absolute",
            bottom: 8,
            left: 12,
            right: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pointerEvents: "none",
          }}>
            <div style={{ pointerEvents: "auto", display: "flex", gap: 10 }}>
              {input.storyHint && (
                <button
                  type="button"
                  onClick={() => update("storyHint", "")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: 11,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <X size={12} /> পরিষ্কার করুন
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const cat = CATEGORY_SUGGESTIONS.find(c => c.label === activeCategory) || CATEGORY_SUGGESTIONS[0];
                  handleSelectCategory(cat);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8b5cf6",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Dices size={12} /> অন্য গল্প দেখান
              </button>
            </div>

            <span style={{
              fontSize: 11,
              color: input.storyHint.length > 900 ? "#ef4444" : "var(--text-muted)",
            }}>
              {input.storyHint.length} / 1000
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. LANGUAGE ──────────────────────────────────────────────────── */}
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-light)", borderRadius: 20, padding: "22px 20px" }}>
        <SectionTitle icon={<Globe size={16} />} title="ভাষা বেছে নিন" sub="গল্পটি কোন ভাষায় তৈরি হবে?" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {LANGUAGE_OPTIONS.map(opt => {
            const active = input.language === opt.value;
            return (
              <button key={opt.value} type="button" onClick={() => update("language", opt.value)}
                style={{ ...activeCard(active, "#3b82f6"), padding: "16px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{opt.flag}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: active ? "#60a5fa" : "var(--text-primary)", marginBottom: 3 }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.3 }}>{opt.sub}</div>
                {active && <div style={{ position: "absolute", top: 8, right: 10, width: 8, height: 8, borderRadius: "50%", background: "#3b82f6" }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. DURATION ──────────────────────────────────────────────────── */}
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-light)", borderRadius: 20, padding: "22px 20px" }}>
        <SectionTitle icon={<Clock size={16} />} title="ভিডিওর দৈর্ঘ্য" sub="ভিডিওটি কতক্ষণের হবে?" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
          {DURATION_OPTIONS.map(opt => {
            const active = input.duration === opt.value;
            return (
              <button key={opt.value} type="button" onClick={() => update("duration", opt.value)}
                style={{ ...activeCard(active, "#8b5cf6"), padding: "14px 6px", textAlign: "center" }}>
                {opt.badge && (
                  <div style={{
                    position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                    background: "linear-gradient(90deg,#ff6b35,#f7931e)",
                    color: "#fff", fontSize: 9, fontWeight: 800,
                    padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap",
                  }}>{opt.badge}</div>
                )}
                <div style={{ fontSize: 22, marginBottom: 4 }}>{opt.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: active ? "#a78bfa" : "var(--text-primary)", marginBottom: 2 }}>{opt.label}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.3 }}>{opt.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. GENRE ─────────────────────────────────────────────────────── */}
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-light)", borderRadius: 20, padding: "22px 20px" }}>
        <SectionTitle icon={<Film size={16} />} title="গল্পের ধরন (Genre)" sub="আপনার গল্প কোন ধরনের? প্রতিটি ক্যাটাগরির জন্য আলাদা ভিডিও স্টাইল তৈরি হবে।" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {GENRE_OPTIONS.map(opt => {
            const active = input.genre === opt.value;
            return (
              <button key={opt.value} type="button" onClick={() => update("genre", opt.value as StoryGenre)}
                style={{ ...activeCard(active, "#f59e0b"), padding: "14px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 5 }}>{opt.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: active ? "#f59e0b" : "var(--text-primary)", marginBottom: 2 }}>{opt.label}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{opt.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 5. ASPECT RATIO ──────────────────────────────────────────────── */}
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-light)", borderRadius: 20, padding: "22px 20px" }}>
        <SectionTitle icon={<Monitor size={16} />} title="ভিডিও ফরম্যাট" sub="ভিডিওটি কোথায় আপলোড করবেন?" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {ASPECT_OPTIONS.map(opt => {
            const active = input.aspectRatio === opt.value;
            return (
              <button key={opt.value} type="button" onClick={() => update("aspectRatio", opt.value)}
                style={{ ...activeCard(active, "#10b981"), padding: "20px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 32 }}>{opt.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: active ? "#10b981" : "var(--text-primary)" }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{opt.sub}</div>
                {active && <div style={{ position: "absolute", top: 8, right: 10, width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 6. VISUAL STYLE ──────────────────────────────────────────────── */}
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-light)", borderRadius: 20, padding: "22px 20px" }}>
        <SectionTitle icon={<Palette size={16} />} title="ভিডিওর ভিজুয়্যাল স্টাইল" sub="গল্পটি দেখতে কেমন হবে?" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {Object.entries(VISUAL_STYLE_LABELS).map(([value, label]) => {
            const active = input.visualStyle === value;
            return (
              <button key={value} type="button" onClick={() => update("visualStyle", value as VisualStyle)}
                style={{ ...activeCard(active, "#ec4899"), padding: "14px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 5 }}>{VISUAL_STYLE_EMOJIS[value] || "🎨"}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: active ? "#ec4899" : "var(--text-primary)", lineHeight: 1.3 }}>{label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── GENERATE BUTTON ───────────────────────────────────────────────── */}
      <motion.button
        type="submit"
        disabled={!input.storyHint.trim() || loading}
        whileHover={{ scale: loading ? 1 : 1.015 }}
        whileTap={{ scale: loading ? 1 : 0.985 }}
        style={{
          width: "100%",
          padding: "20px 24px",
          background: loading || !input.storyHint.trim()
            ? "var(--bg-secondary)"
            : "linear-gradient(135deg, #6c47ff 0%, #4f46e5 50%, #7c3aed 100%)",
          border: "none",
          borderRadius: 18,
          color: loading || !input.storyHint.trim() ? "var(--text-muted)" : "#fff",
          fontSize: 18,
          fontWeight: 800,
          cursor: loading || !input.storyHint.trim() ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          boxShadow: loading || !input.storyHint.trim() ? "none" : "0 12px 40px rgba(108, 71, 255, 0.35)",
          transition: "all 0.3s",
          marginTop: 4,
          letterSpacing: 0.3,
        }}
      >
        {loading ? (
          <>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ width: 22, height: 22, border: "2.5px solid #555", borderTopColor: "#aaa", borderRadius: "50%" }} />
            AI গল্প তৈরি করছে...
          </>
        ) : (
          <>
            <Sparkles size={22} />
            ✨ আমার গল্প তৈরি করুন
          </>
        )}
      </motion.button>
    </motion.form>
  );
}
