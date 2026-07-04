/**
 * ReaderAnalytics.ts — Direction AP, V3566-V3575 (Batch 2/3)
 * Reader Behavior Predictor: 读者分析
 *
 * 10 engines:
 * 1.  ReaderRetentionCurve — 留存曲线
 * 2.  ReaderCohortAnalyzer — 同类群分析
 * 3.  ReaderSegmentPredictor — 用户分层
 * 4.  ChapterHeatmap — 章节热力图
 * 5.  CommentSentimentAnalyzer — 评论情绪
 * 6.  BookmarkPredictor — 书签预测
 * 7.  SharePredictor — 分享预测
 * 8.  TipPredictor — 打赏预测
 * 9.  ReaderJourneyMap — 读者旅程
 * 10. ReaderAnalyticsIndex — 收口
 */

import type { ReaderBehavior } from './BehaviorPrediction';

// ============================================================================
// Engine 1: ReaderRetentionCurve
// ============================================================================

export class ReaderRetentionCurve {
  compute(cohort: ReaderBehavior[]): { chapter: number; retention: number }[] {
    const byChapter: Record<number, { completed: number; total: number }> = {};
    for (const r of cohort) {
      if (!byChapter[r.chapter]) byChapter[r.chapter] = { completed: 0, total: 0 };
      byChapter[r.chapter].total += 1;
      if (r.completed) byChapter[r.chapter].completed += 1;
    }
    return Object.entries(byChapter).map(([ch, v]) => ({
      chapter: parseInt(ch),
      retention: v.completed / v.total,
    }));
  }
}

// ============================================================================
// Engine 2: ReaderCohortAnalyzer
// ============================================================================

export class ReaderCohortAnalyzer {
  segment(readers: { id: string; completedChapters: number }[]): { heavy: string[]; casual: string[]; abandoned: string[] } {
    const heavy: string[] = [];
    const casual: string[] = [];
    const abandoned: string[] = [];
    for (const r of readers) {
      if (r.completedChapters >= 20) heavy.push(r.id);
      else if (r.completedChapters >= 5) casual.push(r.id);
      else abandoned.push(r.id);
    }
    return { heavy, casual, abandoned };
  }
}

// ============================================================================
// Engine 3: ReaderSegmentPredictor
// ============================================================================

export class ReaderSegmentPredictor {
  predict(reader: { id: string; completedChapters: number; totalChapters: number }): string {
    const ratio = reader.totalChapters > 0 ? reader.completedChapters / reader.totalChapters : 0;
    if (ratio >= 0.8) return 'loyal';
    if (ratio >= 0.3) return 'engaged';
    return 'casual';
  }
}

// ============================================================================
// Engine 4: ChapterHeatmap
// ============================================================================

export class ChapterHeatmap {
  private _engagement: Map<number, number> = new Map();

  record(chapter: number, intensity: number): void {
    this._engagement.set(chapter, Math.max(0, Math.min(1, intensity)));
  }

  hottest(n: number = 3): { chapter: number; intensity: number }[] {
    return Array.from(this._engagement.entries())
      .map(([chapter, intensity]) => ({ chapter, intensity }))
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, n);
  }
}

// ============================================================================
// Engine 5: CommentSentimentAnalyzer
// ============================================================================

export class CommentSentimentAnalyzer {
  private _positive = ['好', '棒', '爱', '喜欢', '太好了', 'good', 'great', 'love'];
  private _negative = ['差', '烂', '弃', '无聊', 'bad', 'boring', 'drop'];

  analyze(text: string): { sentiment: 'positive' | 'neutral' | 'negative'; score: number } {
    const lower = text.toLowerCase();
    let pos = this._positive.filter((w) => lower.includes(w)).length;
    let neg = this._negative.filter((w) => lower.includes(w)).length;
    if (pos > neg) return { sentiment: 'positive', score: (pos - neg) / Math.max(1, pos + neg) };
    if (neg > pos) return { sentiment: 'negative', score: (neg - pos) / Math.max(1, pos + neg) };
    return { sentiment: 'neutral', score: 0 };
  }
}

// ============================================================================
// Engine 6: BookmarkPredictor
// ============================================================================

export class BookmarkPredictor {
  predict(chapterContent: string): number {
    let score = 0;
    if (/悬念|揭秘|cliffhanger/.test(chapterContent)) score += 0.4;
    if (/高潮|转折|震撼/.test(chapterContent)) score += 0.3;
    if (/重要|关键|转折点/.test(chapterContent)) score += 0.3;
    return Math.min(1, score);
  }

  isBookmarked(score: number, threshold = 0.5): boolean {
    return score >= threshold;
  }
}

// ============================================================================
// Engine 7: SharePredictor
// ============================================================================

export class SharePredictor {
  predict(text: string): number {
    let score = 0;
    if (/[？?]/.test(text)) score += 0.3;
    if (/震惊|震撼|没想到/.test(text)) score += 0.4;
    if (/金句|神回复/.test(text)) score += 0.3;
    return Math.min(1, score);
  }

  isShareable(score: number, threshold = 0.5): boolean {
    return score >= threshold;
  }
}

// ============================================================================
// Engine 8: TipPredictor
// ============================================================================

export class TipPredictor {
  predict(text: string, isClimax: boolean): number {
    let score = 0;
    if (isClimax) score += 0.5;
    if (/打脸|爽|逆转|高潮/.test(text)) score += 0.3;
    if (/感谢|致敬|支持/.test(text)) score += 0.2;
    return Math.min(1, score);
  }

  willTip(score: number, threshold = 0.5): boolean {
    return score >= threshold;
  }
}

// ============================================================================
// Engine 9: ReaderJourneyMap
// ============================================================================

export class ReaderJourneyMap {
  private _stages = ['discovery', 'first_chapter', 'engagement', 'subscription', 'loyalty'];

  mapStage(completedChapters: number, totalChapters: number): string {
    const ratio = totalChapters > 0 ? completedChapters / totalChapters : 0;
    if (ratio === 0) return 'discovery';
    if (ratio < 0.1) return 'first_chapter';
    if (ratio < 0.5) return 'engagement';
    if (ratio < 0.9) return 'subscription';
    return 'loyalty';
  }
}

// ============================================================================
// Engine 10: ReaderAnalyticsIndex
// ============================================================================

export class ReaderAnalyticsIndex {
  list(): string[] {
    return [
      'ReaderRetentionCurve', 'ReaderCohortAnalyzer', 'ReaderSegmentPredictor',
      'ChapterHeatmap', 'CommentSentimentAnalyzer', 'BookmarkPredictor',
      'SharePredictor', 'TipPredictor', 'ReaderJourneyMap',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AP_BATCH_2_ENGINES = {
  ReaderRetentionCurve,
  ReaderCohortAnalyzer,
  ReaderSegmentPredictor,
  ChapterHeatmap,
  CommentSentimentAnalyzer,
  BookmarkPredictor,
  SharePredictor,
  TipPredictor,
  ReaderJourneyMap,
  ReaderAnalyticsIndex,
} as const;

export type { ReaderBehavior };