// User Roles & Status
export type UserRole = 'user' | 'premium' | 'admin' | 'superadmin';
export type UserStatus = 'pending' | 'active' | 'suspended' | 'blocked';
export type UserPlan = 'pro' | 'agency';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  paymentNumber?: string;
  paymentMethod?: string;
  role: UserRole;
  status: UserStatus;
  plan: UserPlan;
  createdAt: string | any;
  approvedAt: string | any;
  approvedBy: string | null;
  lastLoginAt: string | any;
  photoURL?: string;
}

export type ContentType = 'long' | 'shorts' | 'tiktok' | 'reel';
export type Language = 'bangla' | 'english' | 'banglish';

export interface GenerationResult {
  id?: string;
  userId: string;
  topic: string;
  language: Language;
  contentType: ContentType;
  results: {
    titles: { 
      text: string; 
      emotionTag: string;
      hashtags?: string[];
      viralScore?: number;
      ctrScore?: number;
      seoScore?: number;
    }[];
    description: string;
    tags: {
      fromTitles: string[];
      tripleKeywords: string[];
      seoPowerTags: string[];
    };
    thumbnailStrategy: string;
    thumbnailPrompt: string;
    typography: {
      headline: string;
      supportingText: string;
      fontWeight: string;
      textColor: string;
      glowEffect: string;
      textPosition: string;
    };
    viralScore: {
      overall: number;
      ctrProbability: number;
      emotionalTrigger: number;
      seoStrength: number;
      curiosityGap: number;
      competitionDifficulty: number;
      label: 'Low' | 'Medium' | 'High' | 'Explosive';
    };
    contentStrategy: {
      uploadSchedule: {
        morning: string;
        afternoon: string;
        evening: string;
        bestDay: string;
      };
      shortsRepurposeIdea: string;
      bestHook?: string;
      uploadTime?: string;
      suggestedCTA?: string;
      videoStructure?: string;
    };
    copyrightCheck?: {
      isOriginal: boolean;
      originalityScore: number;
      warningMessage?: string;
    };
  };
  creditsUsed: number;
  generationTimeMs: number;
  createdAt: string;
  isFavorited: boolean;
}
