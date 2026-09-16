// ── Story Video Generator Types ──────────────────────────────────────────

// User Input Types
export type StoryLanguage = 'bangla' | 'english' | 'banglish';
export type StoryDuration = '1min' | '2min' | '3min' | '4min' | '5min';
export type StoryGenre = 
  | 'auto' 
  | 'us_documentary' 
  | 'true_crime' 
  | 'scandal_business' 
  | 'mystery' 
  | 'horror' 
  | 'comedy' 
  | 'adventure' 
  | 'drama' 
  | 'thriller' 
  | 'action' 
  | 'educational' 
  | 'motivational' 
  | 'documentary' 
  | 'romantic';
export type VisualStyle = 'cinematic_realistic' | 'ultra_realistic' | 'documentary' | '3d_animation' | 'anime' | 'fantasy' | 'film_look';
export type AspectRatio = '9:16' | '16:9' | '1:1';
export type VoiceMode = 'narration' | 'character_dialogue' | 'narration_and_dialogue';

export interface StoryInput {
  storyHint: string;
  language: StoryLanguage;
  duration: StoryDuration;
  genre: StoryGenre;
  visualStyle: VisualStyle;
  aspectRatio: AspectRatio;
  voiceMode: VoiceMode;
  voiceStyle: string;
  backgroundMusic: boolean;
  soundEffects: boolean;
}

// Generated Story
export interface GeneratedStory {
  title: string;
  logline: string;
  completeStory: string;
  summary: string;
  characters: string[];
  locations: string[];
  storyArc: {
    beginning: string;
    conflict: string;
    climax: string;
    ending: string;
  };
}

// Character Bible
export interface CharacterProfile {
  characterId: string;
  name: string;
  age: string;
  gender: string;
  faceDescription: string;
  skinTone: string;
  hair: string;
  hairStyle: string;
  bodyType: string;
  height: string;
  clothing: string;
  shoes: string;
  accessories: string;
  facialFeatures: string;
  personality: string;
  emotionStyle: string;
  voiceDescription: string;
}

// Location Bible
export interface LocationProfile {
  locationId: string;
  locationName: string;
  locationType: string;
  environment: string;
  architecture: string;
  importantObjects: string[];
  weather: string;
  timeOfDay: string;
  lighting: string;
  visualDescription: string;
}

// Visual Style Bible
export interface VisualStyleProfile {
  visualStyle: string;
  cinematography: string;
  lighting: string;
  colorGrading: string;
  contrast: string;
  depthOfField: string;
  cameraLanguage: string;
  lensStyle: string;
  filmLook: string;
  aspectRatio: string;
}

// Audio Plan
export interface AudioPlan {
  overallStrategy: string;
  narratorVoice: string;
  narratorTone: string;
  musicGenre: string;
  musicMood: string;
  sceneAudioNotes: Array<{
    sceneId: string;
    audioType: 'narration' | 'dialogue' | 'music_only' | 'mixed';
    notes: string;
  }>;
}

// Scene Dialogue
export interface SceneDialogue {
  speaker: string;
  text: string;
  emotion: string;
  deliveryStyle: string;
}

// Scene Narration
export interface SceneNarration {
  enabled: boolean;
  text: string;
  emotion: string;
  deliveryStyle: string;
}

// Camera Settings
export interface CameraSettings {
  shotType: string;
  movement: string;
  lens: string;
  composition: string;
}

// Scene Audio
export interface SceneAudio {
  mode: 'veo_native' | 'gemini_tts' | 'mixed' | 'music_only';
  backgroundMusic: string;
  soundEffects: string[];
}

// Scene Continuity
export interface SceneContinuity {
  previousScene: string;
  currentScene: string;
  nextScene: string;
}

// Story Scene
export interface StoryScene {
  sceneId: string;
  orderIndex: number;
  durationSeconds: 4 | 6 | 8;
  storySegment: string;
  characters: string[];
  locationId: string;

  videoPrompt: string;
  negativePrompt: string;

  camera: CameraSettings;
  lighting: string;
  colorGrading: string;
  visualStyle: string;

  dialogue: SceneDialogue[];
  narration: SceneNarration;
  audio: SceneAudio;
  continuity: SceneContinuity;
}

// Project Status
export type ProjectStatus = 'input' | 'story_generating' | 'story_ready' | 'bibles_generating' | 'bibles_ready' | 'scenes_generating' | 'scenes_ready' | 'prompts_generating' | 'prompts_ready';

// Full Project
export interface StoryProject {
  id: string;
  userId: string;
  title: string;
  status: ProjectStatus;

  input: StoryInput;
  story?: GeneratedStory;
  characterBible?: CharacterProfile[];
  locationBible?: LocationProfile[];
  visualStyleBible?: VisualStyleProfile;
  audioPlan?: AudioPlan;
  scenes?: StoryScene[];

  createdAt: string;
  updatedAt: string;
}

// Wizard Step
export type WizardStep = 'input' | 'story_preview' | 'bibles' | 'prompts' | 'audio_script';

export const WIZARD_STEPS: { key: WizardStep; label: string; icon: string }[] = [
  { key: 'input', label: 'গল্পের ধারণা', icon: '✏️' },
  { key: 'story_preview', label: 'গল্প প্রিভিউ', icon: '📖' },
  { key: 'bibles', label: 'চরিত্র ও পটভূমি', icon: '👤' },
  { key: 'prompts', label: 'Video Prompts', icon: '🎥' },
  { key: 'audio_script', label: 'অডিও স্ক্রিপ্ট', icon: '🎤' },
];

// Duration to approximate scene count mapping
export const DURATION_SCENE_MAP: Record<StoryDuration, { minScenes: number; maxScenes: number; totalSeconds: number }> = {
  '1min': { minScenes: 5, maxScenes: 8, totalSeconds: 60 },
  '2min': { minScenes: 10, maxScenes: 16, totalSeconds: 120 },
  '3min': { minScenes: 16, maxScenes: 24, totalSeconds: 180 },
  '4min': { minScenes: 22, maxScenes: 32, totalSeconds: 240 },
  '5min': { minScenes: 28, maxScenes: 40, totalSeconds: 300 },
};

// Genre display labels
export const GENRE_LABELS: Record<StoryGenre, string> = {
  auto: 'Auto (AI নির্বাচন করবে)',
  us_documentary: '🇺🇸 US Documentary',
  true_crime: '🕵️ True Crime & Mystery',
  scandal_business: '🏢 Business & Scandals',
  documentary: '🎥 সাধারণ ডকুমেন্টারি',
  drama: 'নাটকীয় (Drama)',
  thriller: 'থ্রিলার (Thriller)',
  mystery: 'রহস্য (Mystery)',
  horror: 'ভৌতিক (Horror)',
  comedy: 'কমেডি ও হাসির গল্প',
  adventure: 'অ্যাডভেঞ্চার',
  action: 'অ্যাকশন',
  romantic: 'রোমান্টিক',
  educational: 'শিক্ষামূলক ও জ্ঞান',
  motivational: 'অনুপ্রেরণামূলক',
};

// Visual Style display labels
export const VISUAL_STYLE_LABELS: Record<VisualStyle, string> = {
  cinematic_realistic: 'Cinematic Realistic',
  ultra_realistic: 'Ultra Realistic',
  documentary: 'Documentary',
  '3d_animation': '3D Animation',
  anime: 'Anime',
  fantasy: 'Fantasy',
  film_look: 'Film Look',
};
