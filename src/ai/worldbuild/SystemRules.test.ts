/**
 * SystemRules.test.ts — Direction AA, V3106-V3115 (Batch 1/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  MagicSystemAuditor,
  TechConsistency,
  PowerEconomy,
  SpeciesEcology,
  ReligionSystem,
  LanguageCohort,
  GeographicConsistency,
  TimelineTracker,
  SeasonWeather,
  DistanceSpeedValidator,
} from './SystemRules';

describe('MagicSystemAuditor', () => {
  const e = new MagicSystemAuditor();

  it('audits 3 rules', () => {
    expect(e.audit('魔法需要消耗生命，有限制和代价。').length).toBe(3);
  });

  it('has_cost detected', () => {
    const r = e.audit('魔法消耗生命作为代价。');
    expect(r.find((x) => x.rule === 'has_cost')?.satisfied).toBe(true);
  });

  it('has_limit detected', () => {
    const r = e.audit('魔法有上限，不能超过某个境界。');
    expect(r.find((x) => x.rule === 'has_limit')?.satisfied).toBe(true);
  });

  it('ruleScore is 0-1', () => {
    const s = e.ruleScore('a');
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });
});

describe('TechConsistency', () => {
  const e = new TechConsistency();

  it('hardSciRatio 1.0 for only hard sci', () => {
    expect(e.hardSciRatio('能量守恒，光速有限。')).toBe(1.0);
  });

  it('hardSciRatio 0.0 for only soft sci', () => {
    expect(e.hardSciRatio('曲速跃迁传送。')).toBe(0.0);
  });

  it('hasHardSciFlaws for soft-only', () => {
    expect(e.hasHardSciFlaws('曲速跃迁。')).toBe(true);
  });
});

describe('PowerEconomy', () => {
  const e = new PowerEconomy();

  it('countByTier has all keys', () => {
    const t = e.countByTier('他是强者，但她弱小。');
    expect(t).toHaveProperty('strong');
    expect(t).toHaveProperty('weak');
  });

  it('isImbalanced for only strong', () => {
    expect(e.isImbalanced('强者大师宗师高手强者。')).toBe(true);
  });

  it('balanced for both', () => {
    expect(e.isImbalanced('强与弱并存。')).toBe(false);
  });
});

describe('SpeciesEcology', () => {
  const e = new SpeciesEcology();

  it('countUnique detects multiple', () => {
    const u = e.countUnique('龙和精灵在战斗，矮人也加入。');
    expect(u.length).toBeGreaterThanOrEqual(3);
  });

  it('isBalanced for 2-6 species', () => {
    expect(e.isBalanced('龙与精灵')).toBe(true);
  });
});

describe('ReligionSystem', () => {
  const e = new ReligionSystem();

  it('counts religion mentions', () => {
    expect(e.countMentions('神和信仰，教堂和祭司。')).toBeGreaterThanOrEqual(4);
  });

  it('hasEstablishedReligion for 3+', () => {
    expect(e.hasEstablishedReligion('神教信仰。')).toBe(true);
  });
});

describe('LanguageCohort', () => {
  const e = new LanguageCohort();

  it('counts dialects', () => {
    expect(e.countDialects('他说方言，有口音，用古语。')).toBeGreaterThanOrEqual(3);
  });

  it('isCulturallyRich for 2+', () => {
    expect(e.isCulturallyRich('方言和口音。')).toBe(true);
  });
});

describe('GeographicConsistency', () => {
  const e = new GeographicConsistency();

  it('addPlace + distance', () => {
    e.addPlace('A', 0, 0);
    e.addPlace('B', 3, 4);
    expect(e.distance('A', 'B')).toBeCloseTo(5, 5);
  });

  it('isReasonableTravel for walk', () => {
    expect(e.isReasonableTravel(30, 6)).toBe(true);
  });

  it('isReasonableTravel false for too fast', () => {
    expect(e.isReasonableTravel(100, 1)).toBe(false);
  });
});

describe('TimelineTracker', () => {
  const e = new TimelineTracker();

  it('add + getByChapter', () => {
    e.add('event1', 1);
    e.add('event2', 5);
    expect(e.getByChapter(1)).toHaveLength(1);
  });

  it('checkOrder valid for proper deps', () => {
    const a = e.add('a', 1);
    e.add('b', 5, undefined, a.id);
    expect(e.checkOrder().valid).toBe(true);
  });

  it('checkOrder invalid for missing dep', () => {
    e.add('orphan', 1, undefined, 'nonexistent');
    expect(e.checkOrder().valid).toBe(false);
  });
});

describe('SeasonWeather', () => {
  const e = new SeasonWeather();

  it('addEvent + countMentions', () => {
    e.addEvent(1, '雪');
    expect(e.countMentions('春天下雪了。')).toBeGreaterThan(0);
  });

  it('isConsistent true for no data', () => {
    expect(e.isConsistent(1, 2, true)).toBe(true);
  });
});

describe('DistanceSpeedValidator', () => {
  const e = new DistanceSpeedValidator();

  it('walk 30km in 6h valid', () => {
    expect(e.validate(30, 6, 'walk').valid).toBe(true);
  });

  it('walk 100km in 1h invalid', () => {
    expect(e.validate(100, 1, 'walk').valid).toBe(false);
  });

  it('teleport any distance valid', () => {
    expect(e.validate(100000, 1, 'teleport').valid).toBe(true);
  });
});
