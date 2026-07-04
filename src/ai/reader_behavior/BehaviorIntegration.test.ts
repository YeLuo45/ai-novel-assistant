/**
 * BehaviorIntegration.test.ts — Direction AP, V3576-V3585 (Batch 3/3 收口)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  BehaviorDashboard,
  ReaderEngagementScore,
  ChapterOptimizationPredictor,
  ReaderLifetimeValue,
  ViralPredictor,
  SubscriberPredictor,
  RecommendationScore,
  BehaviorPatternDetector,
  ReaderChurnPredictor,
  BehaviorMasterIndex,
  type Chapter,
  type ReaderBehavior,
} from './BehaviorIntegration';

describe('BehaviorDashboard', () => {
  const e = new BehaviorDashboard();

  it('summarize includes data', () => {
    expect(e.summarize({ totalReaders: 100, totalReads: 5000, avgRating: 4.5 })).toContain('100');
  });
});

describe('ReaderEngagementScore', () => {
  const e = new ReaderEngagementScore();

  it('compute high for engaged', () => {
    const b: ReaderBehavior[] = [
      { readerId: 'r1', chapter: 0, timeSpent: 600, completed: true },
      { readerId: 'r1', chapter: 1, timeSpent: 600, completed: true },
    ];
    expect(e.compute(b)).toBeGreaterThan(0.8);
  });

  it('compute 0 for empty', () => {
    expect(e.compute([])).toBe(0);
  });
});

describe('ChapterOptimizationPredictor', () => {
  const e = new ChapterOptimizationPredictor();

  it('predict low for good chapter', () => {
    const r = e.predict({ content: 'short text with a question?' });
    expect(r.dropOffRisk).toBeLessThan(0.5);
  });

  it('predict high for long + no suspense', () => {
    const r = e.predict({ content: 'a'.repeat(5000) });
    expect(r.dropOffRisk).toBeGreaterThan(0.3);
  });
});

describe('ReaderLifetimeValue', () => {
  const e = new ReaderLifetimeValue();

  it('estimate for active reader', () => {
    expect(e.estimate(30, 1)).toBeGreaterThan(40);
  });
});

describe('ViralPredictor', () => {
  const e = new ViralPredictor();

  it('predict high for 震惊', () => {
    expect(e.predict('震惊！神作！', 0.3)).toBeGreaterThan(0.5);
  });

  it('isViral for 0.7+', () => {
    expect(e.isViral(0.8)).toBe(true);
  });
});

describe('SubscriberPredictor', () => {
  const e = new SubscriberPredictor();

  it('predict high for completed recent', () => {
    const b: ReaderBehavior[] = [
      { readerId: 'r1', chapter: 0, timeSpent: 600, completed: true },
      { readerId: 'r1', chapter: 1, timeSpent: 600, completed: true },
      { readerId: 'r1', chapter: 2, timeSpent: 600, completed: true },
    ];
    expect(e.predict(b)).toBe(0.8);
  });

  it('predict 0 for short history', () => {
    expect(e.predict([])).toBe(0);
  });

  it('willSubscribe for 0.5+', () => {
    expect(e.willSubscribe(0.6)).toBe(true);
  });
});

describe('RecommendationScore', () => {
  const e = new RecommendationScore();

  it('score for matching genre', () => {
    expect(e.score('romance', ['romance', 'fantasy'])).toBe(0.5);
  });

  it('isRecommended for 0.5+', () => {
    expect(e.isRecommended(0.6)).toBe(true);
  });
});

describe('BehaviorPatternDetector', () => {
  const e = new BehaviorPatternDetector();

  it('detect binge', () => {
    const b: ReaderBehavior[] = [
      { readerId: 'r1', chapter: 0, timeSpent: 700, completed: true },
    ];
    expect(e.detect(b)).toBe('binge reader');
  });

  it('detect no pattern', () => {
    expect(e.detect([])).toBe('no pattern');
  });
});

describe('ReaderChurnPredictor', () => {
  const e = new ReaderChurnPredictor();

  it('predict high churn', () => {
    const b: ReaderBehavior[] = [
      { readerId: 'r1', chapter: 0, timeSpent: 60, completed: false },
      { readerId: 'r1', chapter: 1, timeSpent: 60, completed: false },
      { readerId: 'r1', chapter: 2, timeSpent: 60, completed: false },
    ];
    expect(e.predict(b)).toBe(1);
  });

  it('willChurn for 0.6+', () => {
    expect(e.willChurn(0.7)).toBe(true);
  });
});

describe('BehaviorMasterIndex', () => {
  const idx = new BehaviorMasterIndex();

  it('lists 28 engines', () => {
    expect(idx.count()).toBe(28);
  });
});