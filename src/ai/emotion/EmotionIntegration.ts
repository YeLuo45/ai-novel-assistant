/**
 * EmotionIntegration.ts — Direction AG, V3306-V3315 (Batch 3/3 收口)
 * Emotional Arc Mapper: 集成 + 收口
 *
 * 10 engines:
 * 1.  FullStoryEmotionAnalyzer — 全文情绪分析
 * 2.  PerChapterEmotionDistribution — 每章情绪分布
 * 3.  EmotionalPacingAdvisor — 情绪节奏建议
 * 4.  ConflictEmotionTracker — 冲突情绪追踪
 * 5.  ResolutionEmotionTracker — 解决情绪追踪
 * 6.  ReaderDropEmotionPredictor — 弃文情绪预测
 * 7.  BingeEmotionPredictor — 暴读情绪预测
 * 8.  GenreEmotionProfile — 类型情绪画像
 * 9.  EmotionChapterSummary — 章节情绪摘要
 * 10. EmotionArcIndexFinal — 28 engines 收口
 *
 * 灵感：共情曲线 / 留存分析
 */

import type { Chapter } from '../pacing/StructureTemplates';
import type { CharacterEmotion } from './EmotionProfile';

// ============================================================================
// Engine 1: FullStoryEmotionAnalyzer
// ============================================================================

export class FullStoryEmotionAnalyzer {
  analyze(chapters: Chapter[]): { avgIntensity: number; dominant: string; peaks: number } {
    let total = 0;
    let count = 0;
    const counts: Record<string, number> = { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0, love: 0, neutral: 0 };
    for (const c of chapters) {
      const text = c.content || '';
      for (const emotion of Object.keys(counts)) {
        if (text.includes(emotion)) counts[emotion] += 1;
      }
      total += text.length;
      count += 1;
    }
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
    return {
      avgIntensity: count > 0 ? total / count / 100 : 0,
      dominant,
      peaks: Object.values(counts).reduce((s, n) => s + n, 0),
    };
  }
}

// ============================================================================
// Engine 2: PerChapterEmotionDistribution
// ============================================================================

export class PerChapterEmotionDistribution {
  build(chapters: Chapter[]): { chapter: number; emotion: string }[] {
    return chapters.map((c, i) => {
      const text = c.content || '';
      const emotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'love'];
      const found = emotions.find((e) => text.includes(e)) || 'neutral';
      return { chapter: i, emotion: found };
    });
  }

  isConsistent(distribution: { chapter: number; emotion: string }[]): boolean {
    return distribution.length > 0 && distribution.every((d) => d.emotion !== '');
  }
}

// ============================================================================
// Engine 3: EmotionalPacingAdvisor
// ============================================================================

export class EmotionalPacingAdvisor {
  recommend(profile: CharacterEmotion[]): { addJoy: boolean; addTension: boolean; addCatharsis: boolean } {
    const last = profile[profile.length - 1];
    if (!last) return { addJoy: false, addTension: false, addCatharsis: false };
    return {
      addJoy: last.emotion === 'sadness' || last.emotion === 'fear',
      addTension: last.emotion === 'joy' && profile.length > 5,
      addCatharsis: last.intensity > 0.9,
    };
  }
}

// ============================================================================
// Engine 4: ConflictEmotionTracker
// ============================================================================

export class ConflictEmotionTracker {
  private _conflictEmotions: { chapter: number; emotion: string }[] = [];

  record(chapter: number, emotion: string): void {
    this._conflictEmotions.push({ chapter, emotion });
  }

  getCountByEmotion(emotion: string): number {
    return this._conflictEmotions.filter((c) => c.emotion === emotion).length;
  }

  isConflictHeavy(threshold = 5): boolean {
    return this._conflictEmotions.length >= threshold;
  }
}

// ============================================================================
// Engine 5: ResolutionEmotionTracker
// ============================================================================

export class ResolutionEmotionTracker {
  private _resolutions: { chapter: number; emotion: string }[] = [];

  record(chapter: number, emotion: string): void {
    this._resolutions.push({ chapter, emotion });
  }

  getAll(): { chapter: number; emotion: string }[] {
    return [...this._resolutions];
  }

  hasResolution(): boolean {
    return this._resolutions.some((r) => r.emotion === 'joy' || r.emotion === 'love');
  }
}

// ============================================================================
// Engine 6: ReaderDropEmotionPredictor
// ============================================================================

