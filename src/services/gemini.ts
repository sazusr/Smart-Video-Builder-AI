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

export async function generateVideoContent(topic: string, isAudio: boolean = false, language: 'English' | 'Bangla' = 'English', userApiKey?: string, backupApiKeys?: string[]): Promise<VideoContent> {
  const modelName = "gemini-3-flash-preview";
  
  const attemptGeneration = async (key?: string) => {
    const ai = getAi(key);
    
    const systemInstruction = `You are a world-class Social Media Content Architect and SEO Specialist. 
    Your mission is to generate viral, high-engagement video metadata.
    
    CRITICAL RULES:
    1. LANGUAGE: Respond in ${language}. If the language is Bangla, all content (Title, Description, Script) MUST be in professional, natural Bangla. Do NOT translate to English unless specified.
    2. SEO TITLE: Create a catchy, high-CTR title that is optimized for search. If Bangla, keep it in Bangla but ensure it sounds professional.
    3. PROFESSIONAL DESCRIPTION: 
       - Use a professional and engaging tone.
       - Include a clear call to action.
       - At the VERY bottom, include 5-10 relevant professional hashtags (a mix of common and niche).
    4. VIRAL TAGS: Provide a list of 15-20 tags. This MUST be a mix of highly viral Bangla keywords and trending English SEO terms related to the topic. All tags MUST relate directly to the Title's context.
    5. THUMBNAIL DESIGN: 
       - 'thumbnailIdea': Describe a high-CTR, relatable visual concept in ${language}. Focus on a single powerful image that captures the video's core message.
       - 'thumbnailPrompt': This MUST be a professional English prompt for DALL-E 3. It MUST strictly follow these principles:
         - Core Qualities: "Strong Visualization, Clean Composition, 3D/Emboss Style, Cinematic Lighting, Bold Main Subject, Minimal Text, High Contrast, No Noise/Clutter, Ultra Detailed, Eye-Catching Colors."
         - Clarity: Ensure the design is "Clean, Clickable, High Quality" and easily understandable from afar.
         - Constraints: Avoid too much text, too many objects, or visual noise. Focus on one high-impact focal point that directly reflects the Title's hook.
         - Typography: Specify "Professional bold 3D typography" only for the most important hook word.
    6. CONSISTENCY: Ensure the tags, title, description, and thumbnail hook all synchronize perfectly.
    7. THE RESPONSE: Must be a single valid JSON object strictly following the schema.`;

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
