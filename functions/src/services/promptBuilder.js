// ── Master Prompt Builder for Smart Video AI ──────────────────────────────
// Builds a comprehensive prompt that produces structured JSON output

const SYSTEM_PROMPT = `You are "Smart Video AI Engine" — a world-class AI Content Strategist specializing in Bangladeshi YouTube, TikTok, and Facebook content creators.

Your role: Analyze the user's video topic and generate a COMPLETE viral content package.

STRICT RULES:
1. Always respond in valid JSON format (no markdown, no code blocks)
2. Match the requested language EXACTLY (Bangla/English/Banglish)
3. Titles must trigger EMOTION — use curiosity gaps, shock, FOMO, authority
4. All outputs must be Bangladesh-audience optimized
5. Viral Score must be calculated based on real SEO principles
6. Thumbnail strategy must be cinematic and CTR-optimized`;

export function buildPrompt(topic, language, contentType) {
  const langInstruction = {
    bangla: 'সম্পূর্ণ বাংলায় লিখুন (Bengali script)। কোনো English word ব্যবহার করবেন না।',
    english: 'Write entirely in English. Optimize for global audience but keep Bangladesh context.',
    banglish: 'Write in Banglish (Bengali words in English letters). Example: "Freelancing kore ki income hoy?"',
  };

  const typeContext = {
    long: 'Long-form YouTube video (8-15 minutes). Needs strong hook, mid-roll retention, and end CTA.',
    shorts: 'YouTube Shorts (30-60 seconds). Ultra-punchy, immediate hook, fast-paced.',
    tiktok: 'TikTok video (15-60 seconds). Trendy, relatable, Gen-Z friendly tone.',
    reel: 'Facebook/Instagram Reel (30-90 seconds). Shareable, emotional, community-driven.',
  };

  return `${SYSTEM_PROMPT}

USER REQUEST:
- Topic: "${topic}"
- Language: ${language} — ${langInstruction[language] || langInstruction.bangla}
- Content Type: ${contentType} — ${typeContext[contentType] || typeContext.long}

Generate the following JSON structure EXACTLY:
{
  "titles": [
    {"text": "title text here", "emotionTag": "emotion type like Fear+Curiosity"}
  ],
  "description": "full SEO description with timestamps, CTAs, hashtags (300+ words)",
  "tags": ["tag1", "tag2", ... up to 25-30 tags],
  "thumbnailStrategy": "detailed visual direction for thumbnail designer",
  "thumbnailPrompt": "copy-paste ready AI image generation prompt for Midjourney/DALL-E",
  "typography": {
    "headline": "main text for thumbnail",
    "supportingText": "secondary text",
    "fontWeight": "recommended font weight",
    "textColor": "hex color with effect description",
    "glowEffect": "CSS text-shadow value",
    "textPosition": "position on thumbnail"
  },
  "viralScore": {
    "overall": 0-100,
    "ctrProbability": 0-100,
    "emotionalTrigger": 0-100,
    "seoStrength": 0-100,
    "curiosityGap": 0-100,
    "competitionDifficulty": 0-100,
    "label": "Low|Medium|High|Explosive"
  },
  "contentStrategy": {
    "bestHook": "exact opening line for first 5 seconds",
    "uploadTime": "best day and time for Bangladesh audience",
    "suggestedCTA": "call-to-action with timing",
    "videoStructure": "Hook → Problem → Content → CTA format",
    "shortsRepurposeIdea": "how to repurpose as Shorts/Reel"
  }
}

IMPORTANT:
- Generate exactly 5 title variants with different emotion tags
- Tags must include both Bangla and English keywords
- Viral Score "overall" should be weighted: CTR 35% + Emotion 20% + SEO 20% + Curiosity 15% + Competition 10%
- Competition score: lower = easier = better for creator
- Be specific, actionable, and creative. No generic advice.`;
}
