import { create } from 'zustand';
import type {
  WizardStep,
  StoryProject,
  GeneratedStory,
  CharacterProfile,
  LocationProfile,
  VisualStyleProfile,
  AudioPlan,
  StoryScene,
  ProjectStatus
} from '../types/storyVideo';

interface StoryVideoState {
  currentStep: WizardStep;
  project: StoryProject | null;
  loading: boolean;
  loadingMessage: string;
  error: string | null;

  setStep: (step: WizardStep) => void;
  setProject: (project: StoryProject) => void;
  updateProject: (partial: Partial<StoryProject>) => void;
  setStory: (story: GeneratedStory) => void;
  setCharacterBible: (bible: CharacterProfile[]) => void;
  setLocationBible: (bible: LocationProfile[]) => void;
  setVisualStyleBible: (bible: VisualStyleProfile) => void;
  setAudioPlan: (plan: AudioPlan) => void;
  setScenes: (scenes: StoryScene[]) => void;
  updateScene: (sceneId: string, updates: Partial<StoryScene>) => void;
  reorderScenes: (fromIndex: number, toIndex: number) => void;
  deleteScene: (sceneId: string) => void;
  setLoading: (loading: boolean, message?: string) => void;
  setError: (error: string | null) => void;
  setStatus: (status: ProjectStatus) => void;
  reset: () => void;
  canProceedToStep: (step: WizardStep) => boolean;
}

const initialState = {
  currentStep: 'input' as WizardStep,
  project: null,
  loading: false,
  loadingMessage: '',
  error: null,
};

export const useStoryVideoStore = create<StoryVideoState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  setProject: (project) => set({ project }),

  updateProject: (partial) =>
    set((state) => ({
      project: state.project ? { ...state.project, ...partial } : null,
    })),

  setStory: (story) =>
    set((state) => ({
      project: state.project ? { ...state.project, story } : null,
    })),

  setCharacterBible: (bible) =>
    set((state) => ({
      project: state.project ? { ...state.project, characterBible: bible } : null,
    })),

  setLocationBible: (bible) =>
    set((state) => ({
      project: state.project ? { ...state.project, locationBible: bible } : null,
    })),

  setVisualStyleBible: (bible) =>
    set((state) => ({
      project: state.project ? { ...state.project, visualStyleBible: bible } : null,
    })),

  setAudioPlan: (plan) =>
    set((state) => ({
      project: state.project ? { ...state.project, audioPlan: plan } : null,
    })),

  setScenes: (scenes) =>
    set((state) => ({
      project: state.project ? { ...state.project, scenes } : null,
    })),

  updateScene: (sceneId, updates) =>
    set((state) => {
      if (!state.project || !state.project.scenes) return state;
      const newScenes = state.project.scenes.map((scene) =>
        scene.sceneId === sceneId ? { ...scene, ...updates } : scene
      );
      return { project: { ...state.project, scenes: newScenes } };
    }),

  reorderScenes: (fromIndex, toIndex) =>
    set((state) => {
      if (!state.project || !state.project.scenes) return state;
      const newScenes = [...state.project.scenes];
      const [movedScene] = newScenes.splice(fromIndex, 1);
      newScenes.splice(toIndex, 0, movedScene);
      
      // Update orderIndex
      const updatedScenes = newScenes.map((scene, idx) => ({
        ...scene,
        orderIndex: idx,
      }));
      
      return { project: { ...state.project, scenes: updatedScenes } };
    }),

  deleteScene: (sceneId) =>
    set((state) => {
      if (!state.project || !state.project.scenes) return state;
      const newScenes = state.project.scenes
        .filter((scene) => scene.sceneId !== sceneId)
        .map((scene, idx) => ({ ...scene, orderIndex: idx }));
      return { project: { ...state.project, scenes: newScenes } };
    }),

  setLoading: (loading, message = '') =>
    set({ loading, loadingMessage: message }),

  setError: (error) => set({ error }),

  setStatus: (status) =>
    set((state) => ({
      project: state.project ? { ...state.project, status } : null,
    })),

  reset: () => set({ ...initialState }),

  canProceedToStep: (step) => {
    const { project } = get();
    if (!project) return false;

    switch (step) {
      case 'input':
        return true;
      case 'story_preview':
        return !!project.story;
      case 'bibles':
        return !!project.characterBible && !!project.locationBible && !!project.visualStyleBible;
      case 'prompts':
        return !!project.scenes && project.scenes.every(s => !!s.videoPrompt);
      case 'audio_script':
        return !!project.scenes && project.scenes.every(s => s.dialogue && s.narration);
      default:
        return false;
    }
  },
}));
