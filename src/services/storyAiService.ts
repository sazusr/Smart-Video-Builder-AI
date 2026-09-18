import type { StoryInput, GeneratedStory, CharacterProfile, LocationProfile, VisualStyleProfile, AudioPlan, StoryScene, StoryDuration, VisualStyle, StoryGenre, VoiceMode, StoryLanguage, AspectRatio } from '../types/storyVideo';
import { DURATION_SCENE_MAP, getDurationConfig } from '../types/storyVideo';

const GEMINI_MODEL = 'gemini-3.6-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ── Helper functions ────────────────────────────────────────────────────────
async function callGemini(apiKey: string, prompt: string): Promise<any> {
  const url = `${API_URL}?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData?.error?.message || `HTTP ${response.status}`;
    throw new Error(`Gemini API error: ${msg}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini');
  }

  return parseJsonResponse(text);
}

function parseJsonResponse(text: string): any {
  let clean = text.trim();
  clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
  clean = clean.replace(/\s*```$/i, '');
  clean = clean.trim();

  try {
    return JSON.parse(clean);
  } catch (error) {
    const jsonMatch = clean.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerError) {
        throw new Error('Failed to parse Gemini response as JSON even after cleanup');
      }
    }
    throw new Error('Could not find valid JSON in Gemini response');
  }
}

// ── API Functions ───────────────────────────────────────────────────────────

export async function generateStoryIdea(
  apiKey: string,
  category: string,
  language: StoryLanguage
): Promise<string> {
  const langName = language === 'bangla' ? 'Bengali (বাংলা)' : language === 'english' ? 'English' : 'Banglish';
  const prompt = `You are an elite YouTube documentary & viral storytelling strategist.
Generate ONE unique, captivating, and high-CTR video story hook/premise in the category: "${category}".
Language: ${langName}.

    Guidelines:
- 2 to 3 sentences only.
- Start with an irresistible curiosity hook or mysterious event.
- If it's a Bangladeshi Documentary / History, focus on intriguing mysteries from Sundarbans, ancient Bengali history, 1971 liberation war untold heroism, or historical folklore.
- If it's a US Documentary / True Crime / Business Scandal / Area 51, make it sound like an intense MagnatesMedia or Netflix true crime documentary.
- If it's Sad / Emotional Story, make it deeply touching, evoking tears and empathy (e.g. parents' sacrifices, silent struggles, lost loved ones).
- If it's Motivational / Success Story, make it an incredible real-life rags-to-riches, resilience, or triumph against all odds.
- If it's Comedy / Funny, make it hilarious, witty, and deeply relatable.
- If it's Romance / Love Story, make it passionate, heartwarming, or poignantly bittersweet.
- If it's Horror, make it chilling and spine-tingling.
- Output ONLY the 2-3 sentence story premise text. No quotes, no intro, no emojis, no labels.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    throw new Error('Gemini API error generating idea');
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty idea from Gemini');
  return text.trim().replace(/^["']|["']$/g, '');
}

export async function generateStory(apiKey: string, input: StoryInput): Promise<GeneratedStory> {
  const prompt = `You are a master storyteller and YouTube documentary scriptwriter. Create a highly engaging, viral, and captivating story based on this hint: "${input.storyHint}".
Language: ${input.language === 'bangla' ? 'Bengali' : input.language === 'english' ? 'English' : 'Banglish (Bengali written in English alphabet or mixed)'}
Duration limit: ${input.duration}
Genre: ${input.genre}

CULTURAL & SETTING DIRECTIVES:
- Detect the intended setting from the genre (${input.genre}) and the story hint.
- If the genre is 'us_documentary', 'true_crime', 'scandal_business', or the hint references the USA, FBI, CIA, Silicon Valley, Wall Street, American crime, Area 51, Hollywood, Cold War, or international figures: Set the story authentically in the USA or international setting with authentic names (e.g. American names, realistic locations), and deliver a high-stakes, gripping documentary narrative style (like Netflix, MagnatesMedia, Johnny Harris, Vox).
- If the story is explicitly set in Bangladesh or reflects local culture: Authentically set it in Bangladesh with authentic Bengali character names, locations, and cultural nuances.
- Otherwise, choose the most fitting setting that makes the story viral, dramatic, and emotionally resonant.
- The narrative itself must be written in the specified Language (${input.language === 'bangla' ? 'Bengali' : input.language === 'english' ? 'English' : 'Banglish'}).

Output MUST be valid JSON containing:
{
  "title": "Story Title",
  "logline": "1-2 sentence hook",
  "completeStory": "The full detailed story text",
  "summary": "Short summary",
  "characters": ["Char 1 name", "Char 2 name"],
  "locations": ["Loc 1", "Loc 2"],
  "storyArc": {
    "beginning": "setup",
    "conflict": "the problem",
    "climax": "peak action",
    "ending": "resolution"
  }
} `;

  return callGemini(apiKey, prompt);
}

export async function generateCharacterBible(
  apiKey: string,
  story: GeneratedStory,
  visualStyle: VisualStyle
): Promise<CharacterProfile[]> {
  const prompt = `You are an expert AI Video Character Designer. Create a detailed character bible for these characters: ${story.characters.join(', ')}.
Visual Style: ${visualStyle}
Story Summary: ${story.summary}

CONTEXT DIRECTIVES:
- Match character ethnicity, skin tone, facial features, and wardrobe authentically to the story's setting and genre (e.g., if US documentary/crime, use authentic American/Western appearance, suits, badges, coats, or casual streetwear; if Bangladeshi, authentically reflect Bangladeshi people and attire like Panjabi/Sharee/local modern wear).
- IMPORTANT: Write ALL descriptive text values in BENGALI (Bangla script). Only characterId should be in English.

Create incredibly specific visual descriptions optimized for Veo/Midjourney consistency.

Output MUST be a valid JSON array of objects:
[{
  "characterId": "char_1",
  "name": "নাম বাংলায়",
  "age": "বয়স সংখ্যা",
  "gender": "পুরুষ/মহিলা/অন্য",
  "faceDescription": "মুখমণ্ডলের সব বিবরণ বাংলায়",
  "skinTone": "ত্বকের রং বাংলায়",
  "hair": "চুলের রং ও দৈর্ঘ্য",
  "hairStyle": "চুলের ধরন বাংলায়",
  "bodyType": "শারীরিক গড়ন বাংলায়",
  "height": "উচ্চতা বাংলায়",
  "clothing": "পোশাকের বিবরণ বাংলায়",
  "shoes": "জুতার বিবরণ বাংলায়",
  "accessories": "অনুষঙ্গের বিবরণ বাংলায়",
  "facialFeatures": "মুখের বিশেষ বৈশিষ্ট্য বাংলায়",
  "personality": "ব্যক্তিত্বের বিবরণ বাংলায়",
  "emotionStyle": "আবেগ প্রকাশের ধরন বাংলায়",
  "voiceDescription": "কণ্ঠস্বরের বিবরণ বাংলায়"
}]`;

  return callGemini(apiKey, prompt);
}

export async function generateLocationBible(
  apiKey: string,
  story: GeneratedStory,
  visualStyle: VisualStyle
): Promise<LocationProfile[]> {
  const prompt = `You are an expert Production Designer. Create a detailed location bible for these locations: ${story.locations.join(', ')}.
Visual Style: ${visualStyle}
Story Summary: ${story.summary}

CONTEXT DIRECTIVES:
- Match location architecture, environment, and atmosphere authentically to the story's setting (e.g., if US documentary/crime, design American city skylines, glass skyscrapers, courtrooms, neon alleys, FBI offices, or California mansions; if Bangladeshi, design authentic local streets, riversides, historic monuments, or rural villages).
- IMPORTANT: Write ALL descriptive text values in BENGALI (Bangla script). Only locationId should be in English.

Output MUST be a valid JSON array of objects:
[{
  "locationId": "loc_1",
  "locationName": "স্থানের নাম বাংলায়",
  "locationType": "অভ্যন্তর/বাইর",
  "environment": "পরিবেশের বিবরণ বাংলায়",
  "architecture": "স্থাপত্যের ধরন বাংলায়",
  "importantObjects": ["গুরুত্বপূর্ণ বস্তু বাংলায়"],
  "weather": "আবহাওয়া বাংলায়",
  "timeOfDay": "সময় বাংলায়",
  "lighting": "আলোর বিবরণ বাংলায়",
  "visualDescription": "সম্পূর্ণ ভিস্যুয়াল বর্ণনা বাংলায়"
}]`;

  return callGemini(apiKey, prompt);
}

export async function generateVisualStyleBible(
  apiKey: string,
  visualStyle: VisualStyle,
  genre: StoryGenre
): Promise<VisualStyleProfile> {
  const prompt = `You are an expert Cinematographer. Create a master visual style guide.
Selected Style: ${visualStyle}
Genre: ${genre}

IMPORTANT: Write ALL descriptive text values in BENGALI (Bangla script).

Output MUST be a valid JSON object:
{
  "visualStyle": "সমস্ত ভিস্যুয়াল স্টাইল বাংলায়",
  "cinematography": "ক্যামেরা স্টাইল বাংলায়",
  "lighting": "আলোর বিন্যাস বাংলায়",
  "colorGrading": "কালার প্যালেট বাংলায়",
  "contrast": "কন্ট্রাস্ট বাংলায়",
  "depthOfField": "ডেপথ অফ ফিল্ড বাংলায়",
  "cameraLanguage": "ক্যামেরা মুভমেন্ট বাংলায়",
  "lensStyle": "লেন্সের ধরন বাংলায়",
  "filmLook": "ফিল্মের লুক বাংলায়",
  "aspectRatio": "ফ্রেমিং নোট বাংলায়"
}`;

  return callGemini(apiKey, prompt);
}

export async function generateAudioPlan(
  apiKey: string,
  story: GeneratedStory,
  voiceMode: VoiceMode,
  language: StoryLanguage
): Promise<AudioPlan> {
  const prompt = `You are an expert Sound Designer. Create an audio plan for this story.
Story Summary: ${story.summary}
Voice Mode: ${voiceMode}
Language: ${language}

IMPORTANT: Write ALL descriptive text values in BENGALI (Bangla script).

Output MUST be a valid JSON object:
{
  "overallStrategy": "অডিও কৌশল বাংলায়",
  "narratorVoice": "নারেটরের কণ্ঠস্বর বাংলায়",
  "narratorTone": "নারেশনের টোন বাংলায়",
  "musicGenre": "মিউজিকের ধরন বাংলায়",
  "musicMood": "মিউজিকের মূড বাংলায়",
  "sceneAudioNotes": [
    {
      "sceneId": "scene_1",
      "audioType": "narration",
      "notes": "সিনের অডিও নোট বাংলায়"
    }
  ]
}
For sceneId, just generate scene_1 to scene_5 as a baseline.`;

  return callGemini(apiKey, prompt);
}

export async function generateSceneBreakdown(
  apiKey: string,
  story: GeneratedStory,
  duration: StoryDuration,
  characterBible: CharacterProfile[],
  locationBible: LocationProfile[],
  visualStyleBible: VisualStyleProfile
): Promise<StoryScene[]> {
  const { minScenes, maxScenes } = getDurationConfig(duration);
  
  const prompt = `You are an expert Director. Break down this story into sequential scenes.
Create between ${minScenes} and ${maxScenes} scenes.
Each scene MUST be exactly 4, 6, or 8 seconds long.
Story: ${story.completeStory}

Output MUST be a valid JSON array of objects representing scenes:
[{
  "sceneId": "scene_1",
  "orderIndex": 0,
  "durationSeconds": 4, // strictly 4, 6, or 8
  "storySegment": "What happens in this scene",
  "characters": ["char_1"], // array of characterIds from characterBible or empty
  "locationId": "loc_1", // locationId from locationBible
  "videoPrompt": "", // leave empty for now
  "negativePrompt": "", // leave empty for now
  "camera": {
    "shotType": "Wide Shot, Close up, etc.",
    "movement": "Pan, Static, Dolly",
    "lens": "35mm, etc.",
    "composition": "Rule of thirds, etc."
  },
  "lighting": "Scene specific lighting",
  "colorGrading": "Scene specific color",
  "visualStyle": "Scene specific style",
  "dialogue": [], // empty array for now
  "narration": { "enabled": false, "text": "", "emotion": "", "deliveryStyle": "" }, // empty for now
  "audio": { "mode": "mixed", "backgroundMusic": "", "soundEffects": [] },
  "continuity": { "previousScene": "none", "currentScene": "action", "nextScene": "next action" }
}]`;

  return callGemini(apiKey, prompt);
}

export async function generateVideoPrompts(
  apiKey: string,
  scenes: StoryScene[],
  characterBible: CharacterProfile[],
  locationBible: LocationProfile[],
  visualStyleBible: VisualStyleProfile,
  aspectRatio: AspectRatio
): Promise<StoryScene[]> {
  const prompt = `You are an expert AI Video Prompt Engineer.
For each scene provided, generate a detailed English video prompt optimized for Veo/Sora/Gen-3.
The prompt MUST be in ENGLISH regardless of story language.
Include visualStyle, precise character details, location details, camera, and lighting.
Aspect Ratio: ${aspectRatio}

Input Scenes (JSON):
${JSON.stringify(scenes.map(s => ({ sceneId: s.sceneId, storySegment: s.storySegment, characters: s.characters, locationId: s.locationId, camera: s.camera })))}

Character Bible: ${JSON.stringify(characterBible)}
Location Bible: ${JSON.stringify(locationBible)}
Visual Style: ${JSON.stringify(visualStyleBible)}

Output MUST be a valid JSON array of objects mapping sceneId to prompts:
[{
  "sceneId": "scene_1",
  "videoPrompt": "Cinematic shot of [Subject details exactly] in [Location exactly]. [Camera movement]. [Lighting]. Highly detailed, photorealistic.",
  "negativePrompt": "blurry, distorted, watermark, text"
}]`;

  const response = await callGemini(apiKey, prompt);
  
  // Merge back into scenes
  return scenes.map(scene => {
    const generated = response.find((r: any) => r.sceneId === scene.sceneId);
    if (generated) {
      return { ...scene, videoPrompt: generated.videoPrompt, negativePrompt: generated.negativePrompt };
    }
    return scene;
  });
}

export async function generateDialogueScripts(
  apiKey: string,
  scenes: StoryScene[],
  story: GeneratedStory,
  voiceMode: VoiceMode,
  language: StoryLanguage
): Promise<StoryScene[]> {
  const targetLang = language === 'bangla' ? 'Bengali' : language === 'english' ? 'English' : 'Banglish (Bengali in English characters)';
  const prompt = `You are an expert Scriptwriter.
For each scene, write the dialogue and/or narration in ${targetLang}.
Voice Mode: ${voiceMode}
Match the story tone and scene action.

Input Scenes (JSON):
${JSON.stringify(scenes.map(s => ({ sceneId: s.sceneId, storySegment: s.storySegment })))}

Output MUST be a valid JSON array mapping sceneId to dialogue/narration:
[{
  "sceneId": "scene_1",
  "dialogue": [
    { "speaker": "Character Name", "text": "The exact spoken words", "emotion": "angry/sad/happy", "deliveryStyle": "whisper/shout/normal" }
  ],
  "narration": {
    "enabled": true,
    "text": "The exact narration words",
    "emotion": "dramatic",
    "deliveryStyle": "deep and slow"
  }
}]`;

  const response = await callGemini(apiKey, prompt);
  
  // Merge back into scenes
  return scenes.map(scene => {
    const generated = response.find((r: any) => r.sceneId === scene.sceneId);
    if (generated) {
      return { ...scene, dialogue: generated.dialogue || [], narration: generated.narration || scene.narration };
    }
    return scene;
  });
}
