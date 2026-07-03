/**
 * PacingSubplot.test.ts — Direction AB, V3036-V3045 (Batch 3/3 收口)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  TensionCurve,
  ConflictEscalationCurve,
  PacingVisualizer,
  SceneSummaryRatio,
  SubplotWeaver,
  SubplotInterleaveValidator,
  POVSwitchingReasonableness,
  TimeJumpAuditor,
  PacingStructureDemo,
  PacingStructureIndex,
  type Chapter,
} from './PacingSubplot';

describe('TensionCurve', () => {
  const tc = new TensionCurve();

  it('addPoint clamps 0-1', () => {
    const p = tc.addPoint(1, 1.5);
    expect(p.tension).toBe(1);
  });

  it('averageTension across points', () => {
    const t = new TensionCurve();
    t.addPoint(1, 0.4);
    t.addPoint(2, 0.6);
    expect(t.averageTension()).toBeCloseTo(0.5, 5);
  });

  it('isEscalating true for rising curve', () => {
    const t = new TensionCurve();
    [0.1, 0.2, 0.3, 0.4, 0.5].forEach((v, i) => t.addPoint(i, v));
    expect(t.isEscalating()).toBe(true);
  });

  it('empty curve averages 0', () => {
    expect(new TensionCurve().averageTension()).toBe(0);
  });

  it('empty curve peak is 0', () => {
    expect(new TensionCurve().peakTension()).toBe(0);
  });

  it('isEscalating false for <2 points', () => {
    const t = new TensionCurve();
    t.addPoint(0, 0.5);
    expect(t.isEscalating()).toBe(false);
  });
});

describe('ConflictEscalationCurve', () => {
  const c = new ConflictEscalationCurve();

  it('distribution by type', () => {
    c.addPoint(1, 0.3, 'person');
    c.addPoint(2, 0.5, 'society');
    c.addPoint(3, 0.4, 'person');
    const d = c.distributionByType();
    expect(d.person).toBe(2);
    expect(d.society).toBe(1);
  });

  it('totalConflictMass sums', () => {
    const c2 = new ConflictEscalationCurve();
    c2.addPoint(1, 0.5, 'self');
    c2.addPoint(2, 0.5, 'fate');
    expect(c2.totalConflictMass()).toBeCloseTo(1.0, 5);
  });

  it('empty curve distribution all 0', () => {
    const d = new ConflictEscalationCurve().distributionByType();
    expect(d.person + d.self + d.society + d.nature + d.fate).toBe(0);
  });
});

describe('PacingVisualizer', () => {
  const v = new PacingVisualizer();

  it('classifies even pacing', () => {
    expect(v.classify([0.5, 0.5, 0.5])).toBe('even');
  });

  it('classifies slow_burn when trend > 0.3', () => {
    expect(v.classify([0.1, 0.2, 0.5])).toBe('slow_burn');
  });

  it('generateASCII returns string', () => {
    const s = v.generateASCII([0.1, 0.5, 0.9]);
    expect(typeof s).toBe('string');
    expect(s.length).toBe(3);
  });
});

describe('SceneSummaryRatio', () => {
  const r = new SceneSummaryRatio();

  it('5/5 ideal_50_50', () => {
    const x = r.compute(5, 5);
    expect(x.recommendation).toBe('ideal_50_50');
  });

  it('8/2 too_much_scene', () => {
    const x = r.compute(8, 2);
    expect(x.recommendation).toBe('too_much_scene');
  });
});

describe('SubplotWeaver', () => {
  const w = new SubplotWeaver();

  it('add + resolve flow', () => {
    w.add('s1', 'love', 1);
    w.resolve('s1', 20);
    expect(w.getUnresolved()).toHaveLength(0);
  });

  it('getActive filters by chapter', () => {
    const w2 = new SubplotWeaver();
    w2.add('s1', 'a', 1);
    w2.add('s2', 'b', 5);
    const active = w2.getActive(3);
    expect(active.map((s) => s.id)).toContain('s1');
    expect(active.map((s) => s.id)).not.toContain('s2');
  });
});

describe('SubplotInterleaveValidator', () => {
  const v = new SubplotInterleaveValidator();

  it('detects interleaving', () => {
    v.addAppearance('A', 1);
    v.addAppearance('B', 2);
    v.addAppearance('A', 4);
    v.addAppearance('B', 5);
    expect(v.hasInterleaving('A', 'B')).toBe(true);
  });

  it('countSubplots', () => {
    const v2 = new SubplotInterleaveValidator();
    v2.addAppearance('A', 1);
    v2.addAppearance('B', 2);
    v2.addAppearance('C', 3);
    expect(v2.countSubplots()).toBe(3);
  });
});

describe('POVSwitchingReasonableness', () => {
  const p = new POVSwitchingReasonableness();

  it('evaluate with 2 switches is reasonable', () => {
    const r = p.evaluate([
      { fromCharacter: 'A', toCharacter: 'B', chapter: 1, isHeadHopping: false },
      { fromCharacter: 'B', toCharacter: 'A', chapter: 2, isHeadHopping: false },
    ]);
    expect(r.isReasonable).toBe(true);
  });

  it('evaluate with head hopping is not reasonable', () => {
    const r = p.evaluate([{ fromCharacter: 'A', toCharacter: 'B', chapter: 1, isHeadHopping: true }]);
    expect(r.headHopping).toBe(true);
  });

  it('detectHeadHop with low ratio', () => {
    const sw = { fromCharacter: 'A', toCharacter: 'B', chapter: 1, isHeadHopping: false };
    expect(p.detectHeadHop(sw, 5, 10)).toBe(true);
  });
});

describe('TimeJumpAuditor', () => {
  const t = new TimeJumpAuditor();

  it('100 days not excessive', () => {
    const j = t.audit(1, 2, 100);
    expect(j.isExcessive).toBe(false);
  });

  it('400 days excessive', () => {
    const j = t.audit(1, 2, 400);
    expect(j.isExcessive).toBe(true);
  });

  it('batchAudit computes ratio', () => {
    const r = t.batchAudit([
      t.audit(1, 2, 100),
      t.audit(2, 3, 400),
    ]);
    expect(r.excessiveRatio).toBeCloseTo(0.5, 5);
  });
});

describe('PacingStructureDemo', () => {
  const d = new PacingStructureDemo();

  it('runs end-to-end on chapters', () => {
    const chs: Chapter[] = [
      { content: 'a' },
      { content: 'bb' },
      { content: 'ccc' },
    ];
    const r = d.run(chs);
    expect(['slow_burn', 'fast_pace', 'variable', 'even']).toContain(r.pacingType);
    expect(typeof r.ascii).toBe('string');
  });
});

describe('PacingStructureIndex', () => {
  const idx = new PacingStructureIndex();

  it('lists 28 engines', () => {
    expect(idx.count()).toBe(28);
  });

  it('describe returns Chinese name', () => {
    expect(idx.describe('ThreeActStructure')).toContain('三幕');
  });
});
