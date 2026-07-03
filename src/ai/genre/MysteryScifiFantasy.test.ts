/**
 * MysteryScifiFantasy.test.ts — Direction Z, V3176-V3185 (Batch 2/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  FairPlayAuditor,
  ClueLedger,
  DeductionChainValidator,
  LockedRoomLogic,
  RedHerringDetector,
  PhysicsHardnessChecker,
  FTLConsistency,
  AIBehaviorAuditor,
  TimeParadoxValidator,
  MythologyFaithfulness,
} from './MysteryScifiFantasy';

describe('FairPlayAuditor', () => {
  const e = new FairPlayAuditor();

  it('audit returns satisfied/total', () => {
    const r = e.audit('凶手和嫌疑人在案发现场留下线索。');
    expect(r.total).toBe(5);
    expect(r.satisfied).toBeGreaterThan(0);
  });

  it('ruleScore 0-1', () => {
    const s = e.ruleScore('有凶手有线索');
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });

  it('penalizes supernatural', () => {
    const r = e.audit('魔法让凶手消失。');
    expect(r.violations.length).toBeGreaterThan(0);
  });
});

describe('ClueLedger', () => {
  const e = new ClueLedger();

  it('add + getUnused', () => {
    e.add('血迹', 1);
    expect(e.getUnused()).toHaveLength(1);
  });

  it('use changes usedFor', () => {
    const c = e.add('脚印', 1);
    e.use(c.id, 'identify suspect');
    expect(c.usedFor).toBe('identify suspect');
  });

  it('usageRate computed', () => {
    const e2 = new ClueLedger();
    const c = e2.add('指纹', 1);
    e2.use(c.id, 'match');
    expect(e2.usageRate()).toBe(1);
  });
});

describe('DeductionChainValidator', () => {
  const e = new DeductionChainValidator();

  it('addStep + chain length', () => {
    e.addStep('1', 'A', 'B');
    expect(e.getChainLength()).toBe(1);
  });

  it('isValid for empty chain', () => {
    expect(e.isValid()).toBe(true);
  });
});

describe('LockedRoomLogic', () => {
  const e = new LockedRoomLogic();

  it('hasValidExplanation true for secret passage', () => {
    expect(e.hasValidExplanation('凶手有 secret passage')).toBe(true);
  });

  it('isCheating for no explanation', () => {
    expect(e.isCheating('no reason')).toBe(true);
  });
});

describe('RedHerringDetector', () => {
  const e = new RedHerringDetector();

  it('addSuspect + findRedHerrings', () => {
    e.addSuspect('A', 0.8, false);
    e.addSuspect('B', 0.9, true);
    expect(e.findRedHerrings()).toContain('A');
  });

  it('isRealKillerTooObvious for high suspicion', () => {
    e.addSuspect('Killer', 0.8, true);
    expect(e.isRealKillerTooObvious(0.5)).toBe(true);
  });
});

describe('PhysicsHardnessChecker', () => {
  const e = new PhysicsHardnessChecker();

  it('hardnessScore 1.0 for pure hard sci', () => {
    expect(e.hardnessScore('能量守恒，物理定律一致。')).toBe(1.0);
  });

  it('hardnessScore lower for soft sci', () => {
    const s = e.hardnessScore('曲速和传送');
    expect(s).toBeLessThan(1);
  });

  it('isHardSci for high score', () => {
    expect(e.isHardSci('物理定律一致。')).toBe(true);
  });
});

describe('FTLConsistency', () => {
  const e = new FTLConsistency();

  it('isFTLUsed for warp', () => {
    expect(e.isFTLUsed('warp drive')).toBe(true);
  });

  it('hasLimitation true for cost', () => {
    expect(e.hasLimitation('FTL has cost')).toBe(true);
  });

  it('isFTLResponsible for both', () => {
    expect(e.isFTLResponsible('warp 有限制')).toBe(true);
  });
});

describe('AIBehaviorAuditor', () => {
  const e = new AIBehaviorAuditor();

  it('hasHumanTraits for love', () => {
    expect(e.hasHumanTraits('AI has love')).toBe(true);
  });

  it('hasAILimits for logic', () => {
    expect(e.hasAILimits('pure logic')).toBe(true);
  });

  it('isBalancedAI for both', () => {
    expect(e.isBalancedAI('love and logic')).toBe(true);
  });

  it('isTooHuman for only human traits', () => {
    expect(e.isTooHuman('AI has love and emotion')).toBe(true);
  });
});

describe('TimeParadoxValidator', () => {
  const e = new TimeParadoxValidator();

  it('detectParadox for time travel', () => {
    expect(e.detectParadox('go back in time')).toBe(true);
  });

  it('hasResolution for multiverse', () => {
    expect(e.hasResolution('multiverse resolves')).toBe(true);
  });

  it('isResolvedParadox for both', () => {
    expect(e.isResolvedParadox('go back in time with multiverse')).toBe(true);
  });
});

describe('MythologyFaithfulness', () => {
  const e = new MythologyFaithfulness();

  it('detectMythology norse', () => {
    expect(e.detectMythology('thor and odin')).toBe('norse');
  });

  it('detectMythology chinese', () => {
    expect(e.detectMythology('玉帝和观音')).toBe('chinese');
  });

  it('hasCoreFigure greek', () => {
    expect(e.hasCoreFigure('greek', 'zeus is king')).toBe(true);
  });

  it('isFaithful for multiple matches', () => {
    expect(e.isFaithful('greek', 'zeus, athena, apollo')).toBe(true);
  });
});
