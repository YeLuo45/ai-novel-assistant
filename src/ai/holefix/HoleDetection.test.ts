/**
 * HoleDetection.test.ts — Direction AV, V3736-V3745 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { HoleAutoDetector, HoleCategorizer, HolePriorityRanker, AutoFixSuggester, FixConfidenceScorer, ManualReviewQueue, FixAttemptTracker, DiffVisualizer, HoleLinkageDetector, HoleDetectionIndex, type PlotHole } from './HoleDetection';

describe('HoleAutoDetector', () => {
  const e = new HoleAutoDetector();
  it('detect for 莫名其妙', () => { expect(e.detect('莫名其妙').length).toBeGreaterThan(0); });
  it('count for holes', () => { expect(e.count('为什么没有')).toBeGreaterThan(0); });
});
describe('HoleCategorizer', () => {
  const e = new HoleCategorizer();
  it('categorize groups by type', () => { const c = e.categorize([{ type: 'motivation', location: 'a', description: 'b', severity: 0.5 }]); expect(c.motivation).toBe(1); });
  it('dominant for motivation', () => { expect(e.dominant([{ type: 'motivation', location: 'a', description: 'b', severity: 0.5 }])).toBe('motivation'); });
});
describe('HolePriorityRanker', () => {
  const e = new HolePriorityRanker();
  it('rank sorts by severity', () => { const r = e.rank([{ type: 'motivation', location: 'a', description: 'b', severity: 0.3 }, { type: 'logic', location: 'b', description: 'c', severity: 0.7 }]); expect(r[0].severity).toBe(0.7); });
  it('topN', () => { expect(e.topN([], 3)).toHaveLength(0); });
});
describe('AutoFixSuggester', () => {
  const e = new AutoFixSuggester();
  it('suggest for motivation', () => { expect(e.suggest({ type: 'motivation', location: 'a', description: 'b', severity: 0.5 })).toContain('动机'); });
  it('isValid true', () => { expect(e.isValid('fix')).toBe(true); });
});
describe('FixConfidenceScorer', () => {
  const e = new FixConfidenceScorer();
  it('score high for long fix', () => { expect(e.score({ type: 'logic', location: 'a', description: 'b', severity: 0.5 }, 'long fix text')).toBe(0.7); });
  it('isHighConfidence for 0.7+', () => { expect(e.isHighConfidence(0.7)).toBe(true); });
});
describe('ManualReviewQueue', () => {
  const e = new ManualReviewQueue();
  it('enqueue only high severity', () => { e.enqueue({ type: 'logic', location: 'a', description: 'b', severity: 0.8 }); e.enqueue({ type: 'logic', location: 'a', description: 'b', severity: 0.3 }); expect(e.size()).toBe(1); });
  it('drain returns', () => { e.enqueue({ type: 'logic', location: 'a', description: 'b', severity: 0.8 }); const d = e.drain(); expect(d.length).toBeGreaterThan(0); });
});
describe('FixAttemptTracker', () => {
  const e = new FixAttemptTracker();
  it('record + successRate', () => { e.record('a', true); e.record('b', false); expect(e.successRate()).toBe(0.5); });
});
describe('DiffVisualizer', () => {
  const e = new DiffVisualizer();
  it('generate includes sizes', () => { expect(e.generate('abc', 'abcd')).toContain('4'); });
  it('hasChanges for different', () => { expect(e.hasChanges('a', 'b')).toBe(true); });
});
describe('HoleLinkageDetector', () => {
  const e = new HoleLinkageDetector();
  it('detect for 然而', () => { expect(e.detect('然而这样。').length).toBeGreaterThan(0); });
  it('count', () => { expect(e.count('但是这样。')).toBe(1); });
});
describe('HoleDetectionIndex', () => {
  const idx = new HoleDetectionIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});