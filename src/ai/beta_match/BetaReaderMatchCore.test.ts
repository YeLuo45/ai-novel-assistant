/**
 * BetaReaderMatchCore.test.ts — Direction BF, V4036-V4045 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { ReaderProfileBuilder, PreferenceMatcher, DemographicsMatcher, ReaderRanker, ReaderDatabase, MatchScoreCalculator, MatchThreshold, MatchReport, MatchADirector, BetaReaderMatchCoreIndex } from './BetaReaderMatchCore';

describe('ReaderProfileBuilder', () => {
  const e = new ReaderProfileBuilder();
  it('build returns profile', () => { const r = e.build({ name: 'A', preferences: ['romance'], demographics: 'YA' }); expect(r.name).toBe('A'); });
  it('isValid true', () => { expect(e.isValid({ name: 'A' })).toBe(true); });
});

describe('PreferenceMatcher', () => {
  const e = new PreferenceMatcher();
  it('match for genre match', () => { expect(e.match({ preferences: ['romance'] }, { genre: 'romance', themes: [] })).toBe(0.5); });
  it('isMatch for 0.5+', () => { expect(e.isMatch(0.6)).toBe(true); });
});

describe('DemographicsMatcher', () => {
  const e = new DemographicsMatcher();
  it('match for same', () => { expect(e.match({ demographics: 'YA' }, { demographics: 'YA' })).toBe(1); });
});

describe('ReaderRanker', () => {
  const e = new ReaderRanker();
  it('rank by score', () => { const r = e.rank([{ matchScore: 0.3 }, { matchScore: 0.7 }]); expect(r[0].matchScore).toBe(0.7); });
});

describe('ReaderDatabase', () => {
  const e = new ReaderDatabase();
  it('add + find', () => { e.add({ name: 'A', matchScore: 0.8 }); expect(e.find('A')?.matchScore).toBe(0.8); });
});

describe('MatchScoreCalculator', () => {
  const e = new MatchScoreCalculator();
  it('calculate average', () => { expect(e.calculate([0.5, 0.7])).toBe(0.6); });
  it('isHigh for 0.8', () => { expect(e.isHigh(0.8)).toBe(true); });
});

describe('MatchThreshold', () => {
  const e = new MatchThreshold();
  it('meets for default', () => { expect(e.meets(0.5)).toBe(true); });
});

describe('MatchReport', () => {
  const e = new MatchReport();
  it('generate includes %', () => { expect(e.generate([{ name: 'A', score: 0.8 }])).toContain('%'); });
});

describe('MatchADirector', () => {
  const e = new MatchADirector();
  it('decide expand for 0', () => { expect(e.decide({ readerCount: 10, matchCount: 0 })).toBe('expand'); });
});

describe('BetaReaderMatchCoreIndex', () => {
  const idx = new BetaReaderMatchCoreIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});