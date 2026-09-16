import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Copy, Check, FileText, Settings as SettingsIcon, LogOut,
  Image, Type, BarChart2, Sparkles, X,
  MonitorPlay, Smartphone, Video, Download,
  History, Star, Trash2, Clock, ChevronDown, ClipboardList,
  Headphones, User, Shield, Upload, PlayCircle, Grid, Mic, MessageCircle, Globe,
  Plus, Key, Eye, EyeOff, RefreshCw, Sun, Moon, Monitor, ExternalLink, Edit2, CreditCard, Save,
  Film, ChevronRight, Play, Pause, Square, Volume2, Music, Wand2
} from 'lucide-react';
import type { ContentType, Language, GenerationResult, AppUser } from '../../types';
import type { StoryProject } from '../../types/storyVideo';
import { useAuthStore } from '../../store/authStore';
import { generateContent, transcribeAudio } from '../../services/geminiService';
import {
  saveGeneration, getUserGenerations, deleteGeneration, toggleFavorite,
  getAdminGeminiSettings, saveAdminGeminiSettings,
  getUserApiKeys, saveUserApiKeys, saveAdminApiKeys,
  getPublicSettings, savePublicSettings
, getUserStoryProjects, deleteStoryProject } from '../../services/contentService';
import { getUserProfile, logoutUser, getAllUsers, updateUserStatus, resetPassword } from '../../services/authService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';
import {
  VOICE_OPTIONS, generateSpeech, downloadWav, createAudioBlobUrl,
  type SpeechSpeed, type SpeechMood
} from '../../services/ttsService';

//  Components 
function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-overlay-10)', borderRadius: 99, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 99 }}
        />
      </div>
    </div>
  );
}

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} style={{
      background: copied ? '#22d3a020' : 'var(--bg-overlay-5)',
      border: `1px solid ${copied ? '#22d3a040' : 'var(--bg-overlay-15)'}`,
      borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
      color: copied ? '#22d3a0' : 'var(--text-muted)',
      fontSize: 12, display: 'flex', alignItems: 'center', gap: 5,
      transition: 'all 0.2s',
    }}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : (label || 'Copy')}
    </button>
  );
}

function buildExportText(result: GenerationResult): string {
  const r = result.results;
  let txt = "=================================================\n";
  txt += "  SMART VIDEO AI - Content Package\n";
  txt += "=================================================\n\n";
  txt += "Topic: " + result.topic + "\n";
  txt += "Language: " + result.language + " | Type: " + result.contentType + "\n";
  txt += "Viral Score: " + r.viralScore.overall + "/100 (" + r.viralScore.label + ")\n\n";
  txt += "---------- VIRAL SEO TITLES ----------\n";
  r.titles.forEach((t, i) => {
    txt += (i + 1) + ". " + t.text + " [" + t.emotionTag + "]\n";
    if (t.hashtags) txt += "   Hashtags: " + t.hashtags.join(" ") + "\n";
    if (t.viralScore) txt += "   Scores - Viral: " + t.viralScore + ", CTR: " + t.ctrScore + ", SEO: " + t.seoScore + "\n";
  });
  txt += "\n---------- SEO DESCRIPTION ----------\n" + r.description + "\n";
  txt += "\n---------- SEO TAGS ----------\n";
  txt += "Title Keywords: " + (r.tags.fromTitles?.join(", ") || "") + "\n";
  txt += "Triple Keywords: " + (r.tags.tripleKeywords?.join(", ") || "") + "\n";
  txt += "SEO Power Tags: " + (r.tags.seoPowerTags?.join(", ") || "") + "\n";
  txt += "\n---------- THUMBNAIL STRATEGY ----------\n" + r.thumbnailStrategy + "\n";
  txt += "\n---------- AI THUMBNAIL PROMPT ----------\n" + r.thumbnailPrompt + "\n";
  txt += "\n---------- TYPOGRAPHY ----------\n";
  Object.entries(r.typography).forEach(([k, v]) => { txt += k + ": " + v + "\n"; });
  txt += "\n---------- VIRAL SCORE BREAKDOWN ----------\n";
  txt += "CTR: " + r.viralScore.ctrProbability + "% | Emotion: " + r.viralScore.emotionalTrigger + "% | SEO: " + r.viralScore.seoStrength + "% | Curiosity: " + r.viralScore.curiosityGap + "% | Competition: " + r.viralScore.competitionDifficulty + "%\n";
  txt += "\n---------- CONTENT STRATEGY ----------\n";
  txt += "Hook: " + r.contentStrategy.bestHook + "\n";
  txt += "Upload Time: " + r.contentStrategy.uploadTime + "\n";
  txt += "CTA: " + r.contentStrategy.suggestedCTA + "\n";
  txt += "Structure: " + r.contentStrategy.videoStructure + "\n";
  txt += "Shorts Idea: " + r.contentStrategy.shortsRepurposeIdea + "\n";
  txt += "\n=================================================\n";
  return txt;
}

function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

