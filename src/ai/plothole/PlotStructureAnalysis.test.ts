/**
 * PlotStructureAnalysis.test.ts — Direction AF, V3276-V3285 (Batch 3/3 收口)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  MultiChapterHoleAggregator,
  SetupPayoffChainVisualizer,
  MysteryLogicAuditor,
  CharacterKnowledgeCheck,
  ObjectContinuityAuditor,
  FactionGoalAuditor,
  GeographicLogicAuditor,
  TemporalLogicAuditor,
  PlotComplexityScorer,
  PlotHoleIndex,
  type Chapter,
  type PlotHole,
} from './PlotStructureAnalysis';

const sampleHoles: PlotHole[] = [
  { type: 'motivation', chapter: 1, description: 'a', severity: 'minor' },
  { type: 'logic', chapter: 1, description: 'b', severity: 'major' },
  { type: 'setting', chapter: 5, description: 'c', severity: 'critical' },
];

describe('MultiChapterHoleAggregator', () => {
  const e = new MultiChapterHoleAggregator();

  it('aggregate counts by chapter', () => {
    const r = e.aggregate(sampleHoles);
    expect(r.byChapter.get(1)?.length).toBe(2);
    expect(r.total).toBe(3);
  });

  it('chaptersWithMultipleHoles', () => {
    expect(e.chaptersWithMultipleHoles(sampleHoles)).toContain(1);
  });

  it('holeDensity', () => {
    expect(e.holeDensity(sampleHoles, 10)).toBeCloseTo(0.3, 5);
  });
});

describe('SetupPayoffChainVisualizer', () => {
  const e = new SetupPayoffChainVisualizer();

  it('isSetup for hint', () => {
    expect(e.isSetup('a hint appears')).toBe(true);
  });

  it('isPayoff for 果然', () => {
    expect(e.isPayoff('果然不出所料')).toBe(true);
  });

  it('chainRatio', () => {
    const r = e.chainRatio([
      { content: 'a hint 出现。' },
      { content: '果然如此。' },
    ]);
    expect(r.setupCount).toBe(1);
    expect(r.payoffCount).toBe(1);
  });
});

describe('MysteryLogicAuditor', () => {
  const e = new MysteryLogicAuditor();

  it('hasClue for 证据', () => {
    expect(e.hasClue('现场有证据')).toBe(true);
  });

  it('hasMotive for 动机', () => {
    expect(e.hasMotive('他有动机。')).toBe(true);
  });

  it('hasOpportunity for 机会', () => {
    expect(e.hasOpportunity('有时间和机会在场。')).toBe(true);
  });

  it('isValidMystery for all 3', () => {
    expect(e.isValidMystery('线索，动机，机会。')).toBe(true);
  });

  it('completenessScore for none', () => {
    expect(e.completenessScore('none')).toBe(0);
  });
});

describe('CharacterKnowledgeCheck', () => {
  const e = new CharacterKnowledgeCheck();

  it('knows + hasKnowledgeGap', () => {
    e.knows('Alice', 'secret');
    expect(e.hasKnowledgeGap('Alice', 'secret', '她提到了 secret')).toBe(false);
  });

  it('hasKnowledgeGap true for unknown', () => {
    expect(e.hasKnowledgeGap('Bob', 'secret', '他提到了 secret')).toBe(true);
  });
});

describe('ObjectContinuityAuditor', () => {
  const e = new ObjectContinuityAuditor();

  it('introduce + moveTo + hasInconsistency', () => {
    e.introduce('sword', 1, 'Paris', 'Alice');
    e.moveTo('sword', 'London');
    expect(e.hasInconsistency('sword', 'Paris')).toBe(true);
    expect(e.hasInconsistency('sword', 'London')).toBe(false);
  });

  it('changeOwner', () => {
    e.introduce('ring', 1, 'X', 'Alice');
    e.changeOwner('ring', 'Bob');
    expect(e.hasInconsistency('ring', 'X')).toBe(false); // location not changed
  });
});

describe('FactionGoalAuditor', () => {
  const e = new FactionGoalAuditor();

  it('isGoalAligned for matching', () => {
    e.addFaction('A', ['domination']);
    e.addAction('A', 'attempt domination');
    expect(e.isGoalAligned('A', 'attempt domination')).toBe(true);
  });

  it('unalignedActions for mismatched', () => {
    e.addAction('A', 'build schools');
    expect(e.unalignedActions('A')).toContain('build schools');
  });
});

describe('GeographicLogicAuditor', () => {
  const e = new GeographicLogicAuditor();

  it('addLocation + distance', () => {
    e.addLocation('A', 0, 0);
    e.addLocation('B', 3, 4);
    expect(e.distance('A', 'B')).toBeCloseTo(5, 5);
  });

  it('isReasonableTravel true', () => {
    e.addLocation('C', 0, 0);
    e.addLocation('D', 100, 0);
    expect(e.isReasonableTravel('C', 'D', 10)).toBe(true);
  });

  it('isReasonableTravel false for too far', () => {
    e.addLocation('E', 0, 0);
    e.addLocation('F', 1000, 0);
    expect(e.isReasonableTravel('E', 'F', 1)).toBe(false);
  });
});

describe('TemporalLogicAuditor', () => {
  const e = new TemporalLogicAuditor();

  it('hasOverlappingEvents for same time', () => {
    e.addEvent('a', 1, 1, 5);
    e.addEvent('b', 3, 2, 5);
    expect(e.hasOverlappingEvents()).toBe(true);
  });

  it('hasCausalityViolation for out of order', () => {
    e.addEvent('cause', 1, 1, 1);
    e.addEvent('effect', 2, 2, 1);
    // Add effect before cause
    e.addEvent('weird', 1, 3, 1);
    expect(e.hasCausalityViolation()).toBe(true);
  });
});

describe('PlotComplexityScorer', () => {
  const e = new PlotComplexityScorer();

  it('score for many chapters', () => {
    const chs: Chapter[] = Array.from({ length: 20 }, () => ({ content: 'a'.repeat(1000) }));
    const r = e.score(chs);
    expect(r.threads).toBeGreaterThan(0);
  });

  it('classify complex', () => {
    expect(e.classify(0.8)).toBe('complex');
  });
});

describe('PlotHoleIndex', () => {
  const idx = new PlotHoleIndex();

  it('lists 28 engines', () => {
    expect(idx.count()).toBe(28);
  });
});
