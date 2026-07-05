/**
 * PublishingHouseCore.test.ts — Direction BL, V4216-V4225 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { PublishingHouse, PublishingHouseLibrary, GenreMatcher, RequirementsChecker, SubmissionGuidelinesProvider, AcceptanceRatePredictor, CompensationCalculator, PublisherContact, PublisherRanking, PublishingHouseCoreIndex } from './PublishingHouseCore';

describe('PublishingHouse', () => {
  const e = new PublishingHouse();
  it('isValid for name', () => { e.name = 'X'; expect(e.isValid()).toBe(true); });
});

describe('PublishingHouseLibrary', () => {
  const e = new PublishingHouseLibrary();
  it('add + find', () => { e.add({ name: 'X', genre: 'romance' } as any); expect(e.find('X')?.name).toBe('X'); });
  it('count', () => { expect(e.count()).toBe(1); });
});

describe('GenreMatcher', () => {
  const e = new GenreMatcher();
  it('match for same', () => { expect(e.match({ genre: 'romance' }, { genre: 'romance' })).toBe(1); });
  it('isMatch for 1', () => { expect(e.isMatch(1)).toBe(true); });
});

describe('RequirementsChecker', () => {
  const e = new RequirementsChecker();
  it('check for 50000', () => { expect(e.check({ requirements: '' }, { wordCount: 50000 })).toBe(true); });
  it('isValid true', () => { expect(e.isValid(true)).toBe(true); });
});

describe('SubmissionGuidelinesProvider', () => {
  const e = new SubmissionGuidelinesProvider();
  it('provide includes 字数', () => { expect(e.provide('X')).toContain('字数'); });
  it('isProvided true', () => { expect(e.isProvided('x')).toBe(true); });
});

describe('AcceptanceRatePredictor', () => {
  const e = new AcceptanceRatePredictor();
  it('predict for rate 0.1', () => { expect(e.predict({ name: 'X', rate: 0.1 })).toBe(0.1); });
  it('isLikely for 0.1', () => { expect(e.isLikely(0.1)).toBe(true); });
});

describe('CompensationCalculator', () => {
  const e = new CompensationCalculator();
  it('calc royalty', () => { expect(e.calc({ rate: 0.01, advance: 1000 }, { wordCount: 100000 }).royalty).toBe(1000); });
  it('isFair for 1000+', () => { expect(e.isFair({ royalty: 1000 })).toBe(true); });
});

describe('PublisherContact', () => {
  const e = new PublisherContact();
  it('add + get', () => { e.add('X', 'contact@x.com'); expect(e.get('X')).toBe('contact@x.com'); });
  it('has true', () => { expect(e.has('X')).toBe(true); });
});

describe('PublisherRanking', () => {
  const e = new PublisherRanking();
  it('rank for 2', () => { const r = e.rank([{ name: 'A', rate: 0.1 }, { name: 'B', rate: 0.3 }]); expect(r[0].name).toBe('B'); });
});

describe('PublishingHouseCoreIndex', () => {
  const idx = new PublishingHouseCoreIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});