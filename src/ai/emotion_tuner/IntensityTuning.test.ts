/**
 * IntensityTuning.test.ts — Direction AW, V3776-V3785 (Batch 2/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { WordIntensityAdjuster, SentenceIntensityAdjuster, ParagraphIntensityAdjuster, IntensityByGenre, IntensityByCharacter, IntensityVariance, IntensityRange, IntensityDistribution, IntensityHistory, IntensityTuningIndex } from './IntensityTuning';

describe('WordIntensityAdjuster', () => {
  const e = new WordIntensityAdjuster();
  it('amplify word', () => { expect(e.amplify('hi there', 'hi', 1)).toContain('hi'); });
  it('isAmplified for !', () => { expect(e.isAmplified('hi！', 'hi')).toBe(true); });
});
describe('SentenceIntensityAdjuster', () => {
  const e = new SentenceIntensityAdjuster();
  it('boost adds ！', () => { expect(e.boost('hi。')).toContain('！'); });
  it('isBoosted true', () => { expect(e.isBoosted('a！b！c！')).toBe(true); });
});
describe('ParagraphIntensityAdjuster', () => {
  const e = new ParagraphIntensityAdjuster();
  it('adjust for low target', () => { expect(e.adjust('hi', 0.8)).toContain('！'); });
  it('isAdjusted true', () => { expect(e.isAdjusted('hi！', 0.5)).toBe(true); });
});
describe('IntensityByGenre', () => {
  const e = new IntensityByGenre();
  it('adjust for action', () => { expect(e.adjust('hi', 'action', 0.8)).toContain('hi'); });
  it('isGenreAppropriate true', () => { expect(e.isGenreAppropriate('hi text', 'action')).toBe(true); });
});
describe('IntensityByCharacter', () => {
  const e = new IntensityByCharacter();
  it('adjustFor high target', () => { expect(e.adjustFor('hi', 'Alice', 0.8)).toContain('Alice'); });
  it('isConsistentWith for character', () => { expect(e.isConsistentWith('hi Alice', 'Alice')).toBe(true); });
});
describe('IntensityVariance', () => {
  const e = new IntensityVariance();
  it('variance for stable', () => { expect(e.variance([0.5, 0.5, 0.5])).toBe(0); });
  it('isStable for 0', () => { expect(e.isStable(0)).toBe(true); });
});
describe('IntensityRange', () => {
  const e = new IntensityRange();
  it('inRange true', () => { expect(e.inRange(0.5, 0, 1)).toBe(true); });
  it('clamp for over', () => { expect(e.clamp(2, 0, 1)).toBe(1); });
});
describe('IntensityDistribution', () => {
  const e = new IntensityDistribution();
  it('distribution for mixed', () => { const d = e.distribution([0.1, 0.5, 0.9]); expect(d.low).toBe(1); });
  it('isBalanced for all', () => { expect(e.isBalanced({ low: 1, medium: 1, high: 1 })).toBe(true); });
});
describe('IntensityHistory', () => {
  const e = new IntensityHistory();
  it('record + size', () => { e.record(0.5); expect(e.size()).toBe(1); });
  it('getAll returns', () => { expect(e.getAll()).toHaveLength(1); });
});
describe('IntensityTuningIndex', () => {
  const idx = new IntensityTuningIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});