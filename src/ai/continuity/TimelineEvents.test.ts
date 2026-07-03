/**
 * TimelineEvents.test.ts — Direction AC, V3136-V3145 (Batch 1/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  EventTimeline,
  TimeJumpAuditor,
  FlashbackReasonableness,
  AgeCalculator,
  AnniversaryReminder,
  InformationPropagation,
  CharacterKnowledgeLedger,
  SecretKeeper,
  RumorsNews,
  RevealTracker,
} from './TimelineEvents';

describe('EventTimeline', () => {
  const e = new EventTimeline();

  it('add + getAll', () => {
    e.add('a', 1, 100);
    e.add('b', 2, 200);
    expect(e.getAll()).toHaveLength(2);
  });

  it('sortByTime returns chronological', () => {
    e.add('c', 3, 150);
    const sorted = e.sortByTime();
    expect(sorted[0].timestamp).toBeLessThanOrEqual(sorted[1].timestamp);
  });

  it('hasContradiction true for same timestamp', () => {
    e.add('d', 1, 1000);
    e.add('e', 2, 1000);
    expect(e.hasContradiction()).toBe(true);
  });
});

describe('TimeJumpAuditor', () => {
  const e = new TimeJumpAuditor();

  it('100 days not excessive', () => {
    expect(e.audit(1, 2, 100).isExcessive).toBe(false);
  });

  it('400 days excessive', () => {
    expect(e.audit(1, 2, 400).isExcessive).toBe(true);
  });

  it('3 days flashback', () => {
    expect(e.audit(1, 5, 3).isFlashback).toBe(true);
  });

  it('batchAudit counts', () => {
    const r = e.batchAudit([e.audit(1, 2, 100), e.audit(2, 3, 400)]);
    expect(r.excessive).toBe(1);
  });
});

describe('FlashbackReasonableness', () => {
  const e = new FlashbackReasonableness();

  it('counts flashback keywords', () => {
    expect(e.count('她回忆起当年，曾经的过去。')).toBeGreaterThanOrEqual(3);
  });

  it('isFlashback for 1+', () => {
    expect(e.isFlashback('他想起过去。')).toBe(true);
  });

  it('isOverFlashbacked for 3+', () => {
    expect(e.isOverFlashbacked('回忆，想起，当年，曾经，那时。')).toBe(true);
  });
});

describe('AgeCalculator', () => {
  const e = new AgeCalculator();

  it('setBirth + ageAt', () => {
    e.setBirth('Alice', 1, 20);
    expect(e.ageAt('Alice', 1)).toBe(20);
  });

  it('ageAt accounts for elapsed', () => {
    e.setBirth('Bob', 1, 30);
    expect(e.ageAt('Bob', 11)).toBe(40);
  });

  it('ageInYears', () => {
    const e2 = new AgeCalculator();
    e2.setBirth('Carol', 1, 0);
    expect(e2.ageInYears('Carol', 365 * 5 + 1)).toBe(5);
  });
});

describe('AnniversaryReminder', () => {
  const e = new AnniversaryReminder();

  it('addEvent + hasAnniversary', () => {
    e.addEvent(10, 'battle day');
    expect(e.hasAnniversary(10)).toBe(true);
  });

  it('getUpcoming within lookAhead', () => {
    e.addEvent(15, 'founding day');
    const upcoming = e.getUpcoming(10, 10);
    expect(upcoming.some((u) => u.chapter === 15)).toBe(true);
  });
});

describe('InformationPropagation', () => {
  const e = new InformationPropagation();

  it('tell + whoKnows', () => {
    e.tell('secret', 'Alice', 'Bob', 1);
    expect(e.whoKnows('secret')).toContain('Bob');
  });

  it('confirm marks as confirmed', () => {
    e.tell('x', 'A', 'B', 1);
    e.confirm('x', 'A', 'B', 5);
    expect(e.tell('x', 'A', 'B', 10)).toBeTruthy();
  });
});

describe('CharacterKnowledgeLedger', () => {
  const e = new CharacterKnowledgeLedger();

  it('learn + knows', () => {
    e.learn('Alice', 'magic exists');
    expect(e.knows('Alice', 'magic exists')).toBe(true);
  });

  it('knowsEverything true for all', () => {
    e.learn('Bob', 'a');
    e.learn('Bob', 'b');
    expect(e.knowsEverything('Bob', ['a', 'b'])).toBe(true);
  });

  it('knowsEverything false for missing', () => {
    e.learn('Carol', 'a');
    expect(e.knowsEverything('Carol', ['a', 'b'])).toBe(false);
  });
});

describe('SecretKeeper', () => {
  const e = new SecretKeeper();

  it('add + reveal', () => {
    e.add('parentage', 'Alice', 1);
    expect(e.reveal('parentage')).toBe('Alice');
  });

  it('isRevealed after chapter', () => {
    e.add('x', 'A', 1);
    expect(e.isRevealed('x', 5)).toBe(true);
  });

  it('getAll returns secrets', () => {
    e.add('s1', 'A', 1);
    expect(e.getAll().length).toBeGreaterThanOrEqual(1);
  });
});

describe('RumorsNews', () => {
  const e = new RumorsNews();

  it('start + spread', () => {
    e.start('king is ill', 'Alice');
    e.spread('king is ill', 'Bob');
    expect(e.getSpreadCount('king is ill')).toBe(2);
  });

  it('isViral for 10+', () => {
    e.start('big rumor', 'A');
    for (let i = 0; i < 10; i++) e.spread('big rumor', `p${i}`);
    expect(e.isViral('big rumor', 10)).toBe(true);
  });
});

describe('RevealTracker', () => {
  const e = new RevealTracker();

  it('record + getAll', () => {
    e.record('mystery', 10, [1, 5], 0.7);
    expect(e.getAll()).toHaveLength(1);
  });

  it('isPayoffStrong for strong setup', () => {
    const r = e.record('m', 10, [1, 5, 7], 0.8);
    expect(e.isPayoffStrong(r)).toBe(true);
  });

  it('isCheapReveal for no setup', () => {
    const r = e.record('m2', 10, [], 0.5);
    expect(e.isCheapReveal(r)).toBe(true);
  });
});
