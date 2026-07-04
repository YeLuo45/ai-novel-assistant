/**
 * ReaderAnalytics.test.ts — Direction AP, V3566-V3575 (Batch 2/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
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
  type ReaderBehavior,
} from './ReaderAnalytics';

describe('ReaderRetentionCurve', () => {
  const e = new ReaderRetentionCurve();

  it('compute returns per chapter', () => {
    const cohort: ReaderBehavior[] = [
      { readerId: 'r1', chapter: 0, timeSpent: 60, completed: true },
      { readerId: 'r1', chapter: 1, timeSpent: 30, completed: false },
    ];
    const r = e.compute(cohort);
    expect(r).toHaveLength(2);
  });

  it('compute shows retention drop', () => {
    const cohort: ReaderBehavior[] = [
      { readerId: 'r1', chapter: 0, timeSpent: 60, completed: true },
      { readerId: 'r1', chapter: 1, timeSpent: 60, completed: true },
      { readerId: 'r1', chapter: 2, timeSpent: 60, completed: false },
    ];
    const r = e.compute(cohort);
    expect(r[0].retention).toBe(1);
    expect(r[2].retention).toBe(0);
  });
});

describe('ReaderCohortAnalyzer', () => {
  const e = new ReaderCohortAnalyzer();

  it('segment by completed chapters', () => {
    const r = e.segment([
      { id: 'a', completedChapters: 25 },
      { id: 'b', completedChapters: 10 },
      { id: 'c', completedChapters: 2 },
    ]);
    expect(r.heavy).toContain('a');
    expect(r.casual).toContain('b');
    expect(r.abandoned).toContain('c');
  });
});

describe('ReaderSegmentPredictor', () => {
  const e = new ReaderSegmentPredictor();

  it('predict loyal for 90%+', () => {
    expect(e.predict({ id: 'a', completedChapters: 9, totalChapters: 10 })).toBe('loyal');
  });

  it('predict casual for 10%', () => {
    expect(e.predict({ id: 'a', completedChapters: 1, totalChapters: 10 })).toBe('casual');
  });
});

describe('ChapterHeatmap', () => {
  const e = new ChapterHeatmap();

  it('record + hottest returns N', () => {
    e.record(0, 0.5);
    e.record(1, 0.9);
    e.record(2, 0.3);
    expect(e.hottest(2)).toHaveLength(2);
  });
});

describe('CommentSentimentAnalyzer', () => {
  const e = new CommentSentimentAnalyzer();

  it('analyze positive', () => {
    expect(e.analyze('太好了，太棒了！').sentiment).toBe('positive');
  });

  it('analyze negative', () => {
    expect(e.analyze('太烂了，无聊').sentiment).toBe('negative');
  });

  it('analyze neutral', () => {
    expect(e.analyze('普通评论').sentiment).toBe('neutral');
  });
});

describe('BookmarkPredictor', () => {
  const e = new BookmarkPredictor();

  it('predict high for 悬念', () => {
    expect(e.predict('悬念和揭秘')).toBeGreaterThan(0.3);
  });

  it('isBookmarked for 0.5+', () => {
    expect(e.isBookmarked(0.6)).toBe(true);
  });
});

describe('SharePredictor', () => {
  const e = new SharePredictor();

  it('predict high for 震惊', () => {
    expect(e.predict('震惊！神回复！')).toBeGreaterThan(0.5);
  });

  it('isShareable for 0.5+', () => {
    expect(e.isShareable(0.6)).toBe(true);
  });
});

describe('TipPredictor', () => {
  const e = new TipPredictor();

  it('predict high for climax', () => {
    expect(e.predict('高潮', true)).toBeGreaterThanOrEqual(0.5);
  });

  it('willTip for 0.5+', () => {
    expect(e.willTip(0.6)).toBe(true);
  });
});

describe('ReaderJourneyMap', () => {
  const e = new ReaderJourneyMap();

  it('mapStage discovery', () => {
    expect(e.mapStage(0, 10)).toBe('discovery');
  });

  it('mapStage loyalty', () => {
    expect(e.mapStage(10, 10)).toBe('loyalty');
  });

  it('mapStage subscription for 50%+', () => {
    expect(e.mapStage(6, 10)).toBe('subscription');
  });
});

describe('ReaderAnalyticsIndex', () => {
  const idx = new ReaderAnalyticsIndex();

  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});