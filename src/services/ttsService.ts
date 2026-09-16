/**
 * ══════════════════════════════════════════════════════════════
 *  Smart Video AI — TTS Service
 *  • Gemini Flash TTS API integration
 *  • PCM (raw 24kHz/16-bit/mono) -> WAV conversion (client-side)
 *  • WAV file download
 * ══════════════════════════════════════════════════════════════
 */

// TTS Model — update here if Google changes the name
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  tone: string;
  bestFor: string;
  color: string;
  emoji: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'Puck',   name: 'Puck',   description: 'এনার্জেটিক ও উজ্জ্বল',    tone: 'Upbeat',        bestFor: 'প্রমোশনাল, ফানি ভিডিও',          color: '#f59e0b', emoji: 'bolt' },
  { id: 'Charon', name: 'Charon', description: 'গভীর ও কর্তৃত্বশীল',     tone: 'Authoritative', bestFor: 'ইনফরমেটিভ, টেক ভিডিও',           color: '#3b82f6', emoji: 'mic' },
  { id: 'Kore',   name: 'Kore',   description: 'উষ্ণ ও স্পষ্ট',          tone: 'Warm',          bestFor: 'শিক্ষামূলক, টিউটোরিয়াল',         color: '#10b981', emoji: 'star' },
  { id: 'Fenrir', name: 'Fenrir', description: 'শক্তিশালী ও ড্রামাটিক', tone: 'Dramatic',      bestFor: 'মোটিভেশনাল, স্টোরি',              color: '#8b5cf6', emoji: 'fire' },
  { id: 'Aoede',  name: 'Aoede',  description: 'নরম ও প্রশান্ত',          tone: 'Calm',          bestFor: 'ASMR, মেডিটেশন',                 color: '#ec4899', emoji: 'moon' },
];

export type SpeechSpeed = 'slow' | 'normal' | 'fast';
export type SpeechMood  = 'normal' | 'excited' | 'calm' | 'dramatic';

export interface TtsRequest {
  script:     string;
  voiceId:    string;
  speed:      SpeechSpeed;
  mood:       SpeechMood;
  primaryKey?: string;
  allKeys?:   string[];
}

// Build director-style prompt
function buildTtsPrompt(script: string, speed: SpeechSpeed, mood: SpeechMood): string {
  const speedMap: Record<SpeechSpeed, string> = {
    slow:   'Speak slowly and clearly, with deliberate pacing.',
    normal: 'Speak at a natural, conversational pace.',
    fast:   'Speak energetically with a faster pace.',
  };
  const moodMap: Record<SpeechMood, string> = {
    normal:   'Use a natural, neutral tone.',
    excited:  'Sound enthusiastic and energized, with rising inflections.',
    calm:     'Speak gently and soothingly, like a meditation guide.',
    dramatic: 'Use expressive, dramatic delivery with impactful pauses.',
  };
  return `${speedMap[speed]} ${moodMap[mood]}\n\n${script}`;
}

// PCM -> WAV: Gemini TTS returns raw 24kHz/16-bit/mono PCM (base64).
// We prepend a standard 44-byte WAV header so browsers can play it.
function pcmToWav(pcmBase64: string): ArrayBuffer {
  const pcmBytes   = Uint8Array.from(atob(pcmBase64), c => c.charCodeAt(0));
  const sampleRate = 24000;
  const numCh      = 1;
  const bits       = 16;
  const byteRate   = (sampleRate * numCh * bits) / 8;
  const blockAlign = (numCh * bits) / 8;
  const dataSize   = pcmBytes.byteLength;
  const buf        = new ArrayBuffer(44 + dataSize);
  const v          = new DataView(buf);

  const ws = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) v.setUint8(offset + i, str.charCodeAt(i));
  };

  ws(0,  'RIFF');
  v.setUint32(4,  36 + dataSize, true);
  ws(8,  'WAVE');
  ws(12, 'fmt ');
  v.setUint32(16, 16,          true);
  v.setUint16(20, 1,           true); // PCM
  v.setUint16(22, numCh,       true);
  v.setUint32(24, sampleRate,  true);
  v.setUint32(28, byteRate,    true);
  v.setUint16(32, blockAlign,  true);
  v.setUint16(34, bits,        true);
  ws(36, 'data');
  v.setUint32(40, dataSize,    true);
  new Uint8Array(buf, 44).set(pcmBytes);
  return buf;
}

// Main TTS API call
export async function generateSpeech(req: TtsRequest): Promise<ArrayBuffer> {
  const { script, voiceId, speed, mood, primaryKey, allKeys = [] } = req;

  let keys = allKeys.map(k => k?.trim()).filter(Boolean) as string[];
  if (primaryKey?.trim()) {
    keys = Array.from(new Set([primaryKey.trim(), ...keys]));
  } else {
    keys = Array.from(new Set(keys));
  }
  if (keys.length === 0) throw new Error('API_KEY_MISSING');

  const body = {
    contents: [{ parts: [{ text: buildTtsPrompt(script, speed, mood) }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceId } },
      },
    },
  };

  let lastError = '';

  for (const key of keys) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${key}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg    = (errData as any)?.error?.message || `HTTP ${res.status}`;
        const lower  = msg.toLowerCase();

        if (res.status === 429 || lower.includes('quota') || lower.includes('resource_exhausted')) {
          lastError = 'QUOTA_EXCEEDED'; continue;
        }
        if (res.status === 400 && (lower.includes('api key') || lower.includes('invalid'))) {
          lastError = 'INVALID_API_KEY'; continue;
        }
        if (res.status === 404 || lower.includes('not found')) {
          throw new Error(`TTS মডেল (${TTS_MODEL}) এই API Key-এ সাপোর্টেড নয়।`);
        }
        lastError = msg; continue;
      }

      const data  = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts as any[] | undefined;
      if (!parts?.length) { lastError = 'Empty response from TTS model'; continue; }

      const audioPart = parts.find(p => p?.inlineData?.mimeType?.startsWith('audio/'));
      if (!audioPart?.inlineData?.data) { lastError = 'No audio data in response'; continue; }

      return pcmToWav(audioPart.inlineData.data);
    } catch (err: any) {
      const msg = err?.message || '';
      // Re-throw our own descriptive errors
      if (msg.includes('TTS মডেল') || msg === 'API_KEY_MISSING') throw err;
      lastError = msg || 'Network error';
    }
  }

  if (lastError === 'QUOTA_EXCEEDED')   throw new Error('QUOTA_EXCEEDED');
  if (lastError === 'INVALID_API_KEY')  throw new Error('INVALID_API_KEY');
  throw new Error(lastError || 'TTS generation failed. Please try again.');
}

// Download WAV file
export function downloadWav(wavBuffer: ArrayBuffer, filename = 'voiceover.wav') {
  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Create playable blob URL
export function createAudioBlobUrl(wavBuffer: ArrayBuffer): string {
  return URL.createObjectURL(new Blob([wavBuffer], { type: 'audio/wav' }));
}
