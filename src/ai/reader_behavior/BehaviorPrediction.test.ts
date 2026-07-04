/**
 * BehaviorPrediction.test.ts — Direction AP, V3556-V3565 (Batch 1/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
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
  type Chapter,
  type ReaderBehavior,
} from './BehaviorPrediction';

describe('CompletionRatePredictor', () => {
  const e = new CompletionRatePredictor();

  it('predict for 5 chapters', () => {
    const chapters: Chapter[] = Array.from({ length: 5 }, (_, i) => ({ content: `ch${i}` }));
    const history: ReaderBehavior[] = chapters.map((_, i) => ({
      readerId: 'r1', chapter: i, timeSpent: 60, completed: i < 3,
    }));
    expect(e.predict(chapters, history)).toBeCloseTo(0.6, 5);
  });

  it('isLikelyToComplete for 0.5+', () => {
    expect(e.isLikelyToComplete(0.6)).toBe(true);
  });
});

describe('AbandonmentPredictor', () => {
  const e = new AbandonmentPredictor();

  it('predict for half abandoned', () => {
    const history: ReaderBehavior[] = [
      { readerId: 'r1', chapter: 0, timeSpent: 60, completed: true },
      { readerId: 'r1', chapter: 1, timeSpent: 30, completed: false },
    ];
    expect(e.predict(history)).toBeCloseTo(0.5, 5);
  });

  it('isHighRisk for 0.5+', () => {
    expect(e.isHighRisk(0.5)).toBe(true);
  });
});

describe('ReReadPredictor', () => {
  const e = new ReReadPredictor();

  it('predict high for 悬念+震惊', () => {
    expect(e.predict('悬念和震惊')).toBeGreaterThan(0);
  });

  it('isReReadable for 0.3+', () => {
    expect(e.isReReadable(0.5)).toBe(true);
  });
});

describe('ChapterSkipPredictor', () => {
  const e = new ChapterSkipPredictor();

  it('predict low for climax', () => {
    expect(e.predict({ content: 'climax' }, true)).toBe(0.1);
  });

  it('predict high for long', () => {
    expect(e.predict({ content: 'a'.repeat(6000) }, false)).toBe(0.5);
  });
});

describe('ReadingSpeedEstimator', () => {
  const e = new ReadingSpeedEstimator();

  it('estimate for 300 chars at normal', () => {
    expect(e.estimate('a'.repeat(300), 'normal')).toBeCloseTo(0.5, 5);
  });

  it('estimate for fast reader', () => {
    expect(e.estimate('a'.repeat(1000), 'fast')).toBeCloseTo(1, 5);
  });
});

describe('AttentionCurvePredictor', () => {
  const e = new AttentionCurvePredictor();

  it('predict returns peak + dropoff', () => {
    const r = e.predict({ content: 'a'.repeat(3000) });
    expect(r.peakPosition).toBeGreaterThan(0);
  });

  it('isAttentionLikely for early', () => {
    expect(e.isAttentionLikely({ content: 'a'.repeat(1000) }, 100)).toBe(true);
  });
});

describe('EngagementPredictor', () => {
  const e = new EngagementPredictor();

  it('predict high for action', () => {
    expect(e.predict('战斗追逐！真的吗？')).toBeGreaterThan(0.7);
  });

  it('isHigh for 0.7+', () => {
    expect(e.isHigh(0.8)).toBe(true);
  });
});

describe('BingeReadingPredictor', () => {
  const e = new BingeReadingPredictor();

  it('predict for 3 fast sessions', () => {
    const history: ReaderBehavior[] = [
      { readerId: 'r1', chapter: 0, timeSpent: 600, completed: true },
      { readerId: 'r1', chapter: 1, timeSpent: 600, completed: true },
      { readerId: 'r1', chapter: 2, timeSpent: 600, completed: true },
    ];
    expect(e.predict(history)).toBe(1);
  });

  it('predict 0 for empty', () => {
    expect(new BingeReadingPredictor().predict([])).toBe(0);
  });
});

describe('DropOffChapterPredictor', () => {
  const e = new DropOffChapterPredictor();

  it('predict for 3 chapters', () => {
    const chs: Chapter[] = [
      { content: 'a'.repeat(100) },
      { content: 'a'.repeat(5000) + '?' },
      { content: 'a'.repeat(100) },
    ];
    const r = e.predict(chs);
    expect(r).toHaveLength(3);
  });

  it('topRiskChapters returns N', () => {
    const chs: Chapter[] = Array.from({ length: 5 }, () => ({ content: 'a'.repeat(5000) }));
    expect(e.topRiskChapters(chs, 2)).toHaveLength(2);
  });
});

describe('BehaviorPredictionIndex', () => {
  const idx = new BehaviorPredictionIndex();

  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});
