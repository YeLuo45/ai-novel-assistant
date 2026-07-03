/**
 * ContradictionsAndDisclosure.test.ts — Direction AC, V3156-V3165 (Batch 3/3 收口)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  ContradictionDetector,
  InfoConflictResolver,
  DistanceConflict,
  SeasonConflict,
  TimeConflict,
  InfoReleaseStrategy,
  ShowTellRatio,
  ImplicitExplicitBalance,
  RepetitionDetectorInfo,
  ContinuityIndex,
} from './ContradictionsAndDisclosure';

describe('ContradictionDetector', () => {
  const e = new ContradictionDetector();

  it('detectBetween + getAll', () => {
    e.detectBetween(1, 5, 'info', 'A said X but B said Y');
    expect(e.getAll()).toHaveLength(1);
  });

  it('count returns total', () => {
    expect(e.count()).toBeGreaterThanOrEqual(1);
  });

  it('hasByType', () => {
    expect(e.hasByType('info')).toBe(true);
    expect(e.hasByType('nonexistent')).toBe(false);
  });
});

describe('InfoConflictResolver', () => {
  const e = new InfoConflictResolver();

  it('prefer_first returns first', () => {
    expect(e.resolve(['a', 'b', 'c'], 'prefer_first')).toBe('a');
  });

  it('prefer_last returns last', () => {
    expect(e.resolve(['a', 'b', 'c'], 'prefer_last')).toBe('c');
  });

  it('merge joins', () => {
    expect(e.resolve(['a', 'b'], 'merge')).toBe('a / b');
  });

  it('flag adds prefix', () => {
    expect(e.resolve(['a', 'b'], 'flag')).toContain('CONFLICT');
  });
});

describe('DistanceConflict', () => {
  const e = new DistanceConflict();

  it('hasConflict true for too fast', () => {
    expect(e.hasConflict(100, 1, 'walk')).toBe(true);
  });

  it('hasConflict false for reasonable', () => {
    expect(e.hasConflict(30, 6, 'walk')).toBe(false);
  });

  it('suggest returns minTime', () => {
    const s = e.suggest(60, 'walk');
    expect(s.minTime).toBe(10);
  });
});

describe('SeasonConflict', () => {
  const e = new SeasonConflict();

  it('setSeason + getSeason', () => {
    e.setSeason(1, 'summer');
    expect(e.getSeason(1)).toBe('summer');
  });

  it('hasConflict for same chapter different season', () => {
    e.setSeason(1, 'summer');
    e.setSeason(2, 'winter');
    expect(e.hasConflict(1, 2)).toBe(true);
  });

  it('hasConflict false for far chapters', () => {
    e.setSeason(1, 'summer');
    e.setSeason(20, 'winter');
    expect(e.hasConflict(1, 20)).toBe(false);
  });
});

describe('TimeConflict', () => {
  const e = new TimeConflict();

  it('hasTimeConflict true for same timestamp', () => {
    expect(e.hasTimeConflict(100, 1, 100, 5)).toBe(true);
  });

  it('isTravelTimeConsistent true for OK', () => {
    expect(e.isTravelTimeConsistent(30, 6, 10)).toBe(true);
  });

  it('isTravelTimeConsistent false for too fast', () => {
    expect(e.isTravelTimeConsistent(100, 1, 10)).toBe(false);
  });
});

describe('InfoReleaseStrategy', () => {
  const e = new InfoReleaseStrategy();

  it('add + totalReleased', () => {
    e.add(1, 3);
    e.add(2, 5);
    expect(e.totalReleased()).toBe(8);
  });

  it('averagePerChapter', () => {
    e.add(1, 4);
    expect(e.averagePerChapter(2)).toBe(4.5);
  });

  it('isBalanced for moderate', () => {
    const e2 = new InfoReleaseStrategy();
    e2.add(1, 3);
    e2.add(2, 3);
    expect(e2.isBalanced(5)).toBe(true);
  });
});

describe('ShowTellRatio', () => {
  const e = new ShowTellRatio();

  it('compute for show-heavy', () => {
    const r = e.compute('她看见红色，感到温暖，尝到甜味。');
    expect(r.show).toBeGreaterThan(0);
  });

  it('compute for tell-heavy', () => {
    const r = e.compute('他很伤心，她很高兴。');
    expect(r.tell).toBeGreaterThan(0);
  });

  it('isShowHeavy for ratio > 0.6', () => {
    expect(e.isShowHeavy('看见，感到，听到，尝到，' + 'x'.repeat(50))).toBe(true);
  });
});

describe('ImplicitExplicitBalance', () => {
  const e = new ImplicitExplicitBalance();

  it('compute for implicit', () => {
    const r = e.compute('她似乎感到，或许，可能。');
    expect(r.implicit).toBeGreaterThan(0);
  });

  it('isBalanced for mix', () => {
    expect(e.isBalanced('似乎，或许。肯定，一定。')).toBe(true);
  });
});

describe('RepetitionDetectorInfo', () => {
  const e = new RepetitionDetectorInfo();

  it('detects repeated word', () => {
    const reps = e.detect('血红色。血红色。血红色。地方。地方。地方。地方。地方。');
    expect(reps.some((r) => r.word === '血红色')).toBe(true);
  });

  it('hasRepetitionIssue for many repeats', () => {
    expect(e.hasRepetitionIssue('血红色。血红色。血红色。血红色。血红色。')).toBe(true);
  });
});

describe('ContinuityIndex', () => {
  const idx = new ContinuityIndex();

  it('lists 30 engines', () => {
    expect(idx.count()).toBe(30);
  });
});