export class ReaderDropEmotionPredictor {
  predict(profile: CharacterEmotion[]): { riskChapters: number[]; riskScore: number } {
    const riskChapters: number[] = [];
    let totalRisk = 0;
    for (let i = 0; i < profile.length; i++) {
      // Sadness/fear sustained = risk
      if (profile[i].emotion === 'sadness' || profile[i].emotion === 'fear') {
        if (i >= 3 && (profile[i - 1].emotion === profile[i].emotion && profile[i - 2].emotion === profile[i].emotion)) {
          riskChapters.push(profile[i].chapter);
          totalRisk += 1;
        }
      }
    }
    return { riskChapters, riskScore: Math.min(1, totalRisk / 5) };
  }

  isHighRisk(riskScore: number, threshold = 0.5): boolean {
    return riskScore >= threshold;
  }
}

// ============================================================================
// Engine 7: BingeEmotionPredictor
// ============================================================================

export class BingeEmotionPredictor {
  predict(profile: CharacterEmotion[]): { bingeChapters: number[]; bingeScore: number } {
    const bingeChapters: number[] = [];
    for (let i = 0; i < profile.length; i++) {
      if (profile[i].emotion === 'joy' || profile[i].emotion === 'surprise') {
        if (profile[i].intensity > 0.7) bingeChapters.push(profile[i].chapter);
      }
    }
    return { bingeChapters, bingeScore: Math.min(1, bingeChapters.length / 5) };
  }

  isBingeWorthy(bingeScore: number, threshold = 0.4): boolean {
    return bingeScore >= threshold;
  }
}

// ============================================================================
// Engine 8: GenreEmotionProfile
// ============================================================================

export class GenreEmotionProfile {
  private _profiles: Record<string, { joy: number; sadness: number; tension: number }> = {
    romance: { joy: 0.5, sadness: 0.3, tension: 0.2 },
    mystery: { joy: 0.1, sadness: 0.2, tension: 0.7 },
    horror: { joy: 0.05, sadness: 0.3, tension: 0.65 },
    adventure: { joy: 0.4, sadness: 0.1, tension: 0.5 },
  };

  getProfile(genre: string): { joy: number; sadness: number; tension: number } | null {
    return this._profiles[genre] || null;
  }

  matches(genre: string, profile: CharacterEmotion[]): number {
    const target = this.getProfile(genre);
    if (!target) return 0;
    let total = 0;
    for (const p of profile) {
      if (p.emotion === 'joy') total += target.joy;
      else if (p.emotion === 'sadness') total += target.sadness;
      else if (p.emotion === 'fear' || p.emotion === 'anger') total += target.tension;
    }
    return profile.length > 0 ? total / profile.length : 0;
  }
}

// ============================================================================
// Engine 9: EmotionChapterSummary
// ============================================================================

export class EmotionChapterSummary {
  summarize(profile: CharacterEmotion[]): string {
    if (profile.length === 0) return 'No emotional data';
    const emotionCounts: Record<string, number> = {};
    for (const p of profile) {
      emotionCounts[p.emotion] = (emotionCounts[p.emotion] || 0) + 1;
    }
    const sorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
    return `Top emotions: ${sorted.slice(0, 3).map(([e, c]) => `${e}(${c})`).join(', ')}`;
  }
}

// ============================================================================
// Engine 10: EmotionArcIndexFinal
// ============================================================================

export class EmotionArcIndexFinal {
  list(): string[] {
    return [
      'EmotionProfile', 'EmotionIntensity', 'EmotionWordCounter',
      'EmotionTypeDistribution', 'EmotionalValence', 'EmotionalArousal',
      'EmotionDuration', 'EmotionTransition', 'EmotionalPeakDetector',
      'ArcVisualizer', 'MultiCharacterArcOverlay', 'ChapterEmotionProfile',
      'EmotionVsTension', 'ReaderEmpathyPredictor', 'EmotionStagnationDetector',
      'CatharticReleasePlanner', 'EmotionalBeatsMapper', 'MoodContagion',
      'FullStoryEmotionAnalyzer', 'PerChapterEmotionDistribution', 'EmotionalPacingAdvisor',
      'ConflictEmotionTracker', 'ResolutionEmotionTracker', 'ReaderDropEmotionPredictor',
      'BingeEmotionPredictor', 'GenreEmotionProfile', 'EmotionChapterSummary',
      'EmotionArcIndexFinal',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AG_BATCH_3_ENGINES = {
  FullStoryEmotionAnalyzer,
  PerChapterEmotionDistribution,
  EmotionalPacingAdvisor,
  ConflictEmotionTracker,
  ResolutionEmotionTracker,
  ReaderDropEmotionPredictor,
  BingeEmotionPredictor,
  GenreEmotionProfile,
  EmotionChapterSummary,
  EmotionArcIndexFinal,
} as const;

export type { Chapter, CharacterEmotion };
