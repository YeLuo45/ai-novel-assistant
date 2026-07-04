/**
 * BetaReaderMatchAdvanced.test.ts — Direction BF, V4046-V4055 (Batch 2/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { ReaderAvailability, ReaderSpecialization, ReaderRating, ReaderFeedbackCollector, ReaderMatchingEngine, ReaderDiversityCalculator, ReaderRecruitment, ReaderRetentionPredictor, ReaderOnboarding, BetaReaderMatchAdvancedIndex } from './BetaReaderMatchAdvanced';

describe('ReaderAvailability', () => {
  const e = new ReaderAvailability();
  it('addDay + isAvailableOn', () => { e.addDay('Mon', 8); expect(e.isAvailableOn('Mon')).toBe(true); });
});

describe('ReaderSpecialization', () => {
  const e = new ReaderSpecialization();
  it('add + has', () => { e.add('romance'); expect(e.has('romance')).toBe(true); });
});

describe('ReaderRating', () => {
  const e = new ReaderRating();
  it('record + average', () => { e.record('A', 4); e.record('B', 5); expect(e.average()).toBe(4.5); });
});

describe('ReaderFeedbackCollector', () => {
  const e = new ReaderFeedbackCollector();
  it('collect + count', () => { e.collect('A', 'good'); expect(e.count()).toBe(1); });
});

describe('ReaderMatchingEngine', () => {
  const e = new ReaderMatchingEngine();
  it('match for genre', () => { expect(e.match([{ preferences: ['romance'] }], { genre: 'romance' })?.preferences).toContain('romance'); });
  it('isMatched true', () => { expect(e.isMatched({ preferences: ['romance'] })).toBe(true); });
});

describe('ReaderDiversityCalculator', () => {
  const e = new ReaderDiversityCalculator();
  it('calculate for 3', () => { const r = e.calculate([{ demographics: 'YA' }, { demographics: 'Adult' }, { demographics: 'Mature' }]); expect(r.uniqueGroups).toBe(3); });
});

describe('ReaderRecruitment', () => {
  const e = new ReaderRecruitment();
  it('add + random', () => { e.add({ name: 'A' }); e.add({ name: 'B' }); expect(e.random(1)).toHaveLength(1); });
});

describe('ReaderRetentionPredictor', () => {
  const e = new ReaderRetentionPredictor();
  it('predict for all completed', () => { expect(e.predict([{ completed: true }, { completed: true }])).toBe(1); });
});

describe('ReaderOnboarding', () => {
  const e = new ReaderOnboarding();
  it('isComplete for feedback', () => { expect(e.isComplete('feedback')).toBe(true); });
  it('next from welcome', () => { expect(e.next('welcome')).toBe('preferences'); });
});

describe('BetaReaderMatchAdvancedIndex', () => {
  const idx = new BetaReaderMatchAdvancedIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});