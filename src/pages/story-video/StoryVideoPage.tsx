import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useStoryVideoStore } from '../../store/storyVideoStore';
import { useAuthStore } from '../../store/authStore';
import { getUserApiKeys, getAdminGeminiSettings, saveStoryProject, getStoryProject } from '../../services/contentService';
import type { WizardStep, StoryInput, GeneratedStory, StoryScene } from '../../types/storyVideo';
import { WIZARD_STEPS } from '../../types/storyVideo';

import { ProgressTracker } from './components/ProgressTracker';
import StoryInputForm from './components/StoryInputForm';
import StoryPreview from './components/StoryPreview';
import BibleView from './components/BibleView';
import PromptExport from './components/PromptExport';
import AudioScript from './components/AudioScript';

import {
  generateStory,
  generateCharacterBible,
  generateLocationBible,
  generateVisualStyleBible,
  generateAudioPlan,
  generateSceneBreakdown,
  generateVideoPrompts,
  generateDialogueScripts
} from '../../services/storyAiService';

export const StoryVideoPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: appUser } = useAuthStore();
  const store = useStoryVideoStore();
  
  const [apiKey, setApiKey] = useState<string>('');
  const [allApiKeys, setAllApiKeys] = useState<string[]>([]);

  // Load project from ID
  useEffect(() => {
    const projectIdParam = searchParams.get('projectId');
    if (projectIdParam) {
      getStoryProject(projectIdParam).then(proj => {
        if (proj) {
          store.setProject(proj);
          if (proj.scenes && proj.scenes.length > 0 && proj.scenes[0].videoPrompt) {
            store.setStep('prompts');
          } else if (proj.characterBible && proj.characterBible.length > 0) {
            store.setStep('bibles');
          } else if (proj.story) {
            store.setStep('story_preview');
          } else {
            store.setStep('input');
          }
        }
      });
    }
  }, [searchParams.get('projectId')]);

  // Auto-save debounced
  useEffect(() => {
    if (!store.project || !store.project.id || store.loading) return;
    
    const timeout = setTimeout(() => {
      saveStoryProject(appUser?.uid || 'anonymous', store.project!).catch(err => {
        console.error('Failed to auto-save project', err);
      });
    }, 2000);

    return () => clearTimeout(timeout);
  }, [store.project, appUser?.uid, store.loading]);

  // Fetch API key on mount
  useEffect(() => {
    const fetchKey = async () => {
      try {
        const collected: string[] = [];
        if (appUser?.uid) {
          const userKeys = await getUserApiKeys(appUser.uid);
          if (userKeys && userKeys.length > 0) {
            collected.push(...userKeys);
            setApiKey(userKeys[0]);
          }
        }
        // Also collect admin keys
        const adminSettings = await getAdminGeminiSettings();
        if ((adminSettings as any)?.apiKeys && (adminSettings as any).apiKeys.length > 0) {
          collected.push(...(adminSettings as any).apiKeys);
          if (!collected[0]) setApiKey((adminSettings as any).apiKeys[0]);
        }
        setAllApiKeys(Array.from(new Set(collected.filter(Boolean))));
      } catch (err) {
        console.error('Error fetching API key:', err);
      }
    };
    fetchKey();
  }, [appUser]);

  const handleStepClick = (step: WizardStep) => {
    store.setStep(step);
  };

  const canNavigateTo = (step: WizardStep): boolean => {
    const currentIndex = WIZARD_STEPS.findIndex((s) => s.key === store.currentStep);
    const targetIndex = WIZARD_STEPS.findIndex((s) => s.key === step);
    if (targetIndex <= currentIndex) return true;
    return store.canProceedToStep(step);
  };

  const currentIndex = WIZARD_STEPS.findIndex((s) => s.key === store.currentStep);
  const nextStep = currentIndex < WIZARD_STEPS.length - 1 ? WIZARD_STEPS[currentIndex + 1].key : null;
  const prevStep = currentIndex > 0 ? WIZARD_STEPS[currentIndex - 1].key : null;

  const handleNext = () => {
    if (nextStep && canNavigateTo(nextStep)) {
      store.setStep(nextStep);
    }
  };

  const handlePrev = () => {
    if (prevStep) {
      store.setStep(prevStep);
    }
  };

  // --- Actions ---

  const handleGenerateStory = async (input: StoryInput) => {
    if (!apiKey) {
      toast.error('API Key পাওয়া যায়নি। সেটিংস থেকে API Key যুক্ত করুন।');
      return;
    }
    
    // Initialize project
    store.setProject({
      id: Date.now().toString(),
      userId: appUser?.uid || 'anonymous',
      title: 'নতুন গল্প',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'input',
      input,
      story: undefined,
      characterBible: [],
      locationBible: [],
      visualStyleBible: undefined,
      audioPlan: undefined,
      scenes: []
    });

    store.setLoading(true, 'গল্প তৈরি হচ্ছে...');
    store.setError(null);

    try {
      const generated = await generateStory(apiKey, input);
      store.setStory(generated);
      store.updateProject({ title: generated.title });
      toast.success('গল্প তৈরি সম্পন্ন হয়েছে!');
      store.setStep('story_preview');
    } catch (err: any) {
      store.setError(err.message || 'গল্প তৈরিতে সমস্যা হয়েছে');
      toast.error('গল্প তৈরি ব্যর্থ হয়েছে');
    } finally {
      store.setLoading(false);
    }
  };

  const handleApproveStory = () => {
    store.setStep('bibles');
    handleGenerateBibles();
  };

  const handleGenerateBibles = async () => {
    if (!apiKey || !store.project?.story || !store.project?.input) return;
    
    store.setLoading(true, 'Character ও Location Bible তৈরি হচ্ছে...');
    store.setError(null);

    try {
      const { story, input } = store.project;
      
      // Run parallel generations
      const [chars, locs, style, audio] = await Promise.all([
        generateCharacterBible(apiKey, story, input.visualStyle),
        generateLocationBible(apiKey, story, input.visualStyle),
        generateVisualStyleBible(apiKey, input.visualStyle, input.genre),
        generateAudioPlan(apiKey, story, input.voiceMode, input.language)
      ]);

      store.setCharacterBible(chars);
      store.setLocationBible(locs);
      store.setVisualStyleBible(style);
      store.setAudioPlan(audio);
      
      toast.success('Bibles তৈরি সম্পন্ন হয়েছে!');
    } catch (err: any) {
      store.setError(err.message || 'Bibles তৈরিতে সমস্যা হয়েছে');
      toast.error('Bibles তৈরি ব্যর্থ হয়েছে');
    } finally {
      store.setLoading(false);
    }
  };

  const handleGenerateScenes = async () => {
    if (!apiKey || !store.project?.story || !store.project?.input) return;
    if (!store.project.characterBible || !store.project.locationBible || !store.project.visualStyleBible) return;

    store.setLoading(true, 'Scene Breakdown তৈরি হচ্ছে...');
    store.setError(null);

    try {
      const scenes = await generateSceneBreakdown(
        apiKey,
        store.project.story,
        store.project.input.duration,
        store.project.characterBible,
        store.project.locationBible,
        store.project.visualStyleBible
      );
      
      store.setScenes(scenes);
      toast.success('Scene Breakdown সম্পন্ন হয়েছে!');
      // Immediately generate prompts too — no need to show scene_plan step
      return scenes;
    } catch (err: any) {
      store.setError(err.message || 'Scene Breakdown তৈরিতে সমস্যা হয়েছে');
      toast.error('Scene Breakdown ব্যর্থ হয়েছে');
    } finally {
      store.setLoading(false);
    }
  };

  const handleGeneratePrompts = async () => {
    if (!apiKey || !store.project?.scenes) return;
    if (!store.project.characterBible || !store.project.locationBible || !store.project.visualStyleBible) return;

    store.setLoading(true, 'Video Prompts তৈরি হচ্ছে...');
    store.setError(null);

    try {
      const updatedScenes = await generateVideoPrompts(
        apiKey,
        store.project.scenes,
        store.project.characterBible,
        store.project.locationBible,
        store.project.visualStyleBible,
        store.project.input!.aspectRatio
      );
      
      store.setScenes(updatedScenes);
      toast.success('Video Prompts তৈরি সম্পন্ন হয়েছে!');
      store.setStep('prompts');
    } catch (err: any) {
      store.setError(err.message || 'Prompts তৈরিতে সমস্যা হয়েছে');
      toast.error('Prompts তৈরি ব্যর্থ হয়েছে');
    } finally {
      store.setLoading(false);
    }
  };
  // Combined: Bible approve → scenes → prompts → audio all in one loading flow
  const handleBibleApproveAndGenerate = async () => {
    if (!apiKey || !store.project?.story || !store.project?.input) return;
    if (!store.project.characterBible || !store.project.locationBible || !store.project.visualStyleBible) return;

    store.setLoading(true, 'Scene Breakdown তৈরি হচ্ছে...');
    store.setError(null);

    try {
      const scenes = await generateSceneBreakdown(
        apiKey,
        store.project.story,
        store.project.input.duration,
        store.project.characterBible,
        store.project.locationBible,
        store.project.visualStyleBible
      );
      store.setScenes(scenes);

      store.setLoading(true, 'Video Prompts তৈরি হচ্ছে...');
      const scenesWithPrompts = await generateVideoPrompts(
        apiKey,
        scenes,
        store.project.characterBible,
        store.project.locationBible,
        store.project.visualStyleBible,
        store.project.input!.aspectRatio
      );
      store.setScenes(scenesWithPrompts);

      store.setLoading(true, 'Audio Script তৈরি হচ্ছে...');
      const scenesWithAudio = await generateDialogueScripts(
        apiKey,
        scenesWithPrompts,
        store.project.story,
        store.project.input!.voiceMode,
        store.project.input!.language
      );
      store.setScenes(scenesWithAudio);

      toast.success('সব তৈরি সম্পন্ন!');
      store.setStep('prompts');
    } catch (err: any) {
      store.setError(err.message || 'তৈরিতে সমস্যা হয়েছে');
      toast.error('তৈরি ব্যর্থ হয়েছে');
    } finally {
      store.setLoading(false);
    }
  };

  return (
    <div className="app-layout w-full min-h-screen bg-[#090d16] text-[#f1f5f9] overflow-x-hidden" style={{ fontFamily: "'Anek Bangla', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-800 transition-all">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl bg-[#131926] border border-slate-700/70 text-slate-300 hover:text-white hover:border-yellow-500/50 transition-all cursor-pointer"
              title="ড্যাশবোর্ডে ফিরুন"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold truncate flex items-center gap-2 text-white">
                <span>🎬</span> <span className="truncate">AI Story Video Generator</span>
              </h1>
              {store.project?.title && (
                <p className="text-xs text-slate-400 truncate m-0">
                  {store.project.title}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>AI স্টুডিও সক্রিয়</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-12">
        <ProgressTracker currentStep={store.currentStep} onStepClick={handleStepClick} canNavigateTo={canNavigateTo} />

        {store.error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-xs sm:text-sm mb-5 text-center">
            {store.error}
          </div>
        )}

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={store.currentStep}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
              className="bg-transparent rounded-2xl"
            >
              {store.currentStep === 'input' && (
                <StoryInputForm onSubmit={handleGenerateStory} loading={store.loading} initialInput={store.project?.input} apiKey={apiKey} />
              )}
              
              {store.currentStep === 'story_preview' && store.project?.story && (
                <StoryPreview
                  story={store.project.story}
                  loading={store.loading}
                  onEdit={(edited) => store.setStory(edited)}
                  onRegenerate={() => handleGenerateStory(store.project!.input!)}
                  onApprove={handleApproveStory}
                />
              )}
              
              {store.currentStep === 'bibles' && store.project?.characterBible && (
                <BibleView
                  characterBible={store.project.characterBible}
                  locationBible={store.project.locationBible || []}
                  visualStyleBible={store.project.visualStyleBible!}
                  audioPlan={store.project.audioPlan || null}
                  loading={store.loading}
                  onRegenerateBibles={handleGenerateBibles}
                  onApprove={handleBibleApproveAndGenerate}
                />
              )}
              
              {store.currentStep === 'prompts' && store.project?.scenes && (
                <PromptExport
                  scenes={store.project.scenes}
                  characterBible={store.project.characterBible || []}
                  aspectRatio={store.project.input?.aspectRatio || '16:9'}
                  projectId={store.project.id}
                />
              )}

              {store.currentStep === 'audio_script' && store.project?.scenes && store.project && (
                <AudioScript
                  scenes={store.project.scenes}
                  project={store.project}
                  apiKeys={allApiKeys}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Loading Overlay */}
      <AnimatePresence>
        {store.loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(12px)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              style={{
                width: '72px',
                height: '72px',
                marginBottom: '28px',
                borderRadius: '50%',
                background: 'conic-gradient(#ff3b30, #ff9500, #ffcc00, #34c759, #007aff, #5856d6, #af52de, #ff3b30)',
                padding: '5px',
                boxShadow: '0 0 30px rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#111' }} />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: '#e2e8f0' }}
            >
              {store.loadingMessage || 'অপেক্ষা করুন...'}
            </motion.p>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>
              AI প্রসেসিং চলছে, এটি কিছুক্ষণ সময় নিতে পারে
            </p>
            <motion.div
              style={{ width: 200, height: 4, background: '#1e293b', borderRadius: 99, marginTop: 20, overflow: 'hidden' }}
            >
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                style={{ width: '50%', height: '100%', background: 'linear-gradient(90deg, #ff3b30, #ff9500, #ffcc00, #34c759, #007aff, #5856d6, #af52de)', borderRadius: 99 }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
