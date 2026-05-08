import { GoogleGenAI, Type } from "@google/genai";

const defaultAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

function getAi(userApiKey?: string) {
  if (userApiKey) {
    return new GoogleGenAI({ apiKey: userApiKey });
  }
  return defaultAi;
}

export interface VideoContent {
  title: string;
  description: string;
  tags: string[];
  thumbnailIdea: string;
  thumbnailPrompt: string;
  script: {
    hook: string;
    intro: string;
    main: string;
    outro: string;
  };
  analytics: {
    tone: string;
    keywords: string[];
  };
}

export type CopyrightStatus = 'YES' | 'NO';

export async function checkAudioCopyright(
  topic: string,
  userApiKey?: string,
  backupApiKeys?: string[]
): Promise<CopyrightStatus> {
  const modelName = "gemini-3-flash-preview";
  
  const attemptCheck = async (key?: string) => {
    const ai = getAi(key);
    
    const systemInstruction = `You are a YouTube Rights Management Expert. 
    Analyze the provided audio transcript or metadata for potential copyright issues.
    YouTube's Content ID system picks up:
    1. Popular music or backing tracks.
    2. Licensed sound effects.
    3. Re-uploaded media content.
    
    CRITICAL: 
    - Return 'NO' if the audio likely contains copyrighted music, unlicensed famous melodies, or high-risk protected content.
    - Return 'YES' if the audio sounds like original speech, royalty-free content, or safe personal recordings.
    
    Respond ONLY with 'YES' or 'NO'. No other text.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Input: "${topic}". Is this safe for YouTube monetization?`,
      config: {
        systemInstruction,
      }
    });

    const text = response.text?.trim().toUpperCase();
    return text === 'YES' ? 'YES' : 'NO';
  };

  try {
    return await attemptCheck(userApiKey);
  } catch (error) {
    if (backupApiKeys && backupApiKeys.length > 0) {
      for (const key of backupApiKeys) {
        try {
          return await attemptCheck(key);
        } catch (err) {
          console.warn("Backup copyright key failed, trying next...");
        }
      }
    }
    return await attemptCheck();
  }
}

export async function generateVideoContent(
  topic: string, 
  isAudio: boolean = false, 
  language: 'English' | 'Bangla' = 'English', 
  userApiKey?: string, 
  backupApiKeys?: string[],
  videoType: 'long' | 'shorts' = 'long',
  channelName?: string
): Promise<VideoContent> {
  const modelName = "gemini-3-flash-preview";
  
  const attemptGeneration = async (key?: string) => {
    const ai = getAi(key);
    
    const brandingNote = channelName ? `BRANDING: The content MUST include the channel name "${channelName}" in the Title (if natural) and at the end of the Description.` : '';
    
    const longVideoRules = `
    - VIRAL SEO TITLE: Create a catchy, high-CTR, viral title.
      - Use curiosity words: "রহস্য", "অবিশ্বাস্য", "শেষ পর্যন্ত দেখুন", "চমকে যাবেন", "সত্য", "ভয়ংকর", "লিক", "ধরা পড়লো".
      - Length: < 70 chars. Mobile-friendly.
      - SEO: Main keywords at the beginning. 
    - VIRAL SEO DESCRIPTION:
      - Line 1: Main Hook or Curiosity Keyword. Main keyword within 100 characters.
      - Body: Short summary followed by natural keyword integration.
      - CTA: "ভিডিওটি ভালো লাগলে Like, Comment ও Subscribe করুন।"
      - Hashtags: 3-5 relevant.`;

    const shortsRules = `
    - VIRAL HOOK TITLE: Create a powerful, fast-paced hook title for Shorts.
      - Hook: First 2-4 words MUST capture instant attention.
      - Hashtags: You MUST include exactly 3 hashtags at the end of the title: #ChannelName (using "${channelName || 'YourChannel'}"), and 2 other viral/trending hashtags.
      - Length: Very short and punchy.
    - VIRAL SHORT DESCRIPTION/CAPTION:
      - Style: Viral caption style. Very concise but dense with hashtags.
      - Engagement: Use "শেষে যা হলো...", "৯৯% মানুষ জানে না".
      - Hashtags: Use 10-15 trending Shorts hashtags.
    - VIRAL TAGS: Provide a list of 30-40 high-impact, genuine, and important SEO tags specifically for Shorts.`;

    const systemInstruction = `You are a world-class Social Media Content Architect and SEO Specialist. 
    Your mission is to generate viral, high-engagement video metadata for a ${videoType === 'long' ? 'Long-form Video' : 'YouTube Shorts/TikTok'} content.
    
    ${brandingNote}

    CRITICAL RULES:
    1. LANGUAGE ENFORCEMENT: All generated content (Title, Description, Tags, Script) MUST be 100% in ${language}. If ${language} is Bangla, use natural, professional, and viral Bangla language. DO NOT mix or switch to English unless it is for technical tags.
    2. CONTENT FORMATTING (${videoType.toUpperCase()} VIDEO):
       ${videoType === 'long' ? longVideoRules : shortsRules}
    3. VIRAL TAGS: Provide a list of ${videoType === 'long' ? '15-20' : '30-40'} tags in ${language}. Mix of viral ${language} keywords and trending SEO terms.
    4. THUMBNAIL DESIGN: 
       - 'thumbnailIdea': Describe a high-CTR visual concept in ${language}. 
       - 'thumbnailPrompt': This MUST be a professional English prompt for DALL-E 3 (AI image generators only understand English).
    5. CONSISTENCY: Title, Description, Tags, and Thumbnail MUST all work together as a unified viral package in ${language}.
    6. THE RESPONSE: Must be a single valid JSON object strictly following the schema.`;

    const prompt = isAudio 
      ? `Input source (Text/Audio Transcript): "${topic}". Analyze this input and generate a complete viral video package centered around its core message.`
      : `Generate a complete viral video package for the following topic: "${topic}". Focus on making it stand out in a crowded feed.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            thumbnailIdea: { type: Type.STRING },
            thumbnailPrompt: { type: Type.STRING },
            script: {
              type: Type.OBJECT,
              properties: {
                hook: { type: Type.STRING },
                intro: { type: Type.STRING },
                main: { type: Type.STRING },
                outro: { type: Type.STRING }
              }
            },
            analytics: {
              type: Type.OBJECT,
              properties: {
                tone: { type: Type.STRING },
                keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          },
          required: ["title", "description", "tags", "thumbnailIdea", "thumbnailPrompt", "script", "analytics"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  };

  try {
    return await attemptGeneration(userApiKey);
  } catch (error) {
    if (backupApiKeys && backupApiKeys.length > 0) {
      for (const key of backupApiKeys) {
        try {
          return await attemptGeneration(key);
        } catch (err) {
          console.warn("Backup API key failed, trying next...", err);
        }
      }
    }
    return await attemptGeneration();
  }
}

export async function generateTrendingIdeas(userApiKey?: string, backupApiKeys?: string[], n: number = 5): Promise<string[]> {
  const attemptTrending = async (key?: string) => {
    const ai = getAi(key);
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate ${n} trending video ideas for social media (YouTube/TikTok) right now. Return as a list of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  };

  try {
    return await attemptTrending(userApiKey);
  } catch (error) {
    if (backupApiKeys && backupApiKeys.length > 0) {
      for (const key of backupApiKeys) {
        try {
          return await attemptTrending(key);
        } catch (err) {
          console.warn("Backup trending key failed, trying next...");
        }
      }
    }
    return await attemptTrending();
  }
}
