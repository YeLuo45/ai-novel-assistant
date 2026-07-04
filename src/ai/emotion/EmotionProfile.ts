/**
 * EmotionProfile.ts — Direction AG, V3286-V3295 (Batch 1/3)
 * Emotional Arc Mapper: 情绪画像 + 强度分析
 *
 * 10 engines:
 * 1.  EmotionProfile — 角色情绪画像
 * 2.  EmotionIntensity — 情绪强度分析
 * 3.  EmotionWordCounter — 情绪词计数
 * 4.  EmotionTypeDistribution — 情绪类型分布
 * 5.  EmotionalValence — 情绪效价
 * 6.  EmotionalArousal — 情绪唤醒度
 * 7.  EmotionDuration — 情绪持续时间
 * 8.  EmotionTransition — 情绪转换
 * 9.  EmotionalPeakDetector — 情绪峰值检测
 * 10. EmotionProfileIndex — 收口
 *
 * 灵感：情感计算 / reader engagement 前置 / 共情曲线
 */

import type { Chapter } from '../pacing/StructureTemplates';

// ============================================================================
// Engine 1: EmotionProfile
// ============================================================================

export interface CharacterEmotion {
  character: string;
  chapter: number;
  emotion: 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'love' | 'neutral';
  intensity: number; // 0-1
}

export class EmotionProfile {
  private _profiles = new Map<string, CharacterEmotion[]>();

  record(character: string, chapter: number, emotion: CharacterEmotion['emotion'], intensity: number): void {
    if (!this._profiles.has(character)) this._profiles.set(character, []);
    this._profiles.get(character)!.push({ character, chapter, emotion, intensity: Math.max(0, Math.min(1, intensity)) });
  }

  getProfile(character: string): CharacterEmotion[] {
    return this._profiles.get(character) || [];
  }

  dominantEmotion(character: string): CharacterEmotion['emotion'] {
    const profile = this.getProfile(character);
    if (profile.length === 0) return 'neutral';
    const counts: Record<string, number> = {};
    for (const p of profile) {
      counts[p.emotion] = (counts[p.emotion] || 0) + p.intensity;
    }
    let best: CharacterEmotion['emotion'] = 'neutral';
    let max = 0;
    for (const k of Object.keys(counts)) {
      if (counts[k] > max) {
        max = counts[k];
        best = k as CharacterEmotion['emotion'];
      }
    }
    return best;
  }
}

// ============================================================================
// Engine 2: EmotionIntensity
// ============================================================================

export class EmotionIntensity {
  private _intensityKeywords: Record<'low' | 'medium' | 'high', string[]> = {
    low: ['微微', '略', '有点', '稍微', 'slightly', 'a bit', 'somewhat'],
    medium: ['很', '十分', '相当', 'quite', 'fairly', 'rather'],
    high: ['极其', '非常', '极度', '无比', 'extremely', 'incredibly', 'overwhelmingly'],
  };

  classify(text: string): 'low' | 'medium' | 'high' {
    const lower = text.toLowerCase();
    if (this._intensityKeywords.high.some((k) => lower.includes(k.toLowerCase()))) return 'high';
    if (this._intensityKeywords.medium.some((k) => lower.includes(k.toLowerCase()))) return 'medium';
    if (this._intensityKeywords.low.some((k) => lower.includes(k.toLowerCase()))) return 'low';
    return 'medium';
  }

  score(text: string): number {
    const c = this.classify(text);
    return c === 'high' ? 1 : c === 'medium' ? 0.5 : 0.2;
  }
}

// ============================================================================
// Engine 3: EmotionWordCounter
// ============================================================================

export class EmotionWordCounter {
  private _lexicon: Record<CharacterEmotion['emotion'], string[]> = {
    joy: ['开心', '高兴', '快乐', '笑', 'happy', 'joy', 'laugh', 'delighted'],
    sadness: ['伤心', '悲伤', '哭', '泪', 'sad', 'cry', 'tears', 'grief'],
    anger: ['怒', '恨', '气', '愤怒', 'angry', 'hate', 'furious', 'rage'],
    fear: ['怕', '恐惧', '担心', '害怕', 'afraid', 'fear', 'scared', 'anxious'],
    surprise: ['惊', '意外', '突然', '竟然', 'surprise', 'shock', 'amazed'],
    disgust: ['恶', '讨厌', '恶心', 'disgust', 'hate', 'loathe'],
    love: ['爱', '喜欢', '思念', 'love', 'affection', 'miss'],
    neutral: [],
  };

  countByEmotion(text: string): Record<CharacterEmotion['emotion'], number> {
    const lower = text.toLowerCase();
    const counts: Record<CharacterEmotion['emotion'], number> = {
      joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0, love: 0, neutral: 0,
    };
    for (const [emotion, words] of Object.entries(this._lexicon)) {
      for (const w of words) {
        const re = new RegExp(w.toLowerCase(), 'g');
        const m = lower.match(re);
        if (m) counts[emotion as CharacterEmotion['emotion']] += m.length;
      }
    }
    return counts;
  }

  totalEmotionWords(text: string): number {
    const c = this.countByEmotion(text);
    return Object.values(c).reduce((s, n) => s + n, 0);
  }
}

