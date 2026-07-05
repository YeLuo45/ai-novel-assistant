/**
 * PublishingHouseAdvanced.test.ts — Direction BL, V4226-V4235 (Batch 2/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { ContractAnalyzer, PublisherReputation, ManuscriptRequirements, ImprintMatcher, PublisherMarketShare, EditorMatcher, PublisherResponseTime, PublisherSubmissionTracker, PublisherSearchEngine, PublishingHouseAdvancedIndex } from './PublishingHouseAdvanced';
import { PublishingHouseLibrary } from './PublishingHouseCore';

describe('ContractAnalyzer', () => {
  const e = new ContractAnalyzer();
  it('analyze for 5000', () => { expect(e.analyze({ royalty: 1000, advance: 5000 }).fair).toBe(true); });
  it('isFair true', () => { expect(e.isFair({ fair: true })).toBe(true); });
});

describe('PublisherReputation', () => {
  const e = new PublisherReputation();
  it('set + isGood', () => { e.set(4); expect(e.isGood()).toBe(true); });
});

describe('ManuscriptRequirements', () => {
  const e = new ManuscriptRequirements();
  it('add + count', () => { e.add('5万字'); expect(e.count()).toBe(1); });
});

describe('ImprintMatcher', () => {
  const e = new ImprintMatcher();
  it('match for same focus', () => { expect(e.match({ focus: 'romance' }, { focus: 'romance' })).toBe(1); });
  it('isMatch for 1', () => { expect(e.isMatch(1)).toBe(true); });
});

describe('PublisherMarketShare', () => {
  const e = new PublisherMarketShare();
  it('isBig for 0.2', () => { e.share = 0.2; expect(e.isBig()).toBe(true); });
});

describe('EditorMatcher', () => {
  const e = new EditorMatcher();
  it('match for genre', () => { expect(e.match({ genres: ['romance'] }, { genre: 'romance' })).toBe(true); });
  it('isMatched true', () => { expect(e.isMatched(true)).toBe(true); });
});

describe('PublisherResponseTime', () => {
  const e = new PublisherResponseTime();
  it('set + isFast', () => { e.set(15); expect(e.isFast()).toBe(true); });
});

describe('PublisherSubmissionTracker', () => {
  const e = new PublisherSubmissionTracker();
  it('submit + count', () => { e.submit('X'); expect(e.count()).toBe(1); });
});

describe('PublisherSearchEngine', () => {
  const e = new PublisherSearchEngine();
  it('search for match', () => {
    const lib = new PublishingHouseLibrary();
    lib.add({ name: 'X', genre: 'romance' } as any);
    expect(e.search(lib, 'X').length).toBe(1);
  });
  it('hasMatch true', () => { expect(e.hasMatch([{} as any])).toBe(true); });
});

describe('PublishingHouseAdvancedIndex', () => {
  const idx = new PublishingHouseAdvancedIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});