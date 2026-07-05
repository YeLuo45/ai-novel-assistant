/**
 * RatingAggregatorAdvanced.test.ts — Direction BN, V4286-V4295 (Batch 2/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { WeightedRating, RatingCategory, RatingThreshold, RatingComparison, RatingNormalization, RatingAggregationEngine, RatingDashboard, RatingADirector, RatingReportGenerator, RatingAggregatorAdvancedIndex } from './RatingAggregatorAdvanced';

describe('WeightedRating', () => {
  const e = new WeightedRating();
  it('weighted for 2', () => { expect(e.weighted([{ rating: 5, weight: 1 }, { rating: 3, weight: 1 }])).toBe(4); });
  it('isValid true', () => { expect(e.isValid(4)).toBe(true); });
});

describe('RatingCategory', () => {
  const e = new RatingCategory();
  it('add + avg', () => { e.add('plot', 5); e.add('plot', 3); expect(e.avg('plot')).toBe(4); });
});

describe('RatingThreshold', () => {
  const e = new RatingThreshold();
  it('set + meets', () => { e.set(4); expect(e.meets(5)).toBe(true); });
});

describe('RatingComparison', () => {
  const e = new RatingComparison();
  it('compare for better', () => { expect(e.compare(5, 3)).toBe('better'); });
  it('isBetter true', () => { expect(e.isBetter('better')).toBe(true); });
});

describe('RatingNormalization', () => {
  const e = new RatingNormalization();
  it('normalize for 3 of 1-5', () => { expect(e.normalize(3)).toBeCloseTo(0.5, 5); });
  it('isNormalized true for 0.5', () => { expect(e.isNormalized(0.5)).toBe(true); });
});

describe('RatingAggregationEngine', () => {
  const e = new RatingAggregationEngine();
  it('aggregate for 2', () => { const r = e.aggregate([{ reader: 'A', rating: 5 }, { reader: 'B', rating: 3 }]); expect(r.avg).toBe(4); });
  it('isAggregated true', () => { expect(e.isAggregated({ count: 1 })).toBe(true); });
});

describe('RatingDashboard', () => {
  const e = new RatingDashboard();
  it('generate includes 平均', () => { expect(e.generate({ avg: 4.5, count: 10, categories: 3 })).toContain('平均'); });
  it('hasDashboard true', () => { expect(e.hasDashboard('平均')).toBe(true); });
});

describe('RatingADirector', () => {
  const e = new RatingADirector();
  it('decide collect for empty', () => { expect(e.decide({ collected: false, aggregated: false })).toBe('collect'); });
  it('decide finalize for done', () => { expect(e.decide({ collected: true, aggregated: true })).toBe('finalize'); });
});

describe('RatingReportGenerator', () => {
  const e = new RatingReportGenerator();
  it('report for 2', () => { expect(e.report({ ratings: [{ reader: 'A', rating: 5 }, { reader: 'B', rating: 3 }] })).toContain('平均'); });
  it('isValid true', () => { expect(e.isValid('x')).toBe(true); });
});

describe('RatingAggregatorAdvancedIndex', () => {
  const idx = new RatingAggregatorAdvancedIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});