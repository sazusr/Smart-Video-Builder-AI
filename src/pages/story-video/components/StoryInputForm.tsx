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

const VISUAL_STYLE_DATA: { value: VisualStyle; emoji: string; label: string; sub: string }[] = [
  { value: "cinematic_realistic", emoji: "🎬", label: "সিনেমাটিক", sub: "মুভি লুক" },
  { value: "ultra_realistic",     emoji: "📷", label: "রিয়েলিস্টিক", sub: "বাস্তবসম্মত" },
  { value: "documentary",         emoji: "📹", label: "ডকুমেন্টারি", sub: "রিয়েল ফুটেজ" },
  { value: "film_look",           emoji: "🎞️", label: "ফিল্ম লুক", sub: "৩৫ মিমি ক্লাসিক" },
  { value: "3d_animation",        emoji: "🎮", label: "৩ডি অ্যানিমেশন", sub: "৩ডি স্টাইল" },
  { value: "anime",               emoji: "🌸", label: "অ্যানিমে", sub: "জাপানিজ আর্ট" },
  { value: "fantasy",             emoji: "🔮", label: "ফ্যান্টাসি", sub: "মায়াবী রূপ" },
];


// ── Section Title helper ──────────────────────────────────────────────────
function SectionTitle({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="mb-2 sm:mb-2.5">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="text-violet-400 flex items-center text-sm sm:text-base">{icon}</span>
        <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] tracking-wide">{title}</h3>
      </div>
      {sub && <p className="text-[10px] sm:text-xs text-[var(--text-muted)] mt-0.5 leading-tight pl-5 sm:pl-6">{sub}</p>}
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

  const activeCardClass = (active: boolean, activeBorder: string, activeBg: string) =>
    `rounded-xl border transition-all cursor-pointer select-none ${
      active
        ? `${activeBorder} ${activeBg} shadow-sm`
        : "border-[var(--border-light)] bg-[var(--bg-secondary)] hover:border-violet-500/40 opacity-90"
    }`;

  return (
    <motion.form
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 sm:gap-4"
    >

      {/* ── 1. STORY IDEA SECTION ────────────────────────────────────── */}
      <div className="bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-2xl p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-2.5">
          <SectionTitle
            icon={<Sparkles size={16} />}
            title="গল্পের মূল ধারণা ও টপিক"
            sub="টপিক চাপলে নতুন গল্প আসবে — AI দিয়েও সম্পূর্ণ নতুন গল্প আনতে পারেন"
          />

          {/* Compact AI Generate Button */}
          <button
            type="button"
            onClick={handleGenerateWithAi}
            disabled={aiGenerating}
            className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-blue-600 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            {aiGenerating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full"
                />
                <span className="text-[11px] sm:text-xs">ভাবছে...</span>
              </>
            ) : (
              <>
                <Wand2 size={13} />
                <span className="text-[11px] sm:text-xs">✨ AI আইডিয়া</span>
              </>
            )}
          </button>
        </div>

        {/* Suggestion Chips — single-line smooth horizontal scroll on mobile */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1.5 mb-2.5 -mx-1 px-1">
          {CATEGORY_SUGGESTIONS.map(cat => {
            const isSelected = activeCategory === cat.label;
            return (
              <button
                key={cat.label}
                type="button"
                onClick={() => handleSelectCategory(cat)}
                className={`shrink-0 inline-flex items-center gap-1 py-1 px-2.5 sm:py-1.5 sm:px-3 rounded-full text-[11px] sm:text-xs transition-all cursor-pointer ${
                  isSelected
                    ? "bg-violet-600/20 text-violet-300 border border-violet-500 font-bold"
                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-light)] font-medium hover:border-violet-500/50"
                }`}
              >
                <span>{cat.label}</span>
                {cat.badge && (
                  <span className="text-[8px] font-black px-1.5 py-0.2 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white leading-tight">
                    {cat.badge}
                  </span>
                )}
                <RefreshCw size={9} className={isSelected ? "opacity-90" : "opacity-40"} />
              </button>
            );
          })}
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={input.storyHint}
            onChange={e => update("storyHint", e.target.value.slice(0, 1000))}
            placeholder={"এখানে আপনার গল্পের বিস্তারিত বা সারসংক্ষেপ লিখুন...\n\nযেমন: ১৯৮৫ সালে নিউ ইয়র্কের একটি ব্যাংকে ঘটে যাওয়া রহস্যময় ডাকাতি..."}
            required
            rows={3}
            className="w-full p-2.5 sm:p-3 pb-8 text-xs sm:text-sm leading-relaxed bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl text-[var(--text-primary)] focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-all resize-y min-h-[90px] sm:min-h-[110px]"
          />

          {/* Bottom Bar inside Textarea */}
          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2.5 pointer-events-auto">
              {input.storyHint && (
                <button
                  type="button"
                  onClick={() => update("storyHint", "")}
                  className="text-[10px] sm:text-xs text-[var(--text-muted)] hover:text-rose-400 flex items-center gap-1 cursor-pointer bg-transparent border-none"
                >
                  <X size={11} /> পরিষ্কার
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const cat = CATEGORY_SUGGESTIONS.find(c => c.label === activeCategory) || CATEGORY_SUGGESTIONS[0];
                  handleSelectCategory(cat);
                }}
                className="text-[10px] sm:text-xs text-violet-400 font-semibold hover:text-violet-300 flex items-center gap-1 cursor-pointer bg-transparent border-none"
              >
                <Dices size={11} /> অন্য গল্প
              </button>
            </div>

            <span className={`text-[10px] ${input.storyHint.length > 900 ? "text-rose-500" : "text-[var(--text-muted)]"}`}>
              {input.storyHint.length} / 1000
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. LANGUAGE ──────────────────────────────────────────────────── */}
      <div className="bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-2xl p-3 sm:p-4">
        <SectionTitle icon={<Globe size={15} />} title="ভাষা বেছে নিন" sub="গল্পের ভয়েসওভার ও টেক্সট কোন ভাষায় হবে?" />
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
          {LANGUAGE_OPTIONS.map(opt => {
            const active = input.language === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("language", opt.value)}
                className={`p-2 sm:p-3 text-center ${activeCardClass(active, "border-blue-500", "bg-blue-600/15")}`}
              >
                <div className="text-xl sm:text-2xl mb-1">{opt.flag}</div>
                <div className={`text-xs sm:text-sm font-bold mb-0.5 ${active ? "text-blue-400" : "text-[var(--text-primary)]"}`}>
                  {opt.label}
                </div>
                <div className="text-[9px] sm:text-xs text-[var(--text-muted)] truncate">{opt.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. DURATION ──────────────────────────────────────────────────── */}
      <div className="bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-2xl p-3 sm:p-4">
        <SectionTitle icon={<Clock size={15} />} title="ভিডিওর সময়কাল" sub="গল্পটি কত মিনিটের তৈরি করতে চান?" />
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {DURATION_OPTIONS.map(opt => {
            const active = input.duration === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("duration", opt.value)}
                className={`p-1.5 sm:p-2.5 text-center relative ${activeCardClass(active, "border-violet-500", "bg-violet-600/15")}`}
              >
                {opt.badge && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[7px] sm:text-[8px] font-black px-1.5 py-0.2 rounded-full whitespace-nowrap shadow-sm">
                    {opt.badge}
                  </span>
                )}
                <div className="text-base sm:text-lg mb-0.5">{opt.emoji}</div>
                <div className={`text-[11px] sm:text-xs font-bold leading-tight ${active ? "text-violet-400" : "text-[var(--text-primary)]"}`}>
                  {opt.label}
                </div>
                <div className="text-[8px] sm:text-[10px] text-[var(--text-muted)] truncate mt-0.5">{opt.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. GENRE ─────────────────────────────────────────────────────── */}
      <div className="bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-2xl p-3 sm:p-4">
        <SectionTitle icon={<Film size={15} />} title="ভিডিও ক্যাটাগরি ও ধরন" sub="ইউএস ক্রাইম, স্ক্যান্ডাল, কমেডি বা হরর" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 sm:gap-2">
          {GENRE_OPTIONS.map(opt => {
            const active = input.genre === opt.value;
            const borderCol = opt.isHot ? "border-rose-500" : "border-amber-500";
            const bgCol = opt.isHot ? "bg-rose-500/15" : "bg-amber-500/15";
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("genre", opt.value)}
                className={`p-1.5 sm:p-2.5 text-center relative flex flex-col items-center justify-center ${activeCardClass(active, borderCol, bgCol)}`}
              >
                {opt.isHot && (
                  <span className="absolute top-1 right-1 text-[7px] sm:text-[8px] font-black text-rose-500 bg-rose-500/15 px-1 rounded">
                    HOT
                  </span>
                )}
                <div className="text-lg sm:text-xl mb-1">{opt.emoji}</div>
                <div className={`text-[11px] sm:text-xs font-bold leading-tight ${
                  active ? (opt.isHot ? "text-rose-400" : "text-amber-400") : "text-[var(--text-primary)]"
                }`}>
                  {opt.label}
                </div>
                <div className="text-[8px] sm:text-[10px] text-[var(--text-muted)] truncate mt-0.5">{opt.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 5. ASPECT RATIO ──────────────────────────────────────────────── */}
      <div className="bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-2xl p-3 sm:p-4">
        <SectionTitle icon={<Monitor size={15} />} title="ভিডিও ফরম্যাট" sub="কোথায় আপলোড করবেন?" />
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {ASPECT_OPTIONS.map(opt => {
            const active = input.aspectRatio === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("aspectRatio", opt.value)}
                className={`p-2.5 sm:p-3.5 text-center flex flex-col items-center gap-0.5 ${activeCardClass(active, "border-emerald-500", "bg-emerald-600/15")}`}
              >
                <div className="text-2xl sm:text-3xl">{opt.emoji}</div>
                <div className={`text-xs sm:text-sm font-bold ${active ? "text-emerald-400" : "text-[var(--text-primary)]"}`}>
                  {opt.label}
                </div>
                <div className="text-[9px] sm:text-xs text-[var(--text-muted)]">{opt.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 6. VISUAL STYLE ──────────────────────────────────────────────── */}
      <div className="bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-2xl p-3 sm:p-4">
        <SectionTitle icon={<Palette size={15} />} title="ভিজুয়্যাল স্টাইল" sub="ভিডিওর চিত্রায়ণ ও লুক কেমন হবে?" />
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
          {VISUAL_STYLE_DATA.map(item => {
            const active = input.visualStyle === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => update("visualStyle", item.value)}
                className={`p-2 sm:p-2.5 text-center flex flex-col items-center ${activeCardClass(active, "border-pink-500", "bg-pink-600/15")}`}
              >
                <div className="text-lg sm:text-xl mb-1">{item.emoji}</div>
                <div className={`text-[11px] sm:text-xs font-bold leading-tight ${active ? "text-pink-400" : "text-[var(--text-primary)]"}`}>
                  {item.label}
                </div>
                <div className="text-[8px] sm:text-[10px] text-[var(--text-muted)] truncate mt-0.5">{item.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── GENERATE BUTTON ───────────────────────────────────────────────── */}
      <motion.button
        type="submit"
        disabled={!input.storyHint.trim() || loading}
        whileHover={{ scale: loading ? 1 : 1.01 }}
        whileTap={{ scale: loading ? 1 : 0.99 }}
        className={`w-full py-3 sm:py-3.5 px-4 rounded-xl text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
          loading || !input.storyHint.trim()
            ? "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
            : "bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white shadow-violet-500/20 active:scale-[0.99]"
        }`}
      >
        {loading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            />
            <span>AI গল্প তৈরি করছে...</span>
          </>
        ) : (
          <>
            <Sparkles size={17} />
            <span>✨ আমার গল্প তৈরি করুন</span>
          </>
        )}
      </motion.button>
    </motion.form>
  );
}

