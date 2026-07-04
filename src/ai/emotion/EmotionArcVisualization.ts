/**
 * EmotionArcVisualization.ts — Direction AG, V3296-V3305 (Batch 2/3)
 * Emotional Arc Mapper: 弧线可视化 + 协同
 *
 * 10 engines:
 * 1.  ArcVisualizer — 弧线可视化（ASCII）
 * 2.  MultiCharacterArcOverlay — 多角色弧线叠加
 * 3.  ChapterEmotionProfile — 章节情绪画像
 * 4.  EmotionVsTension — 情绪 vs 张力对比
 * 5.  ReaderEmpathyPredictor — 读者共情预测
 * 6.  EmotionStagnationDetector — 情绪停滞检测
 * 7.  CatharticReleasePlanner — 净化释放规划
 * 8.  EmotionalBeatsMapper — 情绪节拍映射
 * 9.  MoodContagion — 情绪传染
 * 10. EmotionArcIndex — 收口
 *
 * 灵感：共情曲线 / 读者心理
 */

import type { CharacterEmotion } from './EmotionProfile';

// ============================================================================
// Engine 1: ArcVisualizer
// ============================================================================

export class ArcVisualizer {
  private _blocks = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

  asciiCurve(values: number[]): string {
    if (values.length === 0) return '';
    const max = Math.max(...values, 0.01);
    return values.map((v) => {
      const idx = Math.min(this._blocks.length - 1, Math.floor((v / max) * this._blocks.length));
      return this._blocks[idx];
    }).join('');
  }

  renderProfile(profile: CharacterEmotion[]): string {
    return this.asciiCurve(profile.map((p) => p.intensity));
  }
}

// ============================================================================
// Engine 2: MultiCharacterArcOverlay
// ============================================================================

export class MultiCharacterArcOverlay {
  overlay(profiles: Map<string, CharacterEmotion[]>): Map<string, number[]> {
    const result = new Map<string, number[]>();
    for (const [character, profile] of profiles) {
      result.set(character, profile.map((p) => p.intensity));
    }
    return result;
  }

  alignedArcs(profiles: Map<string, CharacterEmotion[]>): boolean {
    // Same chapter count
    const counts = Array.from(profiles.values()).map((p) => p.length);
    return counts.every((c) => c === counts[0]);
  }
}

// ============================================================================
// Engine 3: ChapterEmotionProfile
// ============================================================================

export interface ChapterEmotion {
  chapter: number;
  dominantEmotion: string;
  intensity: number;
  characters: string[];
}

export class ChapterEmotionProfile {
  private _profiles = new Map<number, ChapterEmotion>();

  setProfile(profile: ChapterEmotion): void {
    this._profiles.set(profile.chapter, profile);
  }

  get(chapter: number): ChapterEmotion | null {
    return this._profiles.get(chapter) || null;
  }

  getAll(): ChapterEmotion[] {
    return Array.from(this._profiles.values());
  }
}

// ============================================================================
// Engine 4: EmotionVsTension
// ============================================================================

export class EmotionVsTension {
  computeGap(emotionValence: number, tension: number): number {
    return Math.abs(emotionValence - tension);
  }

  isAligned(emotionValence: number, tension: number, threshold = 0.3): boolean {
    return this.computeGap(emotionValence, tension) < threshold;
  }

  contrastScore(emotionValence: number, tension: number): number {
    return this.isAligned(emotionValence, tension, 0.5) ? 0.5 : 1;
  }
}

// ============================================================================
// Engine 5: ReaderEmpathyPredictor
// ============================================================================

export class ReaderEmpathyPredictor {
  predict(profile: CharacterEmotion[]): { empathy: number; peaks: number } {
    const intensities = profile.map((p) => p.intensity);
    const peaks = intensities.filter((i) => i > 0.7).length;
    const empathy = Math.min(1, peaks / 5);
    return { empathy, peaks };
  }

  isHighlyEmpathetic(profile: CharacterEmotion[], threshold = 0.5): boolean {
    return this.predict(profile).empathy >= threshold;
  }
}

// ============================================================================ Engine 6: EmotionStagnationDetector

export class EmotionStagnationDetector {
  detect(profile: CharacterEmotion[], windowSize = 5): { stagnant: boolean; stagnantChapter: number | null } {
    if (profile.length < windowSize) return { stagnant: false, stagnantChapter: null };
    for (let i = windowSize; i <= profile.length; i++) {
      const window = profile.slice(i - windowSize, i);
      const intensities = window.map((p) => p.intensity);
      const variance = this._variance(intensities);
      if (variance < 0.01) return { stagnant: true, stagnantChapter: window[window.length - 1].chapter };
    }
    return { stagnant: false, stagnantChapter: null };
  }

  private _variance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  }
}

// ============================================================================
// Engine 7: CatharticReleasePlanner
// ============================================================================

export class CatharticReleasePlanner {
  recommend(profile: CharacterEmotion[]): { after: number; type: string } {
    const lastNeg = [...profile].reverse().find((p) => p.emotion === 'sadness' || p.emotion === 'fear');
    if (!lastNeg) return { after: 0, type: 'joy' };
    return { after: lastNeg.chapter + 3, type: 'joy' };
  }

  isReadyForRelease(profile: CharacterEmotion[]): boolean {
    return profile.length >= 3 && profile[profile.length - 1].intensity < 0.3;
  }
}

// ============================================================================
// Engine 8: EmotionalBeatsMapper
// ============================================================================

export class EmotionalBeatsMapper {
  mapBeats(profile: CharacterEmotion[]): { chapter: number; beat: string }[] {
    return profile.map((p) => ({
      chapter: p.chapter,
      beat: `${p.emotion}@${p.intensity.toFixed(2)}`,
    }));
  }

  countMajorBeats(profile: CharacterEmotion[], threshold = 0.7): number {
    return profile.filter((p) => p.intensity >= threshold).length;
  }
}

// ============================================================================
// Engine 9: MoodContagion
// ============================================================================

export class MoodContagion {
  // Character A's emotion affects character B's emotion in same chapter
  private _matrix = new Map<string, number>(); // "A->B" → influence

  setInfluence(from: string, to: string, factor: number): void {
    this._matrix.set(`${from}->${to}`, Math.max(0, Math.min(1, factor)));
  }

  predict(target: string, sourceEmotion: string, sourceIntensity: number): number {
    const factors = Array.from(this._matrix.entries()).filter(([k]) => k.endsWith(`->${target}`));
    if (factors.length === 0) return 0;
    const total = factors.reduce((s, [k, f]) => s + f * sourceIntensity, 0);
    return Math.min(1, total);
  }
}

// ============================================================================
// Engine 10: EmotionArcIndex
// ============================================================================

export class EmotionArcIndex {
  list(): string[] {
    return [
      'ArcVisualizer', 'MultiCharacterArcOverlay', 'ChapterEmotionProfile',
      'EmotionVsTension', 'ReaderEmpathyPredictor', 'EmotionStagnationDetector',
      'CatharticReleasePlanner', 'EmotionalBeatsMapper', 'MoodContagion',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AG_BATCH_2_ENGINES = {
  ArcVisualizer,
  MultiCharacterArcOverlay,
  ChapterEmotionProfile,
  EmotionVsTension,
  ReaderEmpathyPredictor,
  EmotionStagnationDetector,
  CatharticReleasePlanner,
  EmotionalBeatsMapper,
  MoodContagion,
  EmotionArcIndex,
} as const;
