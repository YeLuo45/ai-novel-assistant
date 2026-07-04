/**
 * BehaviorPrediction.ts — Direction AP, V3556-V3565 (Batch 1/3)
 * Reader Behavior Predictor: 行为预测
 *
 * 10 engines:
 * 1.  CompletionRatePredictor — 完成率预测
 * 2.  AbandonmentPredictor — 弃文预测
 * 3.  ReReadPredictor — 重读预测
 * 4.  ChapterSkipPredictor — 跳章预测
 * 5.  ReadingSpeedEstimator — 阅读速度
 * 6.  AttentionCurvePredictor — 注意力曲线
 * 7.  EngagementPredictor — 参与度预测
 * 8.  BingeReadingPredictor — 暴读预测
 * 9.  DropOffChapterPredictor — 弃读章节预测
 * 10. BehaviorPredictionIndex — 收口
 */

import type { Chapter } from '../pacing/StructureTemplates';

export type ReaderBehavior = {
  readerId: string;
  chapter: number;
  timeSpent: number; // seconds
  completed: boolean;
};

// ============================================================================
// Engine 1: CompletionRatePredictor
// ============================================================================

export class CompletionRatePredictor {
  predict(chapters: Chapter[], readerHistory: ReaderBehavior[]): number {
    if (chapters.length === 0) return 0;
    const completed = readerHistory.filter((r) => r.completed).length;
    return completed / chapters.length;
  }

  isLikelyToComplete(rate: number, threshold = 0.5): boolean {
    return rate >= threshold;
  }
}

// ============================================================================
// Engine 2: AbandonmentPredictor
// ============================================================================

export class AbandonmentPredictor {
  predict(history: ReaderBehavior[]): number {
    if (history.length === 0) return 0;
    const abandoned = history.filter((r) => !r.completed).length;
    return abandoned / history.length;
  }

  isHighRisk(rate: number, threshold = 0.3): boolean {
    return rate > threshold;
  }
}

// ============================================================================
// Engine 3: ReReadPredictor
// ============================================================================

export class ReReadPredictor {
  predict(chapterContent: string): number {
    // Heuristic: emotional/cliffhanger content more likely re-read
    const scoreKeywords = ['悬念', '震惊', '揭秘', 'cliffhanger', 'shocking'];
    return Math.min(1, scoreKeywords.filter((k) => chapterContent.includes(k)).length / 3);
  }

  isReReadable(score: number, threshold = 0.3): boolean {
    return score >= threshold;
  }
}

// ============================================================================
// Engine 4: ChapterSkipPredictor
// ============================================================================

export class ChapterSkipPredictor {
  predict(chapter: Chapter, isClimax: boolean): number {
    if (isClimax) return 0.1;
    // Slow chapters more likely skipped
    if ((chapter.content?.length || 0) > 5000) return 0.5;
    return 0.2;
  }

  isSkippable(risk: number, threshold = 0.4): boolean {
    return risk > threshold;
  }
}

// ============================================================================
// Engine 5: ReadingSpeedEstimator
// ============================================================================

export class ReadingSpeedEstimator {
  estimate(text: string, readerType: 'fast' | 'normal' | 'slow' = 'normal'): number {
    const words = (text.length || 0) / 2; // Chinese chars / 2
    const wpm: Record<string, number> = { fast: 500, normal: 300, slow: 200 };
    return words / wpm[readerType];
  }
}

// ============================================================================
// Engine 6: AttentionCurvePredictor
// ============================================================================

export class AttentionCurvePredictor {
  predict(chapter: Chapter): { peakPosition: number; dropoffPosition: number } {
    const length = chapter.content?.length || 0;
    return {
      peakPosition: Math.min(length, 500),
      dropoffPosition: length > 2000 ? 2000 : length,
    };
  }

  isAttentionLikely(chapter: Chapter, position: number): boolean {
    const { peakPosition, dropoffPosition } = this.predict(chapter);
    return position <= peakPosition && position < dropoffPosition;
  }
}

// ============================================================================
// Engine 7: EngagementPredictor
// ============================================================================

export class EngagementPredictor {
  predict(text: string): number {
    let score = 0.5;
    if (/[？?]/.test(text)) score += 0.1;
    if (/[!！]/.test(text)) score += 0.1;
    if (/战斗|追逐|冲突/.test(text)) score += 0.2;
    if (/悬念|揭秘|震惊/.test(text)) score += 0.1;
    return Math.min(1, score);
  }

  isHigh(score: number, threshold = 0.7): boolean {
    return score >= threshold;
  }
}

// ============================================================================
// Engine 8: BingeReadingPredictor
// ============================================================================

export class BingeReadingPredictor {
  predict(history: ReaderBehavior[]): number {
    if (history.length < 3) return 0;
    const recent = history.slice(-3);
    const avgTime = recent.reduce((s, r) => s + r.timeSpent, 0) / recent.length;
    return Math.min(1, avgTime / 600); // 10 min = high
  }

  isBingeReader(score: number, threshold = 0.7): boolean {
    return score >= threshold;
  }
}

// ============================================================================
// Engine 9: DropOffChapterPredictor
// ============================================================================

export class DropOffChapterPredictor {
  predict(chapters: Chapter[]): { chapter: number; risk: number }[] {
    return chapters.map((c, i) => {
      let risk = 0;
      if ((c.content?.length || 0) > 4000) risk += 0.3;
      if (!/[？?!！?]/.test(c.content || '')) risk += 0.2;
      if (i > 5 && i < chapters.length - 5) risk += 0.1;
      return { chapter: i, risk: Math.min(1, risk) };
    });
  }

  topRiskChapters(chapters: Chapter[], n: number = 3): { chapter: number; risk: number }[] {
    return this.predict(chapters).sort((a, b) => b.risk - a.risk).slice(0, n);
  }
}

// ============================================================================
// Engine 10: BehaviorPredictionIndex
// ============================================================================

export class BehaviorPredictionIndex {
  list(): string[] {
    return [
      'CompletionRatePredictor', 'AbandonmentPredictor', 'ReReadPredictor',
      'ChapterSkipPredictor', 'ReadingSpeedEstimator', 'AttentionCurvePredictor',
      'EngagementPredictor', 'BingeReadingPredictor', 'DropOffChapterPredictor',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AP_BATCH_1_ENGINES = {
  CompletionRatePredictor,
  AbandonmentPredictor,
  ReReadPredictor,
  ChapterSkipPredictor,
  ReadingSpeedEstimator,
  AttentionCurvePredictor,
  EngagementPredictor,
  BingeReadingPredictor,
  DropOffChapterPredictor,
  BehaviorPredictionIndex,
} as const;

export type { Chapter, ReaderBehavior };
