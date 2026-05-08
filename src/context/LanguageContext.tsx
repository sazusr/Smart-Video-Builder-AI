import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'English' | 'Bangla';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations = {
  Bangla: {
    nav: {
      home: "এজেন্ট",
      history: "হিস্ট্রি",
      trending: "ট্রেন্ডিং",
      admin: "অ্যাডমিন",
      settings: "সেটিংস"
    },
    dashboard: {
      activeBranding: "সক্রিয় ব্র্যান্ডিং",
      change: "পরিবর্তন",
      workspace: "জেনারেশন ওয়ার্কস্পেস",
      placeholder: "আপনার ভিডিওর টপিক বা ভয়েস ট্রান্সক্রিপ্ট এখানে দিন...",
      upload: "ভয়েস আপলোড",
      long: "লং কন্টেন্ট",
      shorts: "শর্টস",
      generate: "এজেন্ট",
      tags: "Viral SEO Tags",
      desc: "SEO Description",
      thumbIdea: "Thumbnail Direction",
      thumbPrompt: "এআই রেন্ডারিং প্রম্পট (DALL-E এর জন্য)",
      magicPreview: "ম্যাজিক প্রিভিউ তৈরি করুন",
      scriptHeader: "প্রোডাকশন স্ক্রিপ্ট v4.2",
      copyAll: "সব কপি করুন",
      yourChannel: "আপনার চ্যানেল",
      successMsg: "কন্টেন্ট সফলভাবে তৈরি হয়েছে!",
      errorMsg: "কন্টেন্ট তৈরি করতে ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।",
      copySuccess: "ক্লিপবোর্ডে কপি হয়েছে",
      copyrightTitle: "YouTube Copyright",
      checking: "বিশ্লেষণ করা হচ্ছে...",
      copyrightSafe: "YES",
      copyrightUnsafe: "NO",
      copyrightStatus: "কপিরাইট স্ট্যাটাস"
    },
    history: {
      title: "প্রোডাকশন হিস্ট্রি",
      subtitle: "আপনার পূর্ববর্তী ভিডিও সিস্টেমগুলো পরিচালনা করুন এবং পুনরায় দেখুন।",
      searchPlaceholder: "টপিক খুঁজুন...",
      deleteConfirm: "আপনি কি নিশ্চিত যে আপনি এটি ডিলিট করতে চান?",
      deleteSuccess: "ডিলিট করা হয়েছে",
      deleteError: "ডিলিট করতে ব্যর্থ হয়েছে",
      noHistory: "কোনো হিস্ট্রি পাওয়া যায়নি",
      snapshotPreview: "স্ন্যাপশট প্রিভিউ",
      openInEditor: "এডিটরে খুলুন",
      mainTopic: "মূল টপিক",
      titleStrategy: "টাইটেল কৌশল",
      productionTone: "প্রোডাকশন টোন",
      scriptPreview: "স্ক্রিপ্ট প্রিভিউ",
      selectGeneration: "একটি জেনারেশন বেছে নিন",
      selectGenerationDesc: "আপনার লাইব্রেরি থেকে আপনার ভাইরাল কৌশল এবং আউটপুট ফলাফলগুলো পুনরায় দেখুন।"
    },
    landing: {
      pricing: "প্রাইসিং",
      joinNow: "এখনই যুক্ত হোন",
      heroTitle1: "স্মার্ট",
      heroTitle2: "ভিডিও এআই",
      heroDesc: "আপনার ভিডিওকে দ্রুত SEO অপ্টিমাইজ করে শক্তিশালী করুন সহজেই",
      poweredBy: "Proudly Powered By"
    }
  },
  English: {
    nav: {
      home: "Agent",
      history: "History",
      trending: "Trending",
      admin: "Admin",
      settings: "Settings"
    },
    dashboard: {
      activeBranding: "Active Branding",
      change: "Change",
      workspace: "Generation Workspace",
      placeholder: "Enter your video topic or voice transcript here...",
      upload: "Upload Voice",
      long: "Long Content",
      shorts: "Shorts",
      generate: "Agent",
      tags: "Viral SEO Tags",
      desc: "SEO Description",
      thumbIdea: "Thumbnail Direction",
      thumbPrompt: "AI Rendering Prompt (Ready for DALL-E)",
      magicPreview: "Generate Magic Preview",
      scriptHeader: "Production Script v4.2",
      copyAll: "Copy All",
      yourChannel: "Your Channel",
      successMsg: "Content generated successfully!",
      errorMsg: "Failed to generate content. Please try again.",
      copySuccess: "Copied to clipboard",
      copyrightTitle: "YouTube Copyright",
      checking: "Analyzing Audio...",
      copyrightSafe: "YES",
      copyrightUnsafe: "NO",
      copyrightStatus: "Copyright Status"
    },
    history: {
      title: "Production History",
      subtitle: "Manage and revisit your previous video strategies.",
      searchPlaceholder: "Search topics...",
      deleteConfirm: "Are you sure you want to delete this?",
      deleteSuccess: "Deleted successfully",
      deleteError: "Failed to delete",
      noHistory: "No history found",
      snapshotPreview: "Snapshot Preview",
      openInEditor: "Open in Editor",
      mainTopic: "Main Topic",
      titleStrategy: "Title Strategy",
      productionTone: "Production Tone",
      scriptPreview: "Script Preview",
      selectGeneration: "Select a generation",
      selectGenerationDesc: "Revisit your viral strategies and output results from your library."
    },
    landing: {
      pricing: "Pricing",
      joinNow: "Join Now",
      heroTitle1: "Smart",
      heroTitle2: "Video AI",
      heroDesc: "Empower your videos with fast SEO optimization easily",
      poweredBy: "Proudly Powered By"
    }
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'Bangla';
  });

  useEffect(() => {
    localStorage.setItem('app-language', language);
  }, [language]);

  const value = {
    language,
    setLanguage,
    t: translations[language]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