// ============================================================================
// Engine 4: EmotionTypeDistribution
// ============================================================================

export class EmotionTypeDistribution {
  distribution(text: string): Record<CharacterEmotion['emotion'], number> {
    const counter = new EmotionWordCounter();
    return counter.countByEmotion(text);
  }

  dominantType(text: string): CharacterEmotion['emotion'] {
    const dist = this.distribution(text);
    let best: CharacterEmotion['emotion'] = 'neutral';
    let max = 0;
    for (const k of Object.keys(dist) as CharacterEmotion['emotion'][]) {
      if (dist[k] > max) {
        max = dist[k];
        best = k;
      }
    }
    return best;
  }
}

// ============================================================================
// Engine 5: EmotionalValence
// ============================================================================

export class EmotionalValence {
  // Positive: joy, love, surprise(generally positive)
  // Negative: sadness, anger, fear, disgust
  compute(text: string): number {
    const counter = new EmotionWordCounter();
    const c = counter.countByEmotion(text);
    const positive = c.joy + c.love + c.surprise * 0.5;
    const negative = c.sadness + c.anger + c.fear + c.disgust;
    const total = positive + negative;
    return total === 0 ? 0 : (positive - negative) / total;
  }

  classify(valence: number): 'positive' | 'negative' | 'neutral' {
    if (valence > 0.2) return 'positive';
    if (valence < -0.2) return 'negative';
    return 'neutral';
  }
}

// ============================================================================
// Engine 6: EmotionalArousal
// ============================================================================

export class EmotionalArousal {
  // High arousal: anger, fear, surprise
  // Low arousal: sadness, joy
  compute(text: string): number {
    const counter = new EmotionWordCounter();
    const c = counter.countByEmotion(text);
    const high = c.anger + c.fear + c.surprise;
    const low = c.sadness + c.joy;
    const total = high + low;
    return total === 0 ? 0.5 : high / total;
  }

  classify(arousal: number): 'high' | 'low' | 'medium' {
    if (arousal > 0.7) return 'high';
    if (arousal < 0.3) return 'low';
    return 'medium';
  }
}

// ============================================================================
// Engine 7: EmotionDuration
// ============================================================================

export class EmotionDuration {
  trackDuration(profile: CharacterEmotion[]): Map<string, number> {
    const durations = new Map<string, number>();
    let currentEmotion: string | null = null;
    let count = 0;
    for (const p of profile) {
      if (p.emotion === currentEmotion) {
        count += 1;
      } else {
        if (currentEmotion) {
          durations.set(currentEmotion, (durations.get(currentEmotion) || 0) + count);
        }
        currentEmotion = p.emotion;
        count = 1;
      }
    }
    if (currentEmotion) durations.set(currentEmotion, (durations.get(currentEmotion) || 0) + count);
    return durations;
  }

  isStagnant(profile: CharacterEmotion[], threshold = 10): boolean {
    return profile.length === 0 || (profile[profile.length - 1].chapter - profile[0].chapter) > threshold;
  }
}

// ============================================================================
// Engine 8: EmotionTransition
// ============================================================================

export class EmotionTransition {
  detect(profile: CharacterEmotion[]): { from: string; to: string; chapter: number }[] {
    const transitions: { from: string; to: string; chapter: number }[] = [];
    for (let i = 1; i < profile.length; i++) {
      if (profile[i].emotion !== profile[i - 1].emotion) {
        transitions.push({
          from: profile[i - 1].emotion,
          to: profile[i].emotion,
          chapter: profile[i].chapter,
        });
      }
    }
    return transitions;
  }

  countTransitions(profile: CharacterEmotion[]): number {
    return this.detect(profile).length;
  }

  isVolatile(profile: CharacterEmotion[]): boolean {
    return this.countTransitions(profile) > profile.length / 2;
  }
}

// ============================================================================
// Engine 9: EmotionalPeakDetector
// ============================================================================

export class EmotionalPeakDetector {
  findPeaks(profile: CharacterEmotion[]): { chapter: number; emotion: string; intensity: number }[] {
    return profile
      .filter((p) => p.intensity >= 0.8)
      .map((p) => ({ chapter: p.chapter, emotion: p.emotion, intensity: p.intensity }));
  }

  countPeaks(profile: CharacterEmotion[]): number {
    return this.findPeaks(profile).length;
  }

  hasCatharticPeak(profile: CharacterEmotion[]): boolean {
    const peaks = this.findPeaks(profile);
    return peaks.some((p) => p.intensity >= 0.95);
  }
}

// ============================================================================
// Engine 10: EmotionProfileIndex
// ============================================================================

export class EmotionProfileIndex {
  list(): string[] {
    return [
      'EmotionProfile', 'EmotionIntensity', 'EmotionWordCounter',
      'EmotionTypeDistribution', 'EmotionalValence', 'EmotionalArousal',
      'EmotionDuration', 'EmotionTransition', 'EmotionalPeakDetector',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AG_BATCH_1_ENGINES = {
  EmotionProfile,
  EmotionIntensity,
  EmotionWordCounter,
  EmotionTypeDistribution,
  EmotionalValence,
  EmotionalArousal,
  EmotionDuration,
  EmotionTransition,
  EmotionalPeakDetector,
  EmotionProfileIndex,
} as const;

export type { Chapter };