//  API Key Manager Component 
function ApiKeyManager({
  keys, onSave, saving, hint,
}: {
  keys: string[];
  onSave: (keys: string[]) => Promise<void>;
  saving: boolean;
  label: string;
  hint: string;
}) {
  const [localKeys, setLocalKeys] = useState<string[]>(keys.length > 0 ? keys : ['']);
  const [editMode, setEditMode] = useState<boolean[]>(keys.map(k => !k));

  useEffect(() => {
    if (keys.length > 0) {
      setLocalKeys(keys);
      setEditMode(keys.map(k => !k));
    }
  }, [keys.length]);

  const addKey = () => {
    setLocalKeys(prev => [...prev, '']);
    setEditMode(prev => [...prev, true]);
  };

  const removeKey = (idx: number) => {
    setLocalKeys(prev => prev.filter((_, i) => i !== idx));
    setEditMode(prev => prev.filter((_, i) => i !== idx));
  };

  const updateKey = (idx: number, val: string) => {
    setLocalKeys(prev => prev.map((k, i) => i === idx ? val : k));
  };

  const toggleEdit = (idx: number) => {
    setEditMode(prev => prev.map((e, i) => i === idx ? !e : e));
  };

  const handleSave = async () => {
    await onSave(localKeys);
    setEditMode(localKeys.map(k => !k));
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
        {localKeys.map((key, idx) => (
          <div key={idx} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', position: 'relative' }}>
            {editMode[idx] ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder={`Key ${idx + 1}: AIzaSy...`}
                  value={key}
                  onChange={e => updateKey(idx, e.target.value)}
                  style={{ width: '100%', fontSize: 13 }}
                />
                {localKeys.length > 1 && (
                  <button onClick={() => removeKey(idx)} style={{ background: '#ef444420', border: '1px solid #ef444430', borderRadius: 8, padding: '8px', cursor: 'pointer', color: '#ef4444', display: 'flex' }}>
                    <Trash2 size={16} />
                  </button>
                )}
                {key && (
                  <button onClick={() => toggleEdit(idx)} style={{ background: 'var(--bg-overlay-10)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                    <Check size={16} />
                  </button>
                )}
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Key size={16} color="#3b82f6" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{idx === 0 ? 'Primary Key' : `Backup Key ${idx}`}</span>
                    <span style={{ background: '#064e3b', color: '#34d399', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99 }}>ACTIVE</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, color: 'var(--text-secondary)' }}>
                    <button onClick={() => toggleEdit(idx)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><Edit2 size={16} /></button>
                    <button onClick={() => removeKey(idx)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                </div>
                <div style={{ fontFamily: "'Anek Bangla', sans-serif", color: 'var(--text-secondary)', fontSize: 14 }}>
                  {key.length > 15 ? `${key.substring(0, 6)}...${key.substring(key.length - 4)}` : key}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={addKey}
          style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px dashed var(--border-light)', background: 'transparent', color: '#a78bfa', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 600 }}
        >
          <Plus size={16} /> Key য9 করুন
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-brand"
          style={{ flex: 2, padding: '10px 16px', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          {saving ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <><Check size={16} /> সেভ করুন</>}
        </button>
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{hint}</p>
    </div>
  );
}

//  Result Section 
function ResultSection({ result, onClear }: { result: GenerationResult; onClear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card" style={{ padding: 24, marginBottom: 32, border: '1px solid #a78bfa40' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Check size={18} /> Success!
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClear} style={{ background: 'var(--bg-overlay-5)', border: '1px solid var(--bg-overlay-15)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <X size={14} /> Clear
          </button>
          <button onClick={() => {
            const txt = buildExportText(result);
            navigator.clipboard.writeText(txt);
            toast.success('সব কপি হয়!:!!');
          }} style={{ background: 'var(--bg-overlay-5)', border: '1px solid var(--bg-overlay-15)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ClipboardList size={14} /> Copy All
          </button>
          <button onClick={() => {
            const txt = buildExportText(result);
            downloadTextFile(txt, `SmartVideoAI_${result.topic.substring(0,20)}.txt`);
            toast.success('TXT ফা!ল ডা0নল9ড হa্:!!');
          }} style={{ background: 'var(--gradient-brand)', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Topic Tag */}
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 12, background: '#9333ea20', color: '#d8b4fe', padding: '4px 12px', borderRadius: 99, border: '1px solid #9333ea40' }}>
          xR {result.topic}
        </span>
        <span style={{ fontSize: 12, background: 'var(--border-light)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: 99, marginLeft: 8 }}>
          {result.language} · {result.contentType}
        </span>
      </div>

      {/* Copyright & Originality Check */}
      {result.results.copyrightCheck && (
        <div style={{ background: result.results.copyrightCheck.isOriginal ? '#22d3a015' : '#ef444415', border: `1px solid ${result.results.copyrightCheck.isOriginal ? '#22d3a040' : '#ef444440'}`, padding: 16, borderRadius: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, color: result.results.copyrightCheck.isOriginal ? '#22d3a0' : '#ef4444' }}>
              <Shield size={16} /> Copyright & Originality (AI)
            </span>
            <span style={{ fontSize: 20, fontWeight: 900, color: result.results.copyrightCheck.isOriginal ? '#22d3a0' : '#ef4444' }}>
              {result.results.copyrightCheck.originalityScore}/100
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {result.results.copyrightCheck.isOriginal ? 'S& "ন্x!ন্xxি মRলি" (Original) মন! হa্:!। কপিরা!x বা "মি0নিxি া!ডলা!ন!র বড় "9ন9 সমস্যা দ!া যাa্:! না।' : 'a️ কপিরা!x বা x্র!ডমার্" &্যালার্x!'}
          </p>
          {result.results.copyrightCheck.warningMessage && (
            <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8, background: '#ef444410', padding: '8px 12px', borderRadius: 8 }}>
              {result.results.copyrightCheck.warningMessage}
            </p>
          )}
        </div>
      )}

      {/* Score breakdown */}
      <div style={{ background: 'var(--bg-overlay-5)', padding: 16, borderRadius: 12, border: '1px solid var(--border)', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><BarChart2 size={16} color="#22d3a0" /> Overall Viral Score</span>
          <span style={{ fontSize: 24, fontWeight: 900, color: '#22d3a0' }}>{result.results.viralScore.overall}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
          <ScoreBar label="CTR Prop" value={result.results.viralScore.ctrProbability} color="#6c47ff" />
          <ScoreBar label="Emotion" value={result.results.viralScore.emotionalTrigger} color="#ff47a3" />
          <ScoreBar label="SEO" value={result.results.viralScore.seoStrength} color="#22d3a0" />
          <ScoreBar label="Curiosity" value={result.results.viralScore.curiosityGap} color="#f59e0b" />
        </div>
      </div>

      {/* Titles */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}><Type size={16} /> Viral Titles</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {result.results.titles.map((t, i) => (
            <div key={i} style={{ background: 'var(--bg-overlay-5)', border: '1px solid var(--border)', padding: '12px 14px', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, lineHeight: 1.4 }}>{t.text}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, background: '#ff47a320', color: '#ff47a3', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>{t.emotionTag}</span>
                    
                    {t.hashtags && t.hashtags.map((h, idx) => (
                      <span key={idx} style={{ fontSize: 10, color: '#22d3a0', background: '#22d3a015', padding: '2px 8px', borderRadius: 6 }}>{h}</span>
                    ))}
                  </div>

                  {t.viralScore && (
                    <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 10, color: 'var(--text-muted)' }}>
                      <span>Viral: <strong style={{ color: 'var(--text-primary)' }}>{t.viralScore}</strong></span>
                      <span>CTR: <strong style={{ color: 'var(--text-primary)' }}>{t.ctrScore}</strong></span>
                      <span>SEO: <strong style={{ color: 'var(--text-primary)' }}>{t.seoScore}</strong></span>
                    </div>
                  )}
                </div>
                <CopyBtn text={`${t.text}${t.hashtags ? '\n\n' + t.hashtags.join(' ') : ''}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Description */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={16} /> SEO Description</h3>
        <div style={{ background: 'var(--bg-overlay-5)', border: '1px solid var(--border)', padding: 16, borderRadius: 10, position: 'relative' }}>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, marginBottom: 8 }}>{result.results.description}</p>
          <div style={{ position: 'absolute', top: 12, right: 12 }}><CopyBtn text={result.results.description} /></div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          🏷️ SEO Tags
          <span style={{ fontSize: 11, background: '#22d3a020', color: '#22d3a0', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>
            {(result.results.tags.fromTitles?.length || 0) + (result.results.tags.tripleKeywords?.length || 0) + (result.results.tags.seoPowerTags?.length || 0)}xি x্যা
          </span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* From Titles */}
          {result.results.tags.fromTitles?.length > 0 && (
            <div style={{ background: '#4f46e510', border: '1px solid #4f46e530', padding: '14px 16px', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#818cf8', fontWeight: 700 }}>Title Keywords ({result.results.tags.fromTitles.length})</span>
                <CopyBtn text={result.results.tags.fromTitles.join(', ')} label="কপি" />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.results.tags.fromTitles.map(t => (
                  <span key={t} onClick={() => { navigator.clipboard.writeText(t); toast.success(`"${t}" কপি!`); }}
                    style={{ fontSize: 11, color: '#818cf8', background: '#4f46e520', padding: '4px 10px', borderRadius: 99, cursor: 'pointer' }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Triple Keywords */}
          {result.results.tags.tripleKeywords?.length > 0 && (
            <div style={{ background: '#a78bfa10', border: '1px solid #a78bfa30', padding: '14px 16px', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#a78bfa', fontWeight: 700 }}>x Triple Keywords ({result.results.tags.tripleKeywords.length})</span>
                <CopyBtn text={result.results.tags.tripleKeywords.join(', ')} label="কপি" />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.results.tags.tripleKeywords.map(t => (
                  <span key={t} onClick={() => { navigator.clipboard.writeText(t); toast.success(`"${t}" কপি!`); }}
                    style={{ fontSize: 11, color: '#a78bfa', background: '#a78bfa15', padding: '4px 10px', borderRadius: 99, cursor: 'pointer' }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* SEO Power Tags */}
          {result.results.tags.seoPowerTags?.length > 0 && (
            <div style={{ background: '#22d3a010', border: '1px solid #22d3a030', padding: '14px 16px', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#22d3a0', fontWeight: 700 }}>SEO Power Tags ({result.results.tags.seoPowerTags.length})</span>
                <CopyBtn text={result.results.tags.seoPowerTags.join(', ')} label="কপি" />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.results.tags.seoPowerTags.map(t => (
                  <span key={t} onClick={() => { navigator.clipboard.writeText(t); toast.success(`"${t}" কপি!`); }}
                    style={{ fontSize: 11, color: '#22d3a0', background: '#22d3a015', padding: '4px 10px', borderRadius: 99, cursor: 'pointer' }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Copy All Tags Combined */}
          <button
            onClick={() => {
              const all = [...(result.results.tags.fromTitles || []), ...(result.results.tags.tripleKeywords || []), ...(result.results.tags.seoPowerTags || [])].join(', ');
              navigator.clipboard.writeText(all);
              toast.success('সব x্যা এ"সাথ! কপি হয়!:!! x️');
            }}
            style={{ background: 'linear-gradient(to right, #4f46e5, #9333ea)', border: 'none', borderRadius: 10, padding: '10px 16px', color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Copy size={14} /> সব x্যা এ"সাথ! কপি করুন (YouTube-এ প!স্x করুন)
          </button>

        </div>
      </div>

      {/* Content Strategy */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={16} /> Content Strategy</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Upload Schedule */}
          <div style={{ background: 'var(--bg-overlay-5)', border: '1px solid var(--border)', padding: 16, borderRadius: 10 }}>
            <p style={{ fontSize: 12, color: '#a78bfa', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              ⏰  পল9ড!র স!রা সময় (বালাদ!শ সময়)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: 'xR&', label: 'স"াল', val: result.results.contentStrategy.uploadSchedule?.morning },
                { icon: 'ܬ️', label: 'দুপুর', val: result.results.contentStrategy.uploadSchedule?.afternoon },
                { icon: 'xR ', label: 'সন্ধ্যা', val: result.results.contentStrategy.uploadSchedule?.evening },
                { icon: 'x&', label: 'স!রা দিন', val: result.results.contentStrategy.uploadSchedule?.bestDay },
              ].filter(row => row.val).map(({ icon, label, val }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{icon} {label}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{val}</p>
                  </div>
                  <CopyBtn text={val!} />
                </div>
              ))}
            </div>
          </div>

          {/* Shorts Idea */}
          {result.results.contentStrategy.shortsRepurposeIdea && (
            <div style={{ background: 'var(--bg-overlay-5)', border: '1px solid var(--border)', padding: 16, borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: '#a78bfa', fontWeight: 700, marginBottom: 6 }}>x Shorts / Reel  !ডিয়া</p>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{result.results.contentStrategy.shortsRepurposeIdea}</p>
                </div>
                <CopyBtn text={result.results.contentStrategy.shortsRepurposeIdea} />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Thumbnail Strategy */}
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}><Image size={16} /> Thumbnail Strategy</h3>
        <div style={{ background: 'var(--bg-overlay-5)', border: '1px solid var(--border)', padding: 16, borderRadius: 10 }}>
          <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{result.results.thumbnailStrategy}</p>
          <div style={{ background: 'var(--bg-primary)', padding: 12, borderRadius: 8, border: '1px dashed #6c47ff' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>AI Generation Prompt:</p>
            <p style={{ fontSize: 12, color: 'var(--text-primary)' }}>{result.results.thumbnailPrompt}</p>
            <div style={{ marginTop: 8 }}><CopyBtn text={result.results.thumbnailPrompt} /></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

//  Main Page 
export default function UnifiedDashboard() {
  const navigate = useNavigate();
  const { appUser, reset } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'agent' | 'audio' | 'admin'>('agent');
  
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>(() => {
    return (localStorage.getItem('app_theme') as 'dark' | 'light' | 'system') || 'system';
  });

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    
    const applyTheme = () => {
      let isLight = false;
      if (theme === 'light') {
        isLight = true;
      } else if (theme === 'system') {
        isLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      }
      
      if (isLight) {
        document.body.classList.add('light-mode');
      } else {
        document.body.classList.remove('light-mode');
      }
    };
    
    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const handleThemeToggle = () => {
    setTheme(prev => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'system';
      return 'dark';
    });
  };

  // Settings Modal
  const [showSettings, setShowSettings] = useState(false);
  const [userApiKeys, setUserApiKeys] = useState<string[]>([]);
  const [savingUserKeys, setSavingUserKeys] = useState(false);

  // Channel
  const [channelName, setChannelName] = useState('');
  const [showChannelPrompt, setShowChannelPrompt] = useState(false);
  const [tempChannelName, setTempChannelName] = useState('');
  const [savingChannel, setSavingChannel] = useState(false);

  // Support
  const [showSupport, setShowSupport] = useState(false);
  const [supportLinks, setSupportLinks] = useState({
    appUpdateLink: '', tutorialLink: '', communityLink: '', whatsappLink: '', websiteLink: '', geminiApiKeyLink: ''
  });

  // Admin State
  const [users, setUsers] = useState<AppUser[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'blocked'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionUid, setActionUid] = useState<string | null>(null);
  const [adminApiKeys, setAdminApiKeys] = useState<string[]>([]);
  const [savingAdminKeys, setSavingAdminKeys] = useState(false);
  const [adminSettings, setAdminSettings] = useState({
    appUpdateLink: '', tutorialLink: '', communityLink: '', whatsappLink: '', websiteLink: '', geminiApiKeyLink: ''
  });
  
  const [paymentNumber, setPaymentNumber] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('500');
  const [appVersion, setAppVersion] = useState('1.1');
  const [activeMethods, setActiveMethods] = useState({
    bkash: true,
    nagad: true,
    rocket: true
  });
  const [savingPaymentNumber, setSavingPaymentNumber] = useState(false);
  const [savingAdminLinks, setSavingAdminLinks] = useState(false);

  // Generate State
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState<Language>('bangla');
  const [contentType, setContentType] = useState<ContentType>('shorts');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [showBackupKeyInput, setShowBackupKeyInput] = useState(false);
  const [backupKey, setBackupKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  // Voice Upload & Typing State
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeStep, setTranscribeStep] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const startVoiceTyping = () => {
    // If already recording  stop it
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('আপনার ব্রা0Sার ভয়!স xা!পি সাপ9র্x "র! না। Google Chrome বা Edge ব্যবহার করুন।');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'bangla' ? 'bn-BD' : 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsRecording(true);
      toast.success('বলত! থা"ুন,  মি শুনছি...', { icon: 'x}"️', duration: 2000 });
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTopic(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      // 'aborted' and 'no-speech' are normal  don't show error
      if (event.error === 'aborted' || event.error === 'no-speech') {
        setIsRecording(false);
        return;
      }
      setIsRecording(false);
      if (event.error === 'not-allowed') {
        const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform();
        if (isNative) {
          toast.error('মা!"্র9ফ9ন পারমিশন দিন! ফ9ন!র স!xিস > &্যাপস > Smart Video AI > পারমিশন থ!"! মা!"্র9ফ9ন &্যালা0 করুন।');
        } else {
          toast.error('মাইক্রোফোন পারমিশন দিন! ব্রাউজারের অ্যাড্রেসবারে মাইক আইকনে ক্লিক করুন।');
        }
      } else if (event.error === 'network') {
        toast.error('ন!xয়ার্" সমস্যা! !ন্xারন!x a!" করুন।');
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.start();
  };

  // History
  type HistoryItem = GenerationResult & { id: string };
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [storyHistory, setStoryHistory] = useState<StoryProject[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistoryLimit, setShowHistoryLimit] = useState(10);

  // Audio TTS
  const [ttsScript, setTtsScript] = useState('');
  const [ttsVoice, setTtsVoice] = useState('Puck');
  const [ttsSpeed, setTtsSpeed] = useState<SpeechSpeed>('normal');
  const [ttsMood, setTtsMood] = useState<SpeechMood>('normal');
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [ttsWavBuffer, setTtsWavBuffer] = useState<ArrayBuffer | null>(null);
  const [ttsIsPlaying, setTtsIsPlaying] = useState(false);
  const [ttsProgress, setTtsProgress] = useState(0);
  const [ttsDuration, setTtsDuration] = useState(0);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  const fetchAdminData = async () => {
    if (appUser?.role !== 'admin') return;
    setAdminLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch { toast.error('Failed to load admin data'); }
    finally { setAdminLoading(false); }
  };

  const handleApprove = async (uid: string) => {
    setActionUid(uid);
    try {
      await updateUserStatus(uid, 'active');
      setUsers(users.map(u => u.uid === uid ? { ...u, status: 'active' } : u));
      toast.success('User Approved!');
    } catch { toast.error('Failed to approve user'); }
    finally { setActionUid(null); }
  };

  const handleBlock = async (uid: string) => {
    setActionUid(uid);
    try {
      await updateUserStatus(uid, 'blocked');
      setUsers(users.map(u => u.uid === uid ? { ...u, status: 'blocked' } : u));
      toast.success('User Deactivated!');
    } catch { toast.error('Failed to deactivate user'); }
    finally { setActionUid(null); }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await resetPassword(email);
      toast.success(`পাসয়ার্ড রিস!x !ম!!ল পাঠান9 হয়!:!: ${email}`);
    } catch (e: any) {
      toast.error('পাসয়ার্ড রিস!x করতে! সমস্যা হয়!:!: ' + e.message);
    }
  };

  const fetchSupportData = async () => {
    try {
      const settings = await getAdminGeminiSettings();
      if (settings) {
        const links = {
          appUpdateLink: settings.appUpdateLink || '',
          tutorialLink: settings.tutorialLink || '',
          communityLink: settings.communityLink || '',
          whatsappLink: settings.whatsappLink || '',
          websiteLink: settings.websiteLink || '',
          geminiApiKeyLink: settings.geminiApiKeyLink || '',
        };
        setSupportLinks(links);
        setAdminSettings(links);
        const keys: string[] = (settings as any).apiKeys || [];
        if ((settings as any).backupKey && !keys.includes((settings as any).backupKey)) {
          setAdminApiKeys([(settings as any).backupKey, ...keys]);
        } else {
          setAdminApiKeys(keys.length > 0 ? keys : ['']);
        }
      }

      const publicSettings = await getPublicSettings();
      if (publicSettings) {
        if (publicSettings.paymentNumber) setPaymentNumber(publicSettings.paymentNumber);
        if (publicSettings.paymentAmount) setPaymentAmount(publicSettings.paymentAmount);
        if (publicSettings.activeMethods) setActiveMethods(publicSettings.activeMethods);
        if (publicSettings.appVersion) setAppVersion(publicSettings.appVersion);
      }
    } catch (e) {}
  };

  const handleSaveAdminLinks = async () => {
    setSavingAdminLinks(true);
    try {
      await saveAdminGeminiSettings(adminSettings);
      setSupportLinks(adminSettings);
      toast.success('Support Links স!ভ হয়!:!!');
    } catch (e) {
      toast.error('Failed to save links');
    } finally {
      setSavingAdminLinks(false);
    }
  };

  const handleSaveAdminApiKeys = async (keys: string[]) => {
    setSavingAdminKeys(true);
    try {
      await saveAdminApiKeys(keys);
      setAdminApiKeys(keys);
      toast.success(`${keys.filter(Boolean).length}টি Admin API Key সেভ হয়েছে!`);
    } catch (e) {
      toast.error('Failed to save admin keys');
    } finally {
      setSavingAdminKeys(false);
    }
  };

  useEffect(() => {
    if (appUser) {
      fetchUserProfile();
      fetchSupportData();
      if (appUser.role === 'admin') fetchAdminData();
    }
  }, [appUser]);

  // TTS Handlers
  const handleTtsGenerate = async () => {
    if (!ttsScript.trim()) { toast.error('স্ক্রিপ্ট লিখুন!'); return; }
    if (!appUser) { toast.error('Please login first'); return; }

    // Cleanup previous audio
    if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null; }
    if (ttsAudioUrl) URL.revokeObjectURL(ttsAudioUrl);
    setTtsAudioUrl(null); setTtsWavBuffer(null); setTtsIsPlaying(false); setTtsProgress(0);

    setTtsLoading(true);
    try {
      const validUserKeys  = userApiKeys.filter(k => k && k.trim());
      const validAdminKeys = adminApiKeys.filter(k => k && k.trim());
      const combinedKeys   = Array.from(new Set([...validUserKeys, ...validAdminKeys]));
      const primaryKey     = combinedKeys[0];

      const wavBuffer = await generateSpeech({
        script: ttsScript, voiceId: ttsVoice, speed: ttsSpeed, mood: ttsMood,
        primaryKey, allKeys: combinedKeys,
      });
      const blobUrl = createAudioBlobUrl(wavBuffer);
      setTtsWavBuffer(wavBuffer);
      setTtsAudioUrl(blobUrl);
      toast.success('অডিও তৈরি হয়েছে! 🎙️');
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg === 'API_KEY_MISSING') toast.error('Settings-এ আপনার Gemini API Key যোগ করুন!');
      else if (msg === 'QUOTA_EXCEEDED') toast.error('API Quota শেষ! অন্য API Key ব্যবহার করুন।');
      else if (msg === 'INVALID_API_KEY') toast.error('API Key টি সঠিক নয়।');
      else toast.error(msg || 'অডিও তৈরি করতে সমস্যা হয়েছে।');
    } finally {
      setTtsLoading(false);
    }
  };

  const handleTtsPlayPause = () => {
    if (!ttsAudioUrl) return;
    if (!ttsAudioRef.current) {
      const audio = new Audio(ttsAudioUrl);
      audio.ontimeupdate = () => { setTtsProgress(audio.currentTime); };
      audio.onloadedmetadata = () => { setTtsDuration(audio.duration); };
      audio.onended = () => { setTtsIsPlaying(false); setTtsProgress(0); };
      ttsAudioRef.current = audio;
    }
    if (ttsIsPlaying) {
      ttsAudioRef.current.pause();
      setTtsIsPlaying(false);
    } else {
      ttsAudioRef.current.play();
      setTtsIsPlaying(true);
    }
  };

  const handleTtsStop = () => {
    if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current.currentTime = 0; }
    setTtsIsPlaying(false); setTtsProgress(0);
  };

  const handleTtsSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    if (ttsAudioRef.current) ttsAudioRef.current.currentTime = t;
    setTtsProgress(t);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60); const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const fetchUserProfile = async () => {
    if (!appUser) return;
    try {
      const profile = await getUserProfile(appUser.uid) as any;
      if (profile?.channelName) {
        setChannelName(profile.channelName);
        setTempChannelName(profile.channelName);
      } else {
        setShowChannelPrompt(true);
      }
      // Load user's API keys
      const keys = await getUserApiKeys(appUser.uid);
      setUserApiKeys(keys.length > 0 ? keys : ['']);
    } catch (e) {}
  };

  const handleSaveUserApiKeys = async (keys: string[]) => {
    if (!appUser) return;
    setSavingUserKeys(true);
    try {
      await saveUserApiKeys(appUser.uid, keys);
      setUserApiKeys(keys);
      toast.success(`${keys.filter(Boolean).length}টি Personal API Key সেভ হয়েছে!`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save keys');
    } finally {
      setSavingUserKeys(false);
    }
  };

  const handleSaveChannel = async () => {
    if (!tempChannelName.trim() || !appUser) return;
    setSavingChannel(true);
    try {
      await updateDoc(doc(db, 'users', appUser.uid), { channelName: tempChannelName.trim() });
      setChannelName(tempChannelName.trim());
      setShowChannelPrompt(false);
      toast.success('Channel name saved!');
    } catch (e: any) {
      toast.error('Failed to save channel name.');
    } finally {
      setSavingChannel(false);
    }
  };

  const mergedHistory = [...history.map(h => ({...h, _type: 'seo' as const, date: h.createdAt})), ...storyHistory.map(s => ({...s, _type: 'story' as const, date: s.createdAt}))].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());



  const steps = [
    'Topic বিশ্লেষণ "র:ি⬦',
    'Emotion Engine চালু⬦',
    'Viral Score ণনা "র:ি⬦',
    'Thumbnail Strategy তরি⬦',
    'Final Output সাজাচ্ছি⬦',
  ];

  const handleGenerate = async () => {
    if (!topic.trim()) { toast.error('Topic লিুন!'); return; }
    if (!appUser) { toast.error('Please login first'); return; }

    setLoading(true);
    setResult(null);

    for (let i = 0; i < steps.length; i++) {
      setStep(i);
      await new Promise(r => setTimeout(r, 400));
    }

    try {
      const validUserKeys = userApiKeys.filter(k => k && k.trim());
      const validAdminKeys = adminApiKeys.filter(k => k && k.trim());
      const combinedKeys = Array.from(new Set([...validUserKeys, ...validAdminKeys]));
      const primaryKey = combinedKeys[0];

      const genResult = await generateContent(topic, language, contentType, primaryKey, combinedKeys, channelName);
      genResult.userId = appUser.uid;

      const docId = await saveGeneration(appUser.uid, genResult);
      genResult.id = docId;

      setResult(genResult);
      toast.success('Content তরি হয়!:!! x}0');
      setHistory(prev => [{ ...genResult, id: docId } as HistoryItem, ...prev]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      if (message === 'QUOTA_EXCEEDED') {
        toast.error('API Key লিমিx শ!ষ! নিa! আপনার Gemini API Key দিx! x্রা! করুন।', { duration: 6000 });
        setShowBackupKeyInput(true);
      } else if (message.includes('API key') || message.includes('No Gemini')) {
        toast.error('Gemini API Key দর"ার! Settings-এ িয়! আপনার key স!x করুন।');
        setShowSettings(true);
      } else {
        toast.error('Error: ' + message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuickKey = async () => {
    if (!backupKey.trim() || !appUser) return;
    setSavingKey(true);
    try {
      const cleanKey = backupKey.trim();
      const existing = userApiKeys.map(k => k ? k.trim() : '').filter(Boolean);
      // Put NEW key at index 0 so it is tried first!
      const newKeys = Array.from(new Set([cleanKey, ...existing]));
      await saveUserApiKeys(appUser.uid, newKeys);
      setUserApiKeys(newKeys);
      setShowBackupKeyInput(false);
      setBackupKey('');
      toast.success('নতুন API Key স!ভ হয়!:!! এন  বার Generate "্লি" করুন। x}0');
    } catch (err: any) {
      toast.error(err.message || 'Key স!ভ করতে! সমস্যা হয়!:!।');
    } finally {
      setSavingKey(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    reset();
    navigate('/login');
  };

  const handleToggleFav = async (id: string, currentFav: boolean) => {
    try {
      await toggleFavorite(id, !currentFav);
      setHistory(prev => prev.map(h => h.id === id ? { ...h, isFavorited: !currentFav } : h));
      toast.success(currentFav ? 'Removed from favorites' : 'Added to favorites ⭐');
    } catch (e) { toast.error('Failed to update favorite'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('এই আইটেমটি ডিলিট করতে চান?')) return;
    try {
      await deleteGeneration(id);
      setHistory(prev => prev.filter(h => h.id !== id));
      toast.success('Deleted');
      if (result?.id === id) setResult(null);
    } catch (e) { toast.error('Failed to delete'); }
  };

  //  Voice Upload Handler 
  const handleVoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = '';
    if (!file) return;

    // File size check  Gemini inline limit ~18MB
    const maxSizeMB = 18;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`ফাইলটি ${maxSizeMB}MB-এর বেশি। ছোট একটি ক্লিপ ব্যবহার করুন।`, { duration: 5000 });
      return;
    }

    // Validate MIME type
    const supportedTypes = [
      'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a',
      'audio/mp4', 'audio/webm', 'audio/aac', 'audio/flac',
      'video/mp4', 'video/webm', 'video/3gpp', 'video/quicktime',
    ];
    if (!supportedTypes.some(t => file.type.startsWith(t.split('/')[0]))) {
      toast.error('শুধুমাত্র অডিও বা ভিডিও ফাইল সাপোর্ট করা হয়।');
      return;
    }

    setTranscribing(true);
    setTranscribeStep('ফা!ল পড়:ি...');

    try {
      // Read file as base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix (e.g. "data:audio/mp3;base64,")
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setTranscribeStep('Gemini AI ভয়!স বিশ্লেষণ "র:!...');

      const validUserKeys = userApiKeys.filter(k => k && k.trim());
      const validAdminKeys = adminApiKeys.filter(k => k && k.trim());
      const combinedKeys = Array.from(new Set([...validUserKeys, ...validAdminKeys]));
      const primaryKey = combinedKeys[0];

      const transcription = await transcribeAudio(
        base64Data,
        file.type || 'audio/mpeg',
        primaryKey,
        combinedKeys
      );

      if (!transcription || transcription.trim().length < 3) {
        toast.error('ভয়!স ব9ঝা যাa্:! না। পরিষ্"ার &ডি দিন।');
        return;
      }

      setTopic(transcription);
      toast.success(`ভয়!স transcript হয়!:!! এন "এজেন্ট চালু করুন" "্লি" করুন। x}"️`, { duration: 4000 });
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg === 'QUOTA_EXCEEDED') {
        toast.error('API Key লিমিট শেষ। Settings-এ নতুন key যোগ করুন।');
        setShowSettings(true);
      } else if (msg === 'FILE_TOO_LARGE') {
        toast.error('ফাইল অনেক বড়। ১৮ মেগাবাইটের কম ফাইল দিন।');
      } else {
        toast.error('ভয়েস process করতে সমস্যা হয়েছে: ' + msg);
      }
    } finally {
      setTranscribing(false);
      setTranscribeStep('');
    }
  };

  // Load history item into main area
  const handleLoadHistoryItem = (item: HistoryItem) => {
    setResult(item);
    setActiveTab('agent');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success('History item লোড হয়েছে!');
  };

  return (
    <div className="app-layout">

      {/* --- Top App Bar (mobile only) --- */}
      <div className="top-app-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="Smart Video AI Logo" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <h1 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>SmartVideo.AI</h1>
            <span style={{ fontSize: 10, color: '#6c47ff', fontWeight: 700, letterSpacing: 0.5 }}>v{appVersion}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleThemeToggle} title={`Theme: ${theme}`} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {theme === 'light' ? <Sun size={20} /> : theme === 'dark' ? <Moon size={20} /> : <Monitor size={20} />}
          </button>
          <button onClick={() => setShowSupport(true)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <Headphones size={20} />
          </button>
          <button onClick={() => setShowSettings(true)} style={{ background: 'var(--bg-overlay-10)', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <SettingsIcon size={18} />
          </button>
          <button onClick={() => setShowChannelPrompt(true)} style={{ background: 'var(--bg-overlay-10)', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <User size={18} />
          </button>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="main-content">

        {/* Hero Section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)' }}>
              {activeTab === 'admin' && appUser?.role === 'admin' ? 'এডমিন প্যানেল' : (channelName || 'আপনার চ্যানেল')}
            </h2>
            <div style={{ background: '#3b0764', color: '#d8b4fe', padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Shield size={10} /> {appUser?.role === 'admin' ? 'ADMIN' : 'PRO'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 14 }}>
            <Sparkles size={14} color="#a78bfa" /> AI Video SEO Engine Professional
          </div>
        </div>

        {activeTab === 'agent' ? (
          <>
            {/* Generate Workspace Card */}
            <motion.div className="glass-card" style={{ padding: '24px 20px', marginBottom: 24, background: 'var(--bg-panel)', border: '1px solid var(--border-light)' }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            >
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <Mic size={14} /> জেনারেটর ওয়ার্কস্পেস
              </h3>

              <div style={{ marginBottom: 24, position: 'relative' }}>
                <textarea
                  placeholder="আপনার ভিডিওর টপিক বা ভয়েস স্ক্রিপ্ট এখানে দিন..."
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  style={{
                    width: '100%', minHeight: 120, background: 'transparent', border: 'none',
                    color: 'var(--text-primary)', fontSize: 18, resize: 'none', outline: 'none',
                    lineHeight: 1.5, fontFamily: "'Anek Bangla', sans-serif", paddingRight: 60
                  }}
                />
                <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 8 }}>
                  {topic && (
                    <button
                      onClick={() => { navigator.clipboard.writeText(topic); toast.success('লেখা কপি হয়েছে!'); }}
                      style={{
                        background: 'var(--border-light)', color: '#a78bfa', border: '1px solid var(--border-light)', borderRadius: '50%',
                        width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                      title="লেখাটি কপি করুন"
                    >
                      <Copy size={18} />
                    </button>
                  )}
                  <button
                    onClick={startVoiceTyping}
                    className={isRecording ? "pulse-glow" : ""}
                    style={{
                      background: isRecording ? '#ef4444' : 'var(--border-light)',
                      color: 'var(--text-primary)', border: 'none', borderRadius: '50%',
                      width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.2s',
                      boxShadow: isRecording ? '0 0 20px #ef4444' : 'none'
                    }}
                    title={isRecording ? "শুনছি..." : "ভয়েস দিয়ে লিখুন"}
                  >
                    <Mic size={20} />
                  </button>
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border-light)', marginBottom: 16 }} />

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/mp4,video/webm,video/3gpp,video/quicktime,video/mpeg,video/x-msvideo"
                style={{ display: 'none' }}
                onChange={handleVoiceUpload}
              />

              {/* Top row: Voice upload + Language */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={transcribing}
                  style={{
                    background: transcribing ? '#a78bfa15' : 'transparent',
                    border: `1px solid ${transcribing ? '#a78bfa50' : 'var(--border-light)'}`,
                    color: transcribing ? '#a78bfa' : '#e5e7eb',
                    padding: '10px 16px', borderRadius: 12, fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontWeight: 500, cursor: transcribing ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {transcribing ? (
                    <><div className="spinner" style={{ width: 14, height: 14 }} /> {transcribeStep}</>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Upload size={14} /> অডিও / ভিডিও আপলোড
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', paddingLeft: 20 }}>MP3, MP4, WAV, Shorts সব চলবে</span>
                    </div>
                  )}
                </button>

                {/* Language Selector */}
                <div style={{ display: 'flex', background: 'var(--border-light)', borderRadius: 99, padding: 4, gap: 2 }}>
                  {([
                    { val: 'bangla', label: 'বাংলা' },
                    { val: 'english', label: 'EN' },
                  ] as { val: Language; label: string }[]).map(({ val, label }) => (
                    <button key={val} onClick={() => setLanguage(val)} style={{
                      padding: '8px 16px', borderRadius: 99, border: 'none', fontSize: 12, fontWeight: 600,
                      background: language === val ? '#9333ea' : 'transparent',
                      color: language === val ? '#fff' : '#9ca3af', cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Type Row */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 24 }}>
                <button onClick={() => setContentType('shorts')} style={{
                  padding: '10px 20px', borderRadius: 99, border: 'none', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                  background: contentType === 'shorts' ? '#fff' : 'transparent',
                  color: contentType === 'shorts' ? '#000' : '#9ca3af', cursor: 'pointer', transition: 'all 0.2s'
                }}>
                  <Zap size={16} /> শর্টস
                </button>
                <button onClick={() => setContentType('long')} style={{
                  padding: '10px 20px', borderRadius: 99, border: 'none', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                  background: contentType === 'long' ? '#fff' : 'transparent',
                  color: contentType === 'long' ? '#000' : '#9ca3af', cursor: 'pointer', transition: 'all 0.2s'
                }}>
                  <Video size={16} /> লং কন্টেন্ট
                </button>
              </div>

              <button
                className={`btn-brand ${!loading ? 'pulse-glow' : ''}`}
                onClick={handleGenerate}
                disabled={loading}
                style={{ 
                  width: '100%', height: 56, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
                  borderRadius: 16, 
                  background: loading ? 'rgba(79, 70, 229, 0.2)' : 'linear-gradient(to right, #4f46e5, #9333ea)', 
                  border: loading ? '1px solid rgba(147, 51, 234, 0.4)' : 'none',
                  transition: 'all 0.3s ease-in-out',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                {loading && (
                  <motion.div 
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: 1 }}
                    transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse", ease: "easeInOut" }}
                    style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(167, 139, 250, 0.2), transparent)', zIndex: 0 }}
                  />
                )}
                
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {loading ? (
                    <motion.div 
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <Sparkles size={18} color="#d8b4fe" />
                      <span style={{ color: '#f3e8ff', fontWeight: 600, letterSpacing: 0.5 }}>{steps[step]}</span>
                    </motion.div>
                  ) : (
                    <><Sparkles size={18} /> Start Now</>
                  )}
                </div>
              </button>

              {/* Quick API Key input on error */}
              <AnimatePresence>
                {showBackupKeyInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ marginTop: 16, overflow: 'hidden' }}
                  >
                    <div style={{ padding: 16, background: '#ff47a315', border: '1px solid #ff47a340', borderRadius: 12 }}>
                      <p style={{ fontSize: 12, color: '#ff47a3', fontWeight: 600, marginBottom: 12 }}>
                        ⚠️ API Key লিমিট শেষ! আপনার Gemini API Key দিন:
                      </p>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <input
                          type="password" placeholder="AIzaSy..." className="input-field"
                          value={backupKey} onChange={e => setBackupKey(e.target.value)}
                          style={{ flex: 1, background: 'var(--bg-primary)' }}
                        />
                        <button
                          onClick={handleSaveQuickKey} disabled={savingKey}
                          className="btn-brand" style={{ padding: '0 16px', fontSize: 13, whiteSpace: 'nowrap' }}
                        >
                          {savingKey ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <a href={supportLinks.geminiApiKeyLink || 'https://aistudio.google.com/app/apikey'} target="_blank" rel="noreferrer" style={{ color: '#a78bfa', fontSize: 13, fontWeight: 600, textDecoration: 'underline' }}>API key তরি করতে! এান! "্লি" করুন</a>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Result Section */}
            <AnimatePresence mode="popLayout">
              {result && !loading && (
                <ResultSection result={result} onClear={() => setResult(null)} />
              )}
            </AnimatePresence>

            {/* Empty State */}
            {!result && !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '40px 20px', marginTop: 20 }}>
                <div style={{ width: 80, height: 80, margin: '0 auto 24px', background: 'var(--bg-panel)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={40} color="#4f46e5" opacity={0.6} />
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: '#d1d5db', marginBottom: 12 }}>তৈরি করতে প্রস্তুত?</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 280, margin: '0 auto', lineHeight: 1.5 }}>
                  উপরে একটি টপিক লিখুন এবং AI-এর ম্যাজিক দেখুন।
                </p>
              </motion.div>
            )}
          </>
        ) : activeTab === 'audio' as any ? (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ background: '#3b82f620', color: '#60a5fa', padding: 10, borderRadius: 12 }}>
                <Music size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>এআই ভয়েসওভার জেনারেটর</h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Gemini TTS — ন্যাচারাল মানবকণ্ঠ</p>
              </div>
            </div>

            {/* Script Input */}
            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={14} /> স্ক্রিপ্ট লিখুন
                </label>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ttsScript.length} / 5000 chars</span>
              </div>
              <textarea
                value={ttsScript}
                onChange={e => setTtsScript(e.target.value.slice(0, 5000))}
                placeholder={`আপনার স্ক্রিপ্ট এখানে লিখুন...\n\nEmotional Tags উদাহরণ:\n[excited] এই ভিডিওতে আপনি দেখবেন... [laughs]\n[amazed] এটা সত্যিই অবাক করা! [sighs]`}
                style={{
                  width: '100%', minHeight: 140, background: 'var(--bg-overlay-5)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '12px', color: 'var(--text-primary)', fontSize: 14,
                  fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                }}
              />
              {/* Emotional Tag Quick Insert */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {['[excited]', '[laughs]', '[sighs]', '[amazed]', '[sad]', '[whispers]', '[dramatic pause]'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setTtsScript(prev => prev + tag)}
                    style={{ background: 'var(--bg-overlay-10)', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#a78bfa', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Selection */}
            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: 14, padding: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Mic size={14} /> ভয়েস সিলেক্ট করুন
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                {VOICE_OPTIONS.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setTtsVoice(v.id)}
                    style={{
                      background: ttsVoice === v.id ? `${v.color}20` : 'var(--bg-overlay-5)',
                      border: `2px solid ${ttsVoice === v.id ? v.color : 'transparent'}`,
                      borderRadius: 12, padding: '12px 10px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 6 }}>
                      {v.id === 'Puck' ? '⚡' : v.id === 'Charon' ? '🎙️' : v.id === 'Kore' ? '🌟' : v.id === 'Fenrir' ? '🔥' : '🌙'}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: ttsVoice === v.id ? v.color : 'var(--text-primary)', marginBottom: 2 }}>{v.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.3 }}>{v.description}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, opacity: 0.8 }}>{v.bestFor}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Speed & Mood */}
            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: 14, padding: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {/* Speed */}
              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                  <Volume2 size={12} /> স্পিড
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['slow', 'normal', 'fast'] as SpeechSpeed[]).map(s => (
                    <button key={s} onClick={() => setTtsSpeed(s)} style={{
                      flex: 1, padding: '8px 4px', borderRadius: 8, border: `1.5px solid ${ttsSpeed === s ? '#3b82f6' : 'var(--border)'}`,
                      background: ttsSpeed === s ? '#3b82f620' : 'transparent', color: ttsSpeed === s ? '#60a5fa' : 'var(--text-muted)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                      {s === 'slow' ? '🐢 ধীর' : s === 'normal' ? '🎯 স্বাভাবিক' : '⚡ দ্রুত'}
                    </button>
                  ))}
                </div>
              </div>
              {/* Mood */}
              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                  <Sparkles size={12} /> মুড
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(['normal', 'excited', 'calm', 'dramatic'] as SpeechMood[]).map(m => (
                    <button key={m} onClick={() => setTtsMood(m)} style={{
                      padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${ttsMood === m ? '#8b5cf6' : 'var(--border)'}`,
                      background: ttsMood === m ? '#8b5cf620' : 'transparent', color: ttsMood === m ? '#a78bfa' : 'var(--text-muted)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                      {m === 'normal' ? '😐 নরমাল' : m === 'excited' ? '🤩 উত্তেজিত' : m === 'calm' ? '😌 শান্ত' : '🎭 ড্রামাটিক'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleTtsGenerate}
              disabled={ttsLoading || !ttsScript.trim()}
              style={{
                width: '100%', padding: '16px', borderRadius: 14, border: 'none', cursor: ttsLoading ? 'wait' : 'pointer',
                background: ttsLoading ? '#334155' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                color: '#fff', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all 0.3s', opacity: !ttsScript.trim() ? 0.5 : 1,
              }}
            >
              {ttsLoading ? (
                <>
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                  অডিও তৈরি হচ্ছে...
                </>
              ) : (
                <>
                  <Wand2 size={20} /> ভয়েসওভার জেনারেট করুন
                </>
              )}
            </button>

            {/* Audio Player */}
            {ttsAudioUrl && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'var(--bg-panel)', border: '1px solid #3b82f640', borderRadius: 16, padding: 20 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ background: '#3b82f620', color: '#60a5fa', padding: 8, borderRadius: 10 }}>
                    <Music size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>অডিও তৈরি হয়েছে ✅</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ভয়েস: {ttsVoice} • {ttsSpeed} • {ttsMood}</div>
                  </div>
                </div>

                {/* Progress bar */}
                <input
                  type="range" min={0} max={ttsDuration || 1} step={0.1} value={ttsProgress}
                  onChange={handleTtsSeek}
                  style={{ width: '100%', marginBottom: 8, accentColor: '#3b82f6', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatTime(ttsProgress)}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatTime(ttsDuration)}</span>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleTtsPlayPause}
                    style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {ttsIsPlaying ? <><Pause size={16} /> পজ করুন</> : <><Play size={16} /> প্লে করুন</>}
                  </button>
                  <button
                    onClick={handleTtsStop}
                    style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', cursor: 'pointer', background: 'transparent', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Square size={14} />
                  </button>
                  <button
                    onClick={() => ttsWavBuffer && downloadWav(ttsWavBuffer, `voiceover-${ttsVoice}.wav`)}
                    style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #22d3a040', cursor: 'pointer', background: '#22d3a015', color: '#22d3a0', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13 }}
                  >
                    <Download size={14} /> WAV
                  </button>
                </div>
              </motion.div>
            )}

            {/* Emotional Tags Guide */}
            <div style={{ background: '#f59e0b10', border: '1px solid #f59e0b30', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={12} /> Emotional Tagging Guide
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {[
                  ['[excited]', 'উত্তেজিত কণ্ঠ'],
                  ['[laughs]', 'হাসির স্বর'],
                  ['[sighs]', 'দীর্ঘশ্বাস'],
                  ['[amazed]', 'বিস্ময়ের সুর'],
                  ['[sad]', 'বিষণ্ণ কণ্ঠ'],
                  ['[whispers]', 'ফিসফিস কণ্ঠ'],
                ].map(([tag, desc]) => (
                  <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                    <code style={{ color: '#f59e0b', background: '#f59e0b15', padding: '1px 6px', borderRadius: 4 }}>{tag}</code>
                    <span>{desc}</span>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        ) : activeTab === 'admin' && appUser?.role === 'admin' ? (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>

            {/* User Management */}
            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: 16, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User size={18} /> User Management
                </h3>
                <button onClick={fetchAdminData} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>

              {/* Search Bar */}
              <div style={{ marginBottom: 20 }}>
                <input
                  type="text"
                  placeholder="Search by Name, Email, Phone, or Payment Number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              {/* Admin Stats Panel */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)', border: '1px solid rgba(147, 51, 234, 0.2)', padding: 16, borderRadius: 12 }}>
                  <p style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Users</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{users.length}</p>
                </div>
                
                <div style={{ background: 'rgba(34, 211, 160, 0.05)', border: '1px solid rgba(34, 211, 160, 0.2)', padding: 16, borderRadius: 12 }}>
                  <p style={{ fontSize: 11, color: '#34d399', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Active Now</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {users.filter(u => u.lastLoginAt && new Date(u.lastLoginAt).toDateString() === new Date().toDateString()).length}
                  </p>
                  <p style={{ fontSize: 10, color: '#34d399', opacity: 0.8, marginTop: 4 }}>Today's logins</p>
                </div>

                <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: 16, borderRadius: 12 }}>
                  <p style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Active Accounts</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{users.filter(u => u.status === 'active').length}</p>
                </div>

                <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: 16, borderRadius: 12 }}>
                  <p style={{ fontSize: 11, color: '#f87171', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Deactivated</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{users.filter(u => u.status === 'blocked').length}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
                {(['all', 'pending', 'active', 'blocked'] as const).map(f => {
                  const count = f === 'all' ? users.length : users.filter(u => u.status === f).length;
                  const label = f === 'blocked' ? 'Deactivated' : f.charAt(0).toUpperCase() + f.slice(1);
                  return (
                    <button key={f} onClick={() => setFilter(f)} style={{
                      padding: '4px 12px', borderRadius: 99, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
                      border: `1px solid ${filter === f ? 'var(--accent-primary)' : 'var(--border)'}`,
                      background: filter === f ? '#6c47ff20' : 'transparent',
                      color: filter === f ? '#a78bfa' : 'var(--text-secondary)',
                    }}>
                      {label} ({count})
                    </button>
                  );
                })}
              </div>

              {adminLoading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
              ) : (
                <div style={{ overflowX: 'auto', background: 'var(--bg-panel)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 900 }}>
                    <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                      <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>Date</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>User Info</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>Payment Info</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>Status</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => {
                        const matchesFilter = filter === 'all' ? true : u.status === filter;
                        const query = searchQuery.toLowerCase();
                        const matchesSearch = !query || 
                          u.displayName?.toLowerCase().includes(query) ||
                          u.email?.toLowerCase().includes(query) ||
                          u.phone?.toLowerCase().includes(query) ||
                          u.paymentNumber?.toLowerCase().includes(query);
                        return matchesFilter && matchesSearch;
                      }).map(u => {
                        const statusColor: Record<string, string> = { pending: '#f59e0b', active: '#22d3a0', blocked: '#ef4444' };
                        const statusLabel = u.status === 'blocked' ? 'deactivated' : u.status;
                        
                        let dateStr = 'N/A';
                        if (u.createdAt) {
                          try {
                            const d = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
                            dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                          } catch (e) {}
                        }

                        let methodColor = '#374151'; // default
                        let methodText = u.paymentMethod || 'Unknown';
                        if (methodText === 'bkash') methodColor = '#e11d48';
                        if (methodText === 'nagad') methodColor = '#ea580c';
                        if (methodText === 'rocket') methodColor = '#8b5cf6';

                        return (
                          <tr key={u.uid} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{dateStr}</td>
                            
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{u.displayName}</div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginTop: 2 }}>{u.email}</div>
                              {u.phone && <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginTop: 2 }}>{u.phone}</div>}
                            </td>
                            
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <span style={{ background: `${methodColor}20`, color: methodColor, padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                                  {methodText}
                                </span>
                              </div>
                              <div style={{ color: 'var(--text-primary)', fontSize: 12, fontFamily: "'Anek Bangla', sans-serif" }}>{u.paymentNumber || 'N/A'}</div>
                            </td>

                            <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: statusColor[u.status] || '#a0a0c0', fontSize: 12 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor[u.status] || '#a0a0c0' }} />
                                {statusLabel}
                              </span>
                            </td>
                            
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {u.status === 'pending' && (
                                  <button onClick={() => handleApprove(u.uid)} disabled={actionUid === u.uid} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: '#22d3a020', color: '#22d3a0', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                    Approve
                                  </button>
                                )}
                                {u.status !== 'blocked' && u.uid !== appUser?.uid && (
                                  <button onClick={() => handleBlock(u.uid)} disabled={actionUid === u.uid} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: '#ef444420', color: '#ef4444', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                    Deactivate
                                  </button>
                                )}
                                {u.status === 'blocked' && (
                                  <button onClick={() => handleApprove(u.uid)} disabled={actionUid === u.uid} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: '#6c47ff20', color: '#a78bfa', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                    Reactivate
                                  </button>
                                )}
                                <button onClick={() => handleResetPassword(u.email)} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: '#3b82f620', color: '#60a5fa', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                  Reset Pass
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Payment Configuration */}
            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: 16, padding: '20px', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ background: '#f59e0b20', padding: 8, borderRadius: 10, color: '#f59e0b' }}>
                  <CreditCard size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>পেমেন্ট সেটিংসে পেমেন্ট নম্বর ও মেথড</h3>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>রেজিস্ট্রেশন পেজে পেমেন্ট সংক্রান্ত তথ্য এখান থেকে ম্যানেজ করুন।</p>
                </div>
              </div>

              {/* App Version */}
              <div style={{ background: 'rgba(108,71,255,0.08)', border: '1px solid rgba(108,71,255,0.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: '#a78bfa', fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>⚡ App Version</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="1.1"
                    value={appVersion}
                    onChange={(e) => setAppVersion(e.target.value)}
                    style={{ width: '100%', fontSize: 14, fontWeight: 700, color: '#a78bfa' }}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
                  <div>ইউজারদের</div>
                  <div>অ্যাপে দেখাবে</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, display: 'block', fontWeight: 600 }}>
                    পেমেন্ট রিসিভ নম্বর (bKash/Nagad/Rocket)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="017XXXXXXXXX"
                    value={paymentNumber}
                    onChange={(e) => setPaymentNumber(e.target.value)}
                    style={{ width: '100%', fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, display: 'block', fontWeight: 600 }}>
                    পেমেন্ট অ্যামাউন্ট (৳)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="500"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    style={{ width: '100%', fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, display: 'block', fontWeight: 600 }}>
                    সক্রিয় পেমেন্ট মেথড
                  </label>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border-light)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={activeMethods.bkash}
                        onChange={(e) => setActiveMethods(prev => ({ ...prev, bkash: e.target.checked }))}
                        style={{ accentColor: '#e11d48' }}
                      />
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#e11d48' }}>bKash</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border-light)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={activeMethods.nagad}
                        onChange={(e) => setActiveMethods(prev => ({ ...prev, nagad: e.target.checked }))}
                        style={{ accentColor: '#ea580c' }}
                      />
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#ea580c' }}>Nagad</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border-light)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={activeMethods.rocket}
                        onChange={(e) => setActiveMethods(prev => ({ ...prev, rocket: e.target.checked }))}
                        style={{ accentColor: '#8b5cf6' }}
                      />
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#8b5cf6' }}>Rocket</span>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <button
                    className="btn-brand"
                    disabled={savingPaymentNumber}
                    onClick={async () => {
                      setSavingPaymentNumber(true);
                      try {
                        await savePublicSettings({ paymentNumber, paymentAmount, activeMethods, appVersion });
                        toast.success('Settings Saved!');
                      } catch (e) {
                        toast.error('Failed to save payment settings');
                      } finally {
                        setSavingPaymentNumber(false);
                      }
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' }}
                  >
                    {savingPaymentNumber ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Save size={14} />}
                    Save Payment Settings
                  </button>
                </div>
              </div>
            </div>

            {/* Admin API Keys */}
            <div style={{ marginBottom: 24, background: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: 16, padding: 20 }}>
              <ApiKeyManager
                keys={adminApiKeys}
                onSave={handleSaveAdminApiKeys}
                saving={savingAdminKeys}
                label="Global Backup Gemini API Keys"
                hint="এই Key গুলো সেসব ইউজারের জন্য কাজ করবে যারা নিজেরা Key দেননি। একাধিক Key দিলে অটোমেটিক রোটেট হবে।"
              />
            </div>

            {/* Quick Links & Support URLs */}
            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: 16, padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ExternalLink size={16} color="#a78bfa" /> সাপোর্ট ও কাস্টম লিংক সেটআপ
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                এখান থেকে সাপোর্ট সেন্টার, টিউটোরিয়াল ও কমিউনিটি লিংক পরিবর্তন করুন।
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
                {/* 1. Support Link */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ background: '#6c47ff20', color: '#a78bfa', padding: '4px 6px', borderRadius: 6, fontSize: 16 }}>💬</div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>লাইভ সাপোর্ট লিংক</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Support Center-এ "লাইভ চ্যাট সাপোর্ট" বাটনে কাজ করবে</p>
                    </div>
                  </div>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://t.me/yourusername অথবা WhatsApp লিংক"
                    value={adminSettings.whatsappLink}
                    onChange={e => setAdminSettings({ ...adminSettings, whatsappLink: e.target.value })}
                    style={{ fontSize: 13, width: '100%' }}
                  />
                  {adminSettings.whatsappLink && (
                    <p style={{ fontSize: 11, color: '#22d3a0', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={11} /> লিংক সেট: {adminSettings.whatsappLink.substring(0, 50)}...
                    </p>
                  )}
                </div>

                {/* 2. Tutorial Video Link */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ background: '#ff47a320', color: '#ff47a3', padding: '4px 6px', borderRadius: 6, fontSize: 16 }}>▶️</div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>ভিডিও টিউটোরিয়াল লিংক</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Support Center-এ "অ্যাপ কীভাবে ব্যবহার করবেন?" বাটনে কাজ করবে</p>
                    </div>
                  </div>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://youtube.com/watch?v=... অথবা Facebook Video লিংক"
                    value={adminSettings.tutorialLink}
                    onChange={e => setAdminSettings({ ...adminSettings, tutorialLink: e.target.value })}
                    style={{ fontSize: 13, width: '100%' }}
                  />
                  {adminSettings.tutorialLink && (
                    <p style={{ fontSize: 11, color: '#22d3a0', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={11} /> লিংক সেট: {adminSettings.tutorialLink.substring(0, 50)}...
                    </p>
                  )}
                </div>

                {/* 3. Community Link */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ background: '#10b98120', color: '#34d399', padding: '4px 6px', borderRadius: 6, fontSize: 16 }}>👥</div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>সিক্রেট কমিউনিটি লিংক</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Support Center-এ "সিক্রেট কমিউনিটিতে যুক্ত হন" বাটনে কাজ করবে</p>
                    </div>
                  </div>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://chat.whatsapp.com/... অথবা Facebook Group লিংক"
                    value={adminSettings.communityLink}
                    onChange={e => setAdminSettings({ ...adminSettings, communityLink: e.target.value })}
                    style={{ fontSize: 13, width: '100%' }}
                  />
                  {adminSettings.communityLink && (
                    <p style={{ fontSize: 11, color: '#22d3a0', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={11} /> লিংক সেট: {adminSettings.communityLink.substring(0, 50)}...
                    </p>
                  )}
                </div>

                {/* 4. WhatsApp Number */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ background: '#10b98120', color: '#34d399', padding: '4px 6px', borderRadius: 6, fontSize: 16 }}>📱</div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>WhatsApp নম্বর</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Support Center-এ "সরাসরি WhatsApp এ যোগাযোগ" বাটনে কাজ করবে</p>
                    </div>
                  </div>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="+8801700000000"
                    value={adminSettings.whatsappLink}
                    onChange={e => setAdminSettings({ ...adminSettings, whatsappLink: e.target.value })}
                    style={{ fontSize: 13, width: '100%' }}
                  />
                  {adminSettings.whatsappLink && (
                    <p style={{ fontSize: 11, color: '#22d3a0', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={11} /> Auto-link: {adminSettings.whatsappLink}
                    </p>
                  )}
                </div>

                {/* 5. Website Link */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ background: '#3b82f620', color: '#60a5fa', padding: '4px 6px', borderRadius: 6, fontSize: 16 }}>🌐</div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>ওয়েবসাইট লিংক</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Support Center-এ "ওয়েবসাইট ভিজিট করুন" বাটনে কাজ করবে</p>
                    </div>
                  </div>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://yourwebsite.com"
                    value={adminSettings.websiteLink}
                    onChange={e => setAdminSettings({ ...adminSettings, websiteLink: e.target.value })}
                    style={{ fontSize: 13, width: '100%' }}
                  />
                  {adminSettings.websiteLink && (
                    <p style={{ fontSize: 11, color: '#22d3a0', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={11} /> লিংক সেট: {adminSettings.websiteLink}
                    </p>
                  )}
                </div>

                {/* 6. Gemini API Key Link */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ background: '#a78bfa20', color: '#a78bfa', padding: '4px 6px', borderRadius: 6, fontSize: 16 }}>🔑</div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>API Key তৈরির লিংক</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>ইউজারের Settings-এ "API key তৈরি করতে এখানে ক্লিক করুন" লেখায় কাজ করবে</p>
                    </div>
                  </div>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://aistudio.google.com/app/apikey অথবা ভিডিও লিংক"
                    value={adminSettings.geminiApiKeyLink}
                    onChange={e => setAdminSettings({ ...adminSettings, geminiApiKeyLink: e.target.value })}
                    style={{ fontSize: 13, width: '100%' }}
                  />
                  {adminSettings.geminiApiKeyLink && (
                    <p style={{ fontSize: 11, color: '#22d3a0', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={11} /> লিংক সেট: {adminSettings.geminiApiKeyLink}
                    </p>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <button
                className="btn-brand"
                onClick={handleSaveAdminLinks}
                disabled={savingAdminLinks}
                style={{ width: '100%', padding: '14px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12 }}
              >
                {savingAdminLinks ? (
                  <><div className="spinner" style={{ width: 16, height: 16 }} /> সেভ হচ্ছে...</>
                ) : (
                  <><Check size={16} /> সব লিংক সেভ করুন — সাথে সাথে আপডেট হবে</>
                )}
              </button>
            </div>

            </motion.div>
        ) : null}
      </div>

      <div className="nav-container">
        <div className="sidebar-header" style={{
          display: 'flex', flexDirection: 'column', padding: '20px 16px 16px',
          borderBottom: '1px solid var(--border)', marginBottom: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <img src="/logo.png" alt="Smart Video AI" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', boxShadow: '0 2px 10px rgba(108,71,255,0.4)' }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>SmartVideo.AI</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={handleThemeToggle} title={"Theme: " + theme} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 6, borderRadius: 8, transition: 'all 0.2s' }}>
              {theme === 'light' ? <Sun size={16} /> : theme === 'dark' ? <Moon size={16} /> : <Monitor size={16} />}
            </button>
            <button onClick={() => setShowSupport(true)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 6, borderRadius: 8 }}>
              <Headphones size={16} />
            </button>
            <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 6, borderRadius: 8 }}>
              <SettingsIcon size={16} />
            </button>
            <button onClick={() => setShowChannelPrompt(true)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 6, borderRadius: 8 }}>
              <User size={16} />
            </button>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 6, borderRadius: 8, marginLeft: 'auto' }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
        <div className="nav-inner">
          {[
            { tab: 'agent', icon: <Grid size={20} />, label: 'এজেন্ট' },
            { tab: 'story', icon: <Film size={20} />, label: 'স্টোরি ভিডিও' },
            { tab: 'audio', icon: <Mic size={20} />, label: 'অডিও' },
            ...(appUser?.role === 'admin' ? [{ tab: 'admin', icon: <Shield size={20} />, label: 'এডমিন' }] : []),
          ].map(({ tab, icon, label }) => (
            <button
              key={tab}
              onClick={() => {
                if (tab === 'story') navigate('/story-video');
                else setActiveTab(tab as any);
              }}
              className={"nav-item " + (activeTab === tab ? 'active' : '')}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--bg-secondary)', width: '100%', maxWidth: 520, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '24px 24px 40px', borderTop: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SettingsIcon size={18} /> Settings
                </h2>
                <button onClick={() => setShowSettings(false)} style={{ background: 'var(--bg-overlay-10)', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <X size={16} />
                </button>
              </div>

              {/* User API Keys */}
              <div style={{ marginBottom: 24, background: 'var(--bg-overlay-5)', padding: 16, borderRadius: 14, border: '1px solid var(--border)' }}>
                <ApiKeyManager
                  keys={userApiKeys}
                  onSave={handleSaveUserApiKeys}
                  saving={savingUserKeys}
                  label="API Keys"
                  hint="একাধিক API Key দিলে নিজে থেকেই Rotate হবে। Quota শেষ হলে নতুন Key ট্রাই করবে।"
                />
                <a href={supportLinks.geminiApiKeyLink || 'https://aistudio.google.com/app/apikey'} target="_blank" rel="noreferrer" style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 12, padding: '12px 16px',
                  textDecoration: 'none', color: 'var(--text-primary)', marginTop: 24, transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, background: '#3b82f630', color: '#60a5fa', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Key size={18} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>এপি ! "ি তরি করতে! এান! "্লি" করুন</span>
                  </div>
                  <ExternalLink size={18} color="#60a5fa" />
                </a>
              </div>

              {/* User Info + Logout */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}>
                    {appUser?.displayName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700 }}>{appUser?.displayName}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{appUser?.email}</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="btn-outline" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderColor: '#ef444450', color: '#ef4444' }}>
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <AnimatePresence>
        {showChannelPrompt && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: 'var(--bg-panel)', width: '100%', maxWidth: 400, borderRadius: 24, padding: 32, border: '1px solid var(--border-light)', textAlign: 'center' }}
            >
              <div style={{ width: 64, height: 64, background: '#4f46e520', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#818cf8' }}>
                <MonitorPlay size={32} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 12 }}>আপনার চ্যানেলের নাম দিন</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
                ড্যাশবোর্ড পার্সোনালাইজ করতে চ্যানেলের নাম সেট করুন।
              </p>
              <input
                className="input-field"
                placeholder="যেমন: Tech Bangla, My Vlog..."
                value={tempChannelName}
                onChange={e => setTempChannelName(e.target.value)}
                style={{ width: '100%', marginBottom: 16, textAlign: 'center', fontSize: 16 }}
              />
              <div style={{ display: 'flex', gap: 12 }}>
                {channelName && (
                  <button onClick={() => setShowChannelPrompt(false)} style={{ flex: 1, padding: 14, borderRadius: 12, background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>
                    বাতিল
                  </button>
                )}
                <button
                  onClick={handleSaveChannel}
                  disabled={savingChannel || !tempChannelName.trim()}
                  className="btn-brand pulse-glow"
                  style={{ flex: 2, padding: 14, borderRadius: 12, fontWeight: 700, fontSize: 15 }}
                >
                  {savingChannel ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Support Modal */}
      <AnimatePresence>
        {showSupport && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
            zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }} onClick={() => setShowSupport(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: 24, width: '100%', maxWidth: 450, overflow: 'hidden' }}
            >
              <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: '#6c47ff20', padding: 10, borderRadius: 12, color: '#a78bfa' }}>
                    <Headphones size={24} />
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>সাপোর্ট সেন্টার</h2>
                </div>
                <button onClick={() => setShowSupport(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '70vh', overflowY: 'auto' }}>
                {[
                  { href: supportLinks.appUpdateLink, icon: <Smartphone size={24} />, color: '#3b82f620', iconColor: '#60a5fa', title: 'ম9বা!ল &্যাপস !ন্সxল/ পড!x', desc: 'সর্বশ!ষ ফিaার!র Sন্য  পড!x রাুন' },
                  { href: supportLinks.tutorialLink, icon: <PlayCircle size={24} />, color: '#4c1d9510', iconColor: '#f472b6', title: 'ভিডি xি0x9রিয়াল x}', desc: 'ধাপ! ধাপ! শিুন এব Expert হন!' },
                  { href: supportLinks.communityLink, icon: <MessageCircle size={24} />, color: '#10b98115', iconColor: '#34d399', title: 'সি"্র!x "মি0নিxি', desc: 'স"ল  পড!x  ন9xিফি"!শন প!ত! যু"্ত থা"ুন' },
                  { href: supportLinks.whatsappLink, icon: <Headphones size={24} />, color: '#10b98115', iconColor: '#34d399', title: 'WhatsApp সাপোর্ট', desc: 'সরাসরি সাপোর্ট টিমের সাথে কথা বলুন' },
                  { href: supportLinks.websiteLink, icon: <Globe size={24} />, color: '#3b82f620', iconColor: '#60a5fa', title: 'য়!বসা!x ভিSিx', desc: ' র বিস্তারিত Sানুন' },
                ].map(({ href, icon, color, iconColor, title, desc }) => (
                  <a key={title} href={href || '#'} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                    <div style={{ background: color, border: '1px solid var(--border)', borderRadius: 16, padding: '16px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
                      <div style={{ background: `${iconColor}25`, color: iconColor, padding: 12, borderRadius: 12 }}>{icon}</div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{title}</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{desc}</p>
                      </div>
                      <Globe size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
