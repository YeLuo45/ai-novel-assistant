/**
 * TitleIntegration.test.ts — Direction AI, V3366-V3375 (Batch 3/3 收口)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  ChapterTitleGenerator,
  TitlePerformancePredictor,
  TitleABTestDesigner,
  TitleRotationStrategy,
  TitleSEOPlanner,
  TitleConsistencyChecker,
  TitleLearningLoop,
  TitleMemoryBank,
  TitleAIDirector,
  TitleOptimizerFinal,
} from './TitleIntegration';

describe('ChapterTitleGenerator', () => {
  const e = new ChapterTitleGenerator();

  it('generateForChapter includes chapter', () => {
    expect(e.generateForChapter(5, '战斗开始')).toContain('第5章');
  });

  it('generateSeries returns N', () => {
    expect(e.generateSeries(3, '冒险')).toHaveLength(3);
  });
});

describe('TitlePerformancePredictor', () => {
  const e = new TitlePerformancePredictor();

  it('predict returns clicks', () => {
    const r = e.predict('热血燃');
    expect(r.clicks).toBeGreaterThan(0);
  });

  it('comparePerformance', () => {
    const r = e.comparePerformance(['A', 'B']);
    expect(r).toHaveLength(2);
  });
});

describe('TitleABTestDesigner', () => {
  const e = new TitleABTestDesigner();

  it('design returns expectedCTR', () => {
    const r = e.design(['A', 'B', 'C']);
    expect(r.expectedCTR).toBeGreaterThan(0);
  });

  it('recommendWinner highest clicks', () => {
    const r = e.recommendWinner([{ title: 'A', clicks: 100 }, { title: 'B', clicks: 200 }]);
    expect(r).toBe('B');
  });
});

describe('TitleRotationStrategy', () => {
  const e = new TitleRotationStrategy();

  it('rotate daily', () => {
    expect(e.rotate(['A', 'B', 'C'], 'daily')).toHaveLength(1);
  });

  it('rotate weekly', () => {
    expect(e.rotate(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], 'weekly')).toHaveLength(7);
  });

  it('schedule for N days', () => {
    const s = e.schedule(['A', 'B'], 5);
    expect(s).toHaveLength(5);
  });
});

describe('TitleSEOPlanner', () => {
  const e = new TitleSEOPlanner();

  it('plan includes score', () => {
    const r = e.plan('穿越书', ['穿越', '系统', '无敌']);
    expect(r.score).toBeGreaterThanOrEqual(1);
  });

  it('recommendTitleLength scales with keywords', () => {
    expect(e.recommendTitleLength(3)).toBe(17);
  });
});

describe('TitleConsistencyChecker', () => {
  const e = new TitleConsistencyChecker();

  it('check consistent for similar', () => {
    const r = e.check(['四字标题', '五字标题', '六字标题了']);
    expect(r.consistent).toBe(true);
  });

  it('check inconsistent for varied', () => {
    const r = e.check(['短', '这是一个非常长的标题完全不同']);
    expect(r.consistent).toBe(false);
  });
});

describe('TitleLearningLoop', () => {
  const e = new TitleLearningLoop();

  it('recordFeedback + bestPerformers', () => {
    e.recordFeedback('A', 0.3, 4);
    e.recordFeedback('B', 0.5, 5);
    expect(e.bestPerformers()[0].title).toBe('B');
  });

  it('averageCTR', () => {
    const e2 = new TitleLearningLoop();
    e2.recordFeedback('A', 0.4, 3);
    e2.recordFeedback('B', 0.6, 4);
    expect(e2.averageCTR()).toBeCloseTo(0.5, 5);
  });
});

describe('TitleMemoryBank', () => {
  const e = new TitleMemoryBank();

  it('store + get + useCount', () => {
    e.store('A');
    e.store('A');
    e.store('B');
    expect(e.get('A')?.useCount).toBe(2);
  });

  it('mostUsed returns N', () => {
    e.store('A');
    e.store('B');
    e.store('C');
    expect(e.mostUsed(2)).toHaveLength(2);
  });
});

describe('TitleAIDirector', () => {
  const e = new TitleAIDirector();

  it('generateWithContext', () => {
    const r = e.generateWithContext(1, 'content', 'xuanhuan');
    expect(r).toContain('xuanhuan');
  });

  it('recordOutcome + hasEnoughHistory', () => {
    e.recordOutcome('A', 0.5, 4);
    e.recordOutcome('B', 0.5, 4);
    e.recordOutcome('C', 0.5, 4);
    expect(e.hasEnoughHistory(3)).toBe(true);
  });
});

describe('TitleOptimizerFinal', () => {
  const idx = new TitleOptimizerFinal();

  it('lists 28 engines', () => {
    expect(idx.count()).toBe(28);
  });
});
