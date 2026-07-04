/**
 * BetaReaderIntegration.ts — Direction AL, V3456-V3465 (Batch 3/3 收口)
 * Beta Reader Persona: 集成 + 收口
 *
 * 10 engines:
 * 1.  FullChapterSimulation — 全文模拟
 * 2.  ReaderFeedbackLoop — 反馈循环
 * 3.  RevisionTracker — 修改追踪
 * 4.  ReaderPrioritiesRanker — 优先级排序
 * 5.  ImprovementGoalSetter — 目标设置
 * 6.  ChapterReadinessChecker — 章节就绪度
 * 7.  ReaderExpectationMatcher — 期望匹配
 * 8.  BookReadinessScorer — 书籍就绪度
 * 9.  FinalApprovalSimulator — 终审模拟
 * 10. BetaReaderIndexFinal — 28 engines 收口
 *
 * 灵感：模拟 3 类读者反馈 / 出版前自检
 */

import type { Chapter } from '../pacing/StructureTemplates';
import type { BetaReader } from './BetaReaderProfiles';
import type { ReaderFeedback as SimFeedback } from './BetaReaderSimulation';

// ============================================================================
// Engine 1: FullChapterSimulation
// ============================================================================

export class FullChapterSimulation {
  simulate(chapter: Chapter, readers: BetaReader[]): SimFeedback[] {
    return readers.map((r) => {
      const text = chapter.content || '';
      let rating = 3;
      const issues: string[] = [];
      const positives: string[] = [];
      if (r.type === 'web' && /[战斗|爽]/.test(text)) {
        rating += 1;
        positives.push('has 爽点');
      } else if (r.type === 'literary' && /[隐喻|象征]/.test(text)) {
        rating += 1;
        positives.push('has depth');
      } else if (r.type === 'critical' && text.length < 1000) {
        rating -= 1;
        issues.push('too short');
      }
      return { reader: r, rating, issues, positives };
    });
  }
}

// ============================================================================
// Engine 2: ReaderFeedbackLoop
// ============================================================================

export class ReaderFeedbackLoop {
  private _iterations: SimFeedback[][] = [];

  addIteration(feedback: SimFeedback[]): void {
    this._iterations.push(feedback);
  }

  getIterations(): SimFeedback[][] {
    return [...this._iterations];
  }

  hasImproved(): boolean {
    if (this._iterations.length < 2) return false;
    const first = this._avgRating(this._iterations[0]);
    const last = this._avgRating(this._iterations[this._iterations.length - 1]);
    return last > first;
  }

  private _avgRating(feedback: SimFeedback[]): number {
    if (feedback.length === 0) return 0;
    return feedback.reduce((s, f) => s + f.rating, 0) / feedback.length;
  }
}

// ============================================================================
// Engine 3: RevisionTracker
// ============================================================================

export interface Revision {
  chapter: number;
  changes: string[];
  timestamp: number;
}

export class RevisionTracker {
  private _revisions: Revision[] = [];

  record(chapter: number, changes: string[]): void {
    this._revisions.push({ chapter, changes, timestamp: Date.now() });
  }

  getAll(): Revision[] {
    return [...this._revisions];
  }

  revisionsForChapter(chapter: number): Revision[] {
    return this._revisions.filter((r) => r.chapter === chapter);
  }

  totalRevisions(): number {
    return this._revisions.length;
  }
}

// ============================================================================
// Engine 4: ReaderPrioritiesRanker
// ============================================================================

export class ReaderPrioritiesRanker {
  rank(issues: { issue: string; severity: number }[]): { issue: string; severity: number; priority: number }[] {
    return issues
      .map((i, idx) => ({ ...i, priority: idx + 1 }))
      .sort((a, b) => b.severity - a.severity);
  }

  topPriority(issues: { issue: string; severity: number }[]): { issue: string; severity: number } | null {
    const r = this.rank(issues);
    return r[0] || null;
  }
}

// ============================================================================
// Engine 5: ImprovementGoalSetter
// ============================================================================

export class ImprovementGoalSetter {
  set(priority: { issue: string; severity: number }, deadlineDays: number): { goal: string; deadline: number } {
    return {
      goal: `Fix: ${priority.issue}`,
      deadline: Date.now() + deadlineDays * 86400000,
    };
  }

  isOverdue(deadline: number): boolean {
    return Date.now() > deadline;
  }
}

// ============================================================================
// Engine 6: ChapterReadinessChecker
// ============================================================================

export class ChapterReadinessChecker {
  check(chapter: Chapter, minRating = 3.5): { ready: boolean; rating: number; issues: string[] } {
    const issues: string[] = [];
    let rating = 5;
    if ((chapter.content?.length || 0) < 500) {
      issues.push('too short');
      rating -= 2;
    }
    if (!chapter.content || !/[。！？.!?]/.test(chapter.content)) {
      issues.push('no punctuation');
      rating -= 1;
    }
    if (/[他她]\w{1,3}说/.test(chapter.content || '')) {
      issues.push('cliché dialogue');
      rating -= 0.5;
    }
    return { ready: rating >= minRating, rating, issues };
  }
}

// ============================================================================
// Engine 7: ReaderExpectationMatcher
// ============================================================================

export class ReaderExpectationMatcher {
  match(reader: BetaReader, content: string): { matched: number; total: number; ratio: number } {
    const total = reader.preferences.length;
    if (total === 0) return { matched: 0, total: 0, ratio: 0 };
    const matched = reader.preferences.filter((p) => content.includes(p)).length;
    return { matched, total, ratio: matched / total };
  }

  isMatched(reader: BetaReader, content: string, threshold = 0.5): boolean {
    return this.match(reader, content).ratio >= threshold;
  }
}

// ============================================================================
// Engine 8: BookReadinessScorer
// ============================================================================

export class BookReadinessScorer {
  score(chapters: Chapter[], feedbacks: SimFeedback[]): { overall: number; perChapter: { chapter: number; rating: number }[] } {
    if (chapters.length === 0) return { overall: 0, perChapter: [] };
    const sim = new FullChapterSimulation();
    const perChapter: { chapter: number; rating: number }[] = [];
    let total = 0;
    for (let i = 0; i < chapters.length; i++) {
      const fb = sim.simulate(chapters[i], feedbacks.map((f) => f.reader));
      const avg = fb.length > 0 ? fb.reduce((s, f) => s + f.rating, 0) / fb.length : 0;
      perChapter.push({ chapter: i, rating: avg });
      total += avg;
    }
    return { overall: total / chapters.length, perChapter };
  }

  isReady(overall: number, threshold = 3.5): boolean {
    return overall >= threshold;
  }
}

// ============================================================================
// Engine 9: FinalApprovalSimulator
// ============================================================================

export class FinalApprovalSimulator {
  approve(feedbacks: SimFeedback[]): { approved: boolean; reason: string; avgRating: number } {
    if (feedbacks.length === 0) return { approved: false, reason: 'no feedback', avgRating: 0 };
    const avg = feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length;
    if (avg >= 4) return { approved: true, reason: 'high rating', avgRating: avg };
    if (avg >= 3) return { approved: true, reason: 'acceptable', avgRating: avg };
    return { approved: false, reason: 'low rating', avgRating: avg };
  }
}

// ============================================================================
// Engine 10: BetaReaderIndexFinal
// ============================================================================

export class BetaReaderIndexFinal {
  list(): string[] {
    return [
      'BetaReaderPersonaBuilder', 'WebNovelReader', 'LiteraryReader',
      'GenreSpecificReader', 'YoungAdultReader', 'MiddleAgedReader',
      'CasualReader', 'AvidReader', 'CriticalReader',
      'MultiReaderFeedback', 'FeedbackAggregator', 'CriticalIssuesExtractor',
      'PositiveFeedbackExtractor', 'ConsensusDetector', 'OutlierFeedbackDetector',
      'ReaderPanel', 'FeedbackReportGenerator', 'ImprovementSuggestions',
      'FullChapterSimulation', 'ReaderFeedbackLoop', 'RevisionTracker',
      'ReaderPrioritiesRanker', 'ImprovementGoalSetter', 'ChapterReadinessChecker',
      'ReaderExpectationMatcher', 'BookReadinessScorer', 'FinalApprovalSimulator',
      'BetaReaderIndexFinal',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AL_BATCH_3_ENGINES = {
  FullChapterSimulation,
  ReaderFeedbackLoop,
  RevisionTracker,
  ReaderPrioritiesRanker,
  ImprovementGoalSetter,
  ChapterReadinessChecker,
  ReaderExpectationMatcher,
  BookReadinessScorer,
  FinalApprovalSimulator,
  BetaReaderIndexFinal,
} as const;

export type { Chapter, BetaReader };
export type { SimFeedback };
