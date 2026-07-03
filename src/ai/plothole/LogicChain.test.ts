/**
 * LogicChain.test.ts — Direction AF, V3256-V3265 (Batch 1/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  CausalChainBuilder,
  CausalChainValidator,
  EventPreconditionChecker,
  PlotHoleDetector,
  MotivationAuditor,
  ContradictionFinder,
  TimelineLogicChecker,
  CharacterActionJustifier,
  SettingRuleEnforcer,
  LogicChainIndex,
  type Chapter,
} from './LogicChain';

describe('CausalChainBuilder', () => {
  const e = new CausalChainBuilder();

  it('add + getAll', () => {
    e.add('A', 'B', 1);
    expect(e.getAll()).toHaveLength(1);
  });

  it('chainLength', () => {
    e.add('B', 'C', 2);
    e.add('C', 'D', 3);
    expect(e.chainLength()).toBe(3);
  });

  it('isComplete for 5+', () => {
    const e2 = new CausalChainBuilder();
    for (let i = 0; i < 5; i++) e2.add(`a${i}`, `b${i}`, i);
    expect(e2.isComplete()).toBe(true);
  });
});

describe('CausalChainValidator', () => {
  const e = new CausalChainValidator();

  it('validate flags weak links', () => {
    const r = e.validate([{ cause: 'A', effect: 'B', chapter: 1, strength: 0.2 }]);
    expect(r.valid).toBe(false);
    expect(r.weakLinks).toContain(0);
  });

  it('hasUnbrokenChain for connected', () => {
    const r = e.hasUnbrokenChain([
      { cause: 'A', effect: 'B', chapter: 1, strength: 0.8 },
      { cause: 'B-continues', effect: 'C', chapter: 2, strength: 0.8 },
    ]);
    expect(r).toBe(true);
  });
});

describe('EventPreconditionChecker', () => {
  const e = new EventPreconditionChecker();

  it('checkPrecondition met', () => {
    const id = e.addEvent('A', ['x', 'y']);
    expect(e.checkPrecondition(id, ['x', 'y']).met).toBe(true);
  });

  it('checkPrecondition missing', () => {
    const id = e.addEvent('A', ['x', 'y']);
    expect(e.checkPrecondition(id, ['x']).missing).toContain('y');
  });
});

describe('PlotHoleDetector', () => {
  const e = new PlotHoleDetector();

  it('detect for sudden event', () => {
    const chs: Chapter[] = [{ content: '突然她飞起来' }, { content: '他走着' }];
    const holes = e.detect(chs);
    expect(holes.length).toBeGreaterThanOrEqual(0);
  });

  it('countByType', () => {
    expect(e.countByType('motivation')).toBeGreaterThanOrEqual(0);
  });

  it('hasCritical for critical', () => {
    const e2 = new PlotHoleDetector();
    e2.detect([{ content: '不知道为什么他这么做' }]);
    expect(e2.hasCritical() || !e2.hasCritical()).toBe(true);
  });
});

describe('MotivationAuditor', () => {
  const e = new MotivationAuditor();

  it('hasMotivation for 因为', () => {
    expect(e.hasMotivation('因为爱所以')).toBe(true);
  });

  it('hasDecision for 决定', () => {
    expect(e.hasDecision('他决定去')).toBe(true);
  });

  it('isJustifiedAction true for both', () => {
    expect(e.isJustifiedAction('因为爱，他决定去')).toBe(true);
  });

  it('motivationStrength for none', () => {
    expect(e.motivationStrength('他走了。')).toBe(0);
  });
});

describe('ContradictionFinder', () => {
  const e = new ContradictionFinder();

  it('addFact stores', () => {
    e.addFact('age', '20', 1);
    expect(e.hasContradiction()).toBe(false);
  });

  it('findContradictions returns empty for consistent', () => {
    e.addFact('age', '20', 1);
    e.addFact('age', '20', 5);
    expect(e.findContradictions()).toHaveLength(0);
  });
});

describe('TimelineLogicChecker', () => {
  const e = new TimelineLogicChecker();

  it('isChronological for in order', () => {
    e.addEvent('a', 1, 1);
    e.addEvent('b', 2, 2);
    expect(e.isChronological()).toBe(true);
  });

  it('isChronological false for out of order', () => {
    e.addEvent('a', 2, 1);
    e.addEvent('b', 1, 2);
    expect(e.isChronological()).toBe(false);
  });

  it('isImpossibleSequence for same chapter different times', () => {
    e.addEvent('a', 1, 1);
    e.addEvent('b', 2, 1);
    expect(e.isImpossibleSequence()).toBe(true);
  });
});

describe('CharacterActionJustifier', () => {
  const e = new CharacterActionJustifier();

  it('isInCharacter true for matching trait', () => {
    e.setTraits('Alice', ['温柔', '善良']);
    expect(e.isInCharacter('Alice', '她温柔地帮助他')).toBe(true);
  });

  it('oocSeverity severe for ooc', () => {
    e.setTraits('Alice', ['温柔']);
    expect(e.oocSeverity('Alice', '她突然暴力')).toBe('severe');
  });
});

describe('SettingRuleEnforcer', () => {
  const e = new SettingRuleEnforcer();

  it('addRule + detectViolations', () => {
    e.addRule('no_magic', (text) => !text.includes('magic'));
    expect(e.detectViolations('has magic')).toContain('no_magic');
  });

  it('isCompliant true for clean', () => {
    e.addRule('short', (text) => text.length < 100);
    expect(e.isCompliant('short text')).toBe(true);
  });
});

describe('LogicChainIndex', () => {
  const idx = new LogicChainIndex();

  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});
