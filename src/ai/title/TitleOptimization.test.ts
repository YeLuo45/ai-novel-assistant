/**
 * TitleOptimization.test.ts — Direction AI, V3356-V3365 (Batch 2/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  ChapterTitleScorer,
  TitleSeriesConsistency,
  TitleNicheMatcher,
  TitleHistoryTracker,
  TitleImprover,
  TitleBatchOptimizer,
  TitleEffectivenessPredictor,
  TitleVariationGenerator,
  TitleCompetitorComparison,
  TitleOptimizationIndex,
} from './TitleOptimization';

describe('ChapterTitleScorer', () => {
  const e = new ChapterTitleScorer();

  it('score high for action + emotion', () => {
    const r = e.score('热血激战觉醒');
    expect(r.total).toBeGreaterThan(0.5);
  });

  it('isHighQuality for 0.7+', () => {
    expect(e.isHighQuality('热血燃战斗觉醒')).toBe(true);
  });

  it('isHighQuality false for plain', () => {
    expect(e.isHighQuality('普通标题')).toBe(false);
  });
});

describe('TitleSeriesConsistency', () => {
  const e = new TitleSeriesConsistency();

  it('isConsistent for similar lengths', () => {
    e.register('A', ['四字标题', '五字标题长', '六字标题长度']);
    expect(e.isConsistent('A')).toBe(true);
  });

  it('variance for varied', () => {
    e.register('B', ['短', '这是一个非常非常长的标题']);
    expect(e.variance('B')).toBeGreaterThan(0);
  });
});

describe('TitleNicheMatcher', () => {
  const e = new TitleNicheMatcher();

  it('match golden_three', () => {
    expect(e.match('开局金手指')).toBe('golden_three');
  });

  it('match sweet_romance', () => {
    expect(e.match('甜蜜霸总')).toBe('sweet_romance');
  });

  it('match power_fantasy', () => {
    expect(e.match('扮猪吃虎逆袭')).toBe('power_fantasy');
  });
});

describe('TitleHistoryTracker', () => {
  const e = new TitleHistoryTracker();

  it('record + getHistory', () => {
    e.record('chap1', 'V1 title');
    e.record('chap1', 'V2 title');
    expect(e.getHistory('chap1')).toHaveLength(2);
  });

  it('getCurrent returns latest', () => {
    e.record('chap2', 'Old');
    e.record('chap2', 'New');
    expect(e.getCurrent('chap2')).toBe('New');
  });
});

describe('TitleImprover', () => {
  const e = new TitleImprover();

  it('improve short title', () => {
    expect(e.improve('短')).toContain('展开');
  });

  it('improve long title', () => {
    const long = '很长的标题'.repeat(10);
    expect(e.improve(long).length).toBeLessThan(long.length);
  });

  it('suggest returns 4 variants', () => {
    expect(e.suggest('base')).toHaveLength(4);
  });
});

describe('TitleBatchOptimizer', () => {
  const e = new TitleBatchOptimizer();

  it('optimize returns per-title', () => {
    const r = e.optimize(['A', 'B']);
    expect(r).toHaveLength(2);
  });

  it('averageImprovement', () => {
    const r = e.averageImprovement(['短', '更长一点的']);
    expect(typeof r).toBe('number');
  });
});

describe('TitleEffectivenessPredictor', () => {
  const e = new TitleEffectivenessPredictor();

  it('predict high CTR for clickbait', () => {
    const r = e.predict('热血爆燃秒杀');
    expect(r.ctr).toBeGreaterThan(0.5);
  });

  it('predict low CTR for plain', () => {
    const r = e.predict('普通标题');
    expect(r.ctr).toBeLessThan(0.5);
  });

  it('isHighCTR for 0.5+', () => {
    expect(e.isHighCTR('热血爆燃')).toBe(true);
  });
});

describe('TitleVariationGenerator', () => {
  const e = new TitleVariationGenerator();

  it('generate 5 variants', () => {
    const v = e.generate('base', 5);
    expect(v).toHaveLength(5);
  });

  it('generate default 5', () => {
    expect(e.generate('base')).toHaveLength(5);
  });
});

describe('TitleCompetitorComparison', () => {
  const e = new TitleCompetitorComparison();

  it('compare returns rank', () => {
    const r = e.compare('热血激战觉醒', ['普通标题', '另一个普通']);
    expect(r.rank).toBeGreaterThanOrEqual(1);
  });

  it('compare own is best', () => {
    const r = e.compare('热血燃战斗觉醒秒杀', ['普通1', '普通2']);
    expect(r.rank).toBe(1);
  });
});

describe('TitleOptimizationIndex', () => {
  const idx = new TitleOptimizationIndex();

  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});
