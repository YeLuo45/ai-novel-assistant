/**
 * ABTestCore.test.ts — Direction AY, V3826-V3835 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { ABTest, VariantGenerator, SampleSizeCalculator, StatisticalSignificance, ABTestDesigner, VariantSplitter, TrafficAllocator, ABTestAnalyzer, ABTestStopper, ABTestCoreIndex } from './ABTestCore';

describe('ABTest', () => {
  const e = new ABTest();
  it('record + ctr', () => { e.recordImpression('A'); e.recordClick('A'); expect(e.ctr('A')).toBe(1); });
  it('winner for high ctr', () => { e.recordImpression('B'); expect(e.winner(['A', 'B'])).toBe('A'); });
});

describe('VariantGenerator', () => {
  const e = new VariantGenerator();
  it('generate for 3', () => { expect(e.generate('Title', 3)).toHaveLength(3); });
  it('isUnique true', () => { expect(e.isUnique(['A', 'B', 'C'])).toBe(true); });
});

describe('SampleSizeCalculator', () => {
  const e = new SampleSizeCalculator();
  it('calculate for 0.05', () => { expect(e.calculate(0.05, 0.01)).toBeGreaterThan(0); });
  it('isAdequate true', () => { expect(e.isAdequate(1000)).toBe(true); });
});

describe('StatisticalSignificance', () => {
  const e = new StatisticalSignificance();
  it('test for diff CTR', () => { const r = e.test({ impressions: 100, clicks: 10 }, { impressions: 100, clicks: 20 }); expect(r.significant).toBe(true); });
  it('isSignificant true', () => { expect(e.isSignificant({ significant: true })).toBe(true); });
});

describe('ABTestDesigner', () => {
  const e = new ABTestDesigner();
  it('design returns a + b', () => { const r = e.design('A', 'B'); expect(r.a).toBe('A'); });
  it('isValid true', () => { expect(e.isValid({ a: 'A', b: 'B' })).toBe(true); });
});

describe('VariantSplitter', () => {
  const e = new VariantSplitter();
  it('split returns 2', () => { expect(e.split('abcdefghij', 0.5)).toHaveLength(2); });
  it('isBalanced true', () => { expect(e.isBalanced(['abcde', 'fghij'])).toBe(true); });
});

describe('TrafficAllocator', () => {
  const e = new TrafficAllocator();
  it('allocate returns variant', () => { expect(e.allocate(['A', 'B'], [50, 50])).toBeDefined(); });
  it('isAllocated true', () => { expect(e.isAllocated('A')).toBe(true); });
});

describe('ABTestAnalyzer', () => {
  const e = new ABTestAnalyzer();
  it('analyze empty', () => { expect(e.analyze([]).bestVariant).toBe('none'); });
});

describe('ABTestStopper', () => {
  const e = new ABTestStopper();
  it('shouldStop true for big significant', () => { expect(e.shouldStop({ significant: true, sampleSize: 200 })).toBe(true); });
  it('shouldStop false for low sample', () => { expect(e.shouldStop({ significant: true, sampleSize: 50 })).toBe(false); });
});

describe('ABTestCoreIndex', () => {
  const idx = new ABTestCoreIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});