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

  const getCardStyle = (borderColor: string) => ({
    background: 'var(--bg-panel)',
    border: '1px solid var(--border-light)',
    borderLeft: `4px solid ${borderColor}`,
    borderRadius: '16px',
    padding: '14px',
    marginBottom: '14px',
    position: 'relative' as const,
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Tabs */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1.5 border-b border-[var(--border)] -mx-1 px-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm'
                : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}

      {/* Content */}
      <div style={{ minHeight: '400px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'characters' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {characterBible.map(char => (
                  <div key={char.characterId} style={getCardStyle('#3b82f6')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', color: 'var(--text-primary)' }}>{char.name}</h3>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
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
                        style={{
                          background: 'var(--bg-secondary)',
                          border: 'none',
                          padding: '8px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="কপি করুন"
                      >
                        {copiedId === char.characterId ? <Check size={18} color="#10b981" /> : <Copy size={18} />}
                      </button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
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
                        <div key={idx} style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '12px' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{item.label}</div>
                          <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'locations' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {locationBible.map(loc => (
                  <div key={loc.locationId} style={getCardStyle('#10b981')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', color: 'var(--text-primary)' }}>{loc.locationName}</h3>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
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
                        style={{
                          background: 'var(--bg-secondary)',
                          border: 'none',
                          padding: '8px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="কপি করুন"
                      >
                        {copiedId === loc.locationId ? <Check size={18} color="#10b981" /> : <Copy size={18} />}
                      </button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      {[
                        { label: 'আর্কিটেকচার', value: loc.architecture },
                        { label: 'গুরুত্বপূর্ণ বস্তু', value: loc.importantObjects.join(', ') },
                        { label: 'আবহাওয়া', value: loc.weather },
                        { label: 'সময়', value: loc.timeOfDay },
                        { label: 'আলো', value: loc.lighting },
                        { label: 'ভিস্যুয়াল বর্ণনা', value: loc.visualDescription }
                      ].map((item, idx) => (
                        <div key={idx} style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '12px' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{item.label}</div>
                          <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'visualStyle' && visualStyleBible && (
              <div style={getCardStyle('#8b5cf6')}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', color: 'var(--text-primary)' }}>ভিস্যুয়াল স্টাইল</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
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
                    <div key={idx} style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{item.label}</div>
                      <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'audioPlan' && audioPlan && (
              <div style={getCardStyle('#f59e0b')}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', color: 'var(--text-primary)' }}>অডিও প্ল্যান</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '12px', gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>সামগ্রিক কৌশল</div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{audioPlan.overallStrategy}</div>
                  </div>
                  {[
                    { label: 'ন্যারেটরের কণ্ঠ', value: audioPlan.narratorVoice },
                    { label: 'ন্যারেটরের টোন', value: audioPlan.narratorTone },
                    { label: 'মিউজিক জেনার', value: audioPlan.musicGenre },
                    { label: 'মিউজিক মুড', value: audioPlan.musicMood }
                  ].map((item, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{item.label}</div>
                      <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end pt-3 border-t border-[var(--border)]">
        <button
          onClick={onRegenerateBibles}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs sm:text-sm font-semibold cursor-pointer disabled:opacity-50"
        >
          <motion.div
            animate={loading ? { rotate: 360 } : { rotate: 0 }}
            transition={loading ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
            className="flex"
          >
            <RefreshCw size={14} />
          </motion.div>
          <span>{loading ? 'তৈরি হচ্ছে...' : 'আবার তৈরি করুন'}</span>
        </button>
        
        <button
          onClick={onApprove}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-[var(--gradient-brand)] text-white text-xs sm:text-sm font-semibold cursor-pointer shadow-md disabled:opacity-50"
        >
          <CheckCheck size={16} />
          <span>অনুমোদন করুন → সিন তৈরি</span>
        </button>
      </div>
    </div>
  );
}
