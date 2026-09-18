import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, Palette, Music, Copy, Check, RefreshCw, CheckCheck } from 'lucide-react';
import type { CharacterProfile, LocationProfile, VisualStyleProfile, AudioPlan } from '../../../types/storyVideo';

interface BibleViewProps {
  characterBible: CharacterProfile[];
  locationBible: LocationProfile[];
  visualStyleBible: VisualStyleProfile;
  audioPlan: AudioPlan | null;
  onRegenerateBibles: () => void;
  onApprove: () => void;
  loading: boolean;
}

type TabType = 'characters' | 'locations' | 'visualStyle' | 'audioPlan';

export default function BibleView({
  characterBible,
  locationBible,
  visualStyleBible,
  audioPlan,
  onRegenerateBibles,
  onApprove,
  loading
}: BibleViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('characters');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'characters', label: 'চরিত্রসমূহ', icon: <User size={18} /> },
    { id: 'locations', label: 'স্থানসমূহ', icon: <MapPin size={18} /> },
    { id: 'visualStyle', label: 'ভিস্যুয়াল স্টাইল', icon: <Palette size={18} /> },
    { id: 'audioPlan', label: 'অডিও প্ল্যান', icon: <Music size={18} /> }
  ];

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto gap-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-800">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-colors cursor-pointer ${
                isActive
                  ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 shadow-sm'
                  : 'bg-[#0f172a] text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'characters' && (
              <div className="flex flex-col gap-6">
                {characterBible.map(char => (
                  <div key={char.characterId} className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-slate-200 mb-2">{char.name}</h3>
                        <p className="text-sm font-medium text-yellow-500 bg-yellow-500/10 inline-flex px-3 py-1 rounded-full border border-yellow-500/20">
                          বয়স: {char.age} | লিঙ্গ: {char.gender} | উচ্চতা: {char.height} | বডি টাইপ: {char.bodyType}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const text = [
                            `চরিত্র: ${char.name}`,
                            `বয়স: ${char.age} | লিঙ্গ: ${char.gender} | উচ্চতা: ${char.height} | বডি টাইপ: ${char.bodyType}`,
                            `মুখমণ্ডল: ${char.faceDescription}`,
                            `ত্বক: ${char.skinTone}`,
                            `চুল: ${char.hair}, ${char.hairStyle}`,
                            `পোশাক: ${char.clothing}`,
                            `জুতা: ${char.shoes}`,
                            `অনুষঙ্গ: ${char.accessories}`,
                            `মুখের বৈশিষ্ট্য: ${char.facialFeatures}`,
                            `ব্যক্তিত্ব: ${char.personality}`,
                            `আবেগের ধরন: ${char.emotionStyle}`,
                            `কণ্ঠস্বর: ${char.voiceDescription}`,
                          ].join('\n');
                          handleCopy(char.characterId, text);
                        }}
                        className="px-3 py-1.5 flex items-center gap-1.5 bg-[#131926] border border-slate-800 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:border-slate-600 transition-colors shrink-0"
                        title="কপি করুন"
                      >
                        {copiedId === char.characterId ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        {copiedId === char.characterId ? 'কপি হয়েছে' : 'কপি'}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { label: 'মুখমণ্ডল', value: char.faceDescription },
                        { label: 'ত্বক', value: char.skinTone },
                        { label: 'চুল', value: char.hair + ', ' + char.hairStyle },
                        { label: 'পোশাক', value: char.clothing },
                        { label: 'জুতা', value: char.shoes },
                        { label: 'অনুষঙ্গ', value: char.accessories },
                        { label: 'মুখের বৈশিষ্ট্য', value: char.facialFeatures },
                        { label: 'ব্যক্তিত্ব', value: char.personality },
                        { label: 'আবেগের ধরন', value: char.emotionStyle },
                        { label: 'কণ্ঠস্বর', value: char.voiceDescription }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-[#131926] border border-slate-800/80 p-4 rounded-xl">
                          <div className="text-xs font-semibold text-slate-500 mb-1">{item.label}</div>
                          <div className="text-sm text-slate-300">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'locations' && (
              <div className="flex flex-col gap-6">
                {locationBible.map(loc => (
                  <div key={loc.locationId} className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-slate-200 mb-2">{loc.locationName}</h3>
                        <p className="text-sm font-medium text-emerald-400 bg-emerald-400/10 inline-flex px-3 py-1 rounded-full border border-emerald-400/20">
                          ধরন: {loc.locationType} | পরিবেশ: {loc.environment}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const text = [
                            `স্থান: ${loc.locationName}`,
                            `ধরন: ${loc.locationType} | পরিবেশ: ${loc.environment}`,
                            `আর্কিটেকচার: ${loc.architecture}`,
                            `গুরুত্বপূর্ণ বস্তু: ${loc.importantObjects.join(', ')}`,
                            `আবহাওয়া: ${loc.weather}`,
                            `সময়: ${loc.timeOfDay}`,
                            `আলো: ${loc.lighting}`,
                            `ভিস্যুয়াল বর্ণনা: ${loc.visualDescription}`,
                          ].join('\n');
                          handleCopy(loc.locationId, text);
                        }}
                        className="px-3 py-1.5 flex items-center gap-1.5 bg-[#131926] border border-slate-800 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:border-slate-600 transition-colors shrink-0"
                        title="কপি করুন"
                      >
                        {copiedId === loc.locationId ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        {copiedId === loc.locationId ? 'কপি হয়েছে' : 'কপি'}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { label: 'আর্কিটেকচার', value: loc.architecture },
                        { label: 'গুরুত্বপূর্ণ বস্তু', value: loc.importantObjects.join(', ') },
                        { label: 'আবহাওয়া', value: loc.weather },
                        { label: 'সময়', value: loc.timeOfDay },
                        { label: 'আলো', value: loc.lighting },
                        { label: 'ভিস্যুয়াল বর্ণনা', value: loc.visualDescription }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-[#131926] border border-slate-800/80 p-4 rounded-xl">
                          <div className="text-xs font-semibold text-slate-500 mb-1">{item.label}</div>
                          <div className="text-sm text-slate-300">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'visualStyle' && visualStyleBible && (
              <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                  <Palette className="text-yellow-500" size={24} /> ভিস্যুয়াল স্টাইল
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { label: 'স্টাইল', value: visualStyleBible.visualStyle },
                    { label: 'সিনেমাটোগ্রাফি', value: visualStyleBible.cinematography },
                    { label: 'আলো', value: visualStyleBible.lighting },
                    { label: 'কালার গ্রেডিং', value: visualStyleBible.colorGrading },
                    { label: 'কনট্রাস্ট', value: visualStyleBible.contrast },
                    { label: 'ডেপথ অফ ফিল্ড', value: visualStyleBible.depthOfField },
                    { label: 'ক্যামেরার ভাষা', value: visualStyleBible.cameraLanguage },
                    { label: 'লেন্স স্টাইল', value: visualStyleBible.lensStyle },
                    { label: 'ফিল্ম লুক', value: visualStyleBible.filmLook },
                    { label: 'অ্যাসপেক্ট রেশিও', value: visualStyleBible.aspectRatio }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-[#131926] border border-slate-800/80 p-4 rounded-xl">
                      <div className="text-xs font-semibold text-slate-500 mb-1">{item.label}</div>
                      <div className="text-sm text-slate-300">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'audioPlan' && audioPlan && (
              <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                  <Music className="text-yellow-500" size={24} /> অডিও প্ল্যান
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="bg-[#131926] border border-slate-800/80 p-5 rounded-xl col-span-1 sm:col-span-2">
                    <div className="text-xs font-semibold text-slate-500 mb-2">সামগ্রিক কৌশল</div>
                    <div className="text-sm text-slate-300 leading-relaxed">{audioPlan.overallStrategy}</div>
                  </div>
                  {[
                    { label: 'ন্যারেটরের কণ্ঠ', value: audioPlan.narratorVoice },
                    { label: 'ন্যারেটরের টোন', value: audioPlan.narratorTone },
                    { label: 'মিউজিক জেনার', value: audioPlan.musicGenre },
                    { label: 'মিউজিক মুড', value: audioPlan.musicMood }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-[#131926] border border-slate-800/80 p-4 rounded-xl">
                      <div className="text-xs font-semibold text-slate-500 mb-1">{item.label}</div>
                      <div className="text-sm text-slate-300">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-16 pt-4 border-t border-slate-800">
        <motion.button
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          onClick={onRegenerateBibles}
          disabled={loading}
          className="flex-1 py-4 px-6 rounded-2xl border border-slate-700 bg-[#1e293b] text-slate-200 text-base font-bold flex items-center justify-center gap-2.5 transition-colors hover:bg-slate-800 disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <motion.div
            animate={loading ? { rotate: 360 } : { rotate: 0 }}
            transition={loading ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
            className="flex"
          >
            <RefreshCw size={18} />
          </motion.div>
          <span>{loading ? 'তৈরি হচ্ছে...' : 'আবার তৈরি করুন'}</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          onClick={onApprove}
          disabled={loading}
          className="flex-[2] py-4 px-6 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-[#090d16] text-base font-bold flex items-center justify-center gap-2.5 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <CheckCheck size={20} />
          <span>অনুমোদন করুন → সিন তৈরি</span>
        </motion.button>
      </div>
    </div>
  );
}
