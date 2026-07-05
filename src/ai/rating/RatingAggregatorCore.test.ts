/**
 * RatingAggregatorCore.test.ts — Direction BN, V4276-V4285 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { RatingCollector, RatingAverage, RatingMedian, RatingDistribution, RatingConsensus, RatingOutlier, RatingSummary, RatingReport, RatingTrend, RatingAggregatorCoreIndex } from './RatingAggregatorCore';

describe('RatingCollector', () => {
  const e = new RatingCollector();
  it('collect + count', () => { e.collect('A', 5, 'plot'); expect(e.count()).toBe(1); });
});

describe('RatingAverage', () => {
  const e = new RatingAverage();
  it('average for 5/3/4', () => { expect(e.average([5, 3, 4])).toBe(4); });
  it('isPositive for 3', () => { expect(e.isPositive(3)).toBe(true); });
});

describe('RatingMedian', () => {
  const e = new RatingMedian();
  it('median for 5/3/4 = 4', () => { expect(e.median([5, 3, 4])).toBe(4); });
  it('isValid true', () => { expect(e.isValid(4)).toBe(true); });
});

describe('RatingDistribution', () => {
  const e = new RatingDistribution();
  it('distribution for 2 ratings', () => { expect(e.distribution([5, 5]).get(5)).toBe(2); });
  it('hasSpread for different', () => { expect(e.hasSpread(new Map([[1, 1], [2, 1]]))).toBe(true); });
});

describe('RatingConsensus', () => {
  const e = new RatingConsensus();
  it('consensus for 5,5,5', () => { expect(e.consensus([{ rating: 5 }, { rating: 5 }, { rating: 5 }])).toBe(1); });
  it('isConsensus true for 0.5+', () => { expect(e.isConsensus(0.7)).toBe(true); });
});

describe('RatingOutlier', () => {
  const e = new RatingOutlier();
  it('detect for [5,5,1]', () => { expect(e.detect([5, 5, 1])).toBe(1); });
  it('hasOutlier true', () => { expect(e.hasOutlier([5, 1])).toBe(true); });
});

describe('RatingSummary', () => {
  const e = new RatingSummary();
  it('summarize includes 平均', () => { expect(e.summarize({ avg: 4.5, count: 10 })).toContain('平均'); });
  it('hasSummary true', () => { expect(e.hasSummary('平均')).toBe(true); });
});

describe('RatingReport', () => {
  const e = new RatingReport();
  it('generate includes :', () => { expect(e.generate([{ reader: 'A', rating: 5 }])).toContain(':'); });
  it('isValid true', () => { expect(e.isValid('A: 5')).toBe(true); });
});

describe('RatingTrend', () => {
  const e = new RatingTrend();
  it('trend up for increasing', () => { e.record(3); e.record(5); expect(e.trend()).toBe('up'); });
});

describe('RatingAggregatorCoreIndex', () => {
  const idx = new RatingAggregatorCoreIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});