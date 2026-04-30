import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

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

export async function generateVideoContent(topic: string, isAudio: boolean = false, language: 'English' | 'Bangla' = 'English'): Promise<VideoContent> {
  const modelName = "gemini-3-flash-preview";
  
  const systemInstruction = `You are an expert video content creator and SEO specialist. 
  Your goal is to generate high-quality, engaging content for a video based on the user's input.
  Respond in ${language}.
  The response MUST be a single JSON object.`;

  const prompt = isAudio 
    ? `Analyze the provided audio/text and extract the video topic. Then generate content for it. Input: ${topic}`
    : `Generate video content for the topic: ${topic}`;

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

  const content = JSON.parse(response.text || '{}');
  return content;
}

export async function generateTrendingIdeas(n: number = 5): Promise<string[]> {
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
}
