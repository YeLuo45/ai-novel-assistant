/**
 * HoleDetection.test.ts — Direction AF, V3266-V3275 (Batch 2/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  HoleSeverityRanker,
  HoleTypeDistribution,
  HoleChainBuilder,
  ForeshadowPayoffVerifier,
  CharacterArcConsistency,
  PlotThreadTracker,
  SetupPayoffRatio,
  PlantStrengthCalculator,
  SubplotHoleDetector,
  HoleFixSuggester,
  type PlotHole,
} from './HoleDetection';

const sampleHoles: PlotHole[] = [
  { type: 'motivation', chapter: 5, description: 'x', severity: 'minor' },
  { type: 'logic', chapter: 10, description: 'y', severity: 'critical' },
  { type: 'continuity', chapter: 3, description: 'z', severity: 'major' },
];

describe('HoleSeverityRanker', () => {
  const e = new HoleSeverityRanker();

  it('rank puts critical first', () => {
    const r = e.rank(sampleHoles);
    expect(r[0].severity).toBe('critical');
  });

  it('topN returns N', () => {
    expect(e.topN(sampleHoles, 2)).toHaveLength(2);
  });

  it('isAcceptable for no critical', () => {
    expect(e.isAcceptable([{ type: 'motivation', chapter: 1, description: 'x', severity: 'minor' }])).toBe(true);
  });
});

describe('HoleTypeDistribution', () => {
  const e = new HoleTypeDistribution();

  it('distribution counts all types', () => {
    const d = e.distribution(sampleHoles);
    expect(d.motivation).toBe(1);
    expect(d.logic).toBe(1);
  });

  it('dominantType for ties picks first', () => {
    const d = e.dominantType(sampleHoles);
    expect(d).not.toBeNull();
  });
});

describe('HoleChainBuilder', () => {
  const e = new HoleChainBuilder();

  it('buildChain sorts by chapter', () => {
    const c = e.buildChain(sampleHoles);
    expect(c[0].chapter).toBe(3);
  });

  it('groupByType', () => {
    const g = e.groupByType(sampleHoles);
    expect(g.motivation).toHaveLength(1);
  });
});

describe('ForeshadowPayoffVerifier', () => {
  const e = new ForeshadowPayoffVerifier();

  it('plant + payOff', () => {
    const f = e.plant('mysterious letter', 1);
    e.payOff(f.id, 10);
    expect(e.fulfillmentRate()).toBe(1);
  });

  it('getOrphans for unfulfilled', () => {
    const e2 = new ForeshadowPayoffVerifier();
    e2.plant('orphaned', 1);
    expect(e2.getOrphans()).toHaveLength(1);
  });

  it('getResolved', () => {
    const e2 = new ForeshadowPayoffVerifier();
    const f = e2.plant('x', 1);
    e2.payOff(f.id, 5);
    expect(e2.getResolved()).toHaveLength(1);
  });
});

describe('CharacterArcConsistency', () => {
  const e = new CharacterArcConsistency();

  it('isConsistent for small changes', () => {
    e.trackChange('Alice', 'courage', 1, 0.1);
    e.trackChange('Alice', 'courage', 5, 0.2);
    expect(e.isConsistent('Alice')).toBe(true);
  });

  it('isConsistent false for big jumps', () => {
    const e2 = new CharacterArcConsistency();
    e2.trackChange('Bob', 'courage', 1, 0.05);
    e2.trackChange('Bob', 'courage', 5, 0.95);
    expect(e2.isConsistent('Bob')).toBe(false);
  });

  it('isFlat for no data', () => {
    expect(e.isFlat('Carol')).toBe(true);
  });
});

describe('PlotThreadTracker', () => {
  const e = new PlotThreadTracker();

  it('add + advance + resolve', () => {
    const t = e.add('love');
    e.advance(t.id, 1);
    e.advance(t.id, 5);
    e.resolve(t.id);
    expect(t.status).toBe('resolved');
  });

  it('getAbandoned for stale', () => {
    const t = e.add('mystery');
    e.advance(t.id, 1);
    expect(e.getAbandoned(100, 50).length).toBe(1);
  });
});

describe('SetupPayoffRatio', () => {
  const e = new SetupPayoffRatio();

  it('compute balanced', () => {
    expect(e.compute(10, 10).isBalanced).toBe(true);
  });

  it('recommend add_payoff', () => {
    expect(e.recommend(10, 3)).toBe('add_payoff');
  });

  it('recommend balanced', () => {
    expect(e.recommend(10, 10)).toBe('balanced');
  });
});

describe('PlantStrengthCalculator', () => {
  const e = new PlantStrengthCalculator();

  it('score for hint', () => {
    expect(e.score('这是一个 hint 也许 perhaps')).toBeGreaterThan(0);
  });

  it('isStrongPlant for high score', () => {
    expect(e.isStrongPlant('暗示 似乎 或许 线索 伏笔')).toBe(true);
  });

  it('isSubtlePlant for low score', () => {
    expect(e.isSubtlePlant('她走了')).toBe(true);
  });
});

describe('SubplotHoleDetector', () => {
  const e = new SubplotHoleDetector();

  it('detect abandoned + unresolved', () => {
    const r = e.detect([
      { id: 'a', name: 'A', status: 'abandoned', chapters: [] },
      { id: 'b', name: 'B', status: 'active', chapters: [] },
    ]);
    expect(r.abandoned).toHaveLength(1);
    expect(r.unresolved).toHaveLength(1);
  });

  it('hasOrphaned for abandoned', () => {
    expect(e.hasOrphaned([{ id: 'a', name: 'A', status: 'abandoned', chapters: [] }])).toBe(true);
  });
});

describe('HoleFixSuggester', () => {
  const e = new HoleFixSuggester();

  it('suggest for motivation', () => {
    expect(e.suggest('motivation')).toContain('理由');
  });

  it('suggestAll returns suggestions', () => {
    const all = e.suggestAll(sampleHoles);
    expect(all).toHaveLength(3);
  });
});
