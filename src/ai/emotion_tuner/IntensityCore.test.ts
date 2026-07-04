/**
 * IntensityCore.test.ts — Direction AW, V3766-V3775 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { EmotionIntensityScorer, IntensityAdjuster, EmotionPeakDetector, IntensityCalibrator, EmotionDynamics, EmotionCurveSmoother, MoodTransitioner, EmotionIntensityTuner, EmotionBalance, IntensityCoreIndex } from './IntensityCore';

describe('EmotionIntensityScorer', () => {
  const e = new EmotionIntensityScorer();
  it('score high for many !', () => { expect(e.score('hi！！！')).toBeGreaterThan(0); });
  it('isHigh for 0.7+', () => { expect(e.isHigh(0.8)).toBe(true); });
});
describe('IntensityAdjuster', () => {
  const e = new IntensityAdjuster();
  it('amplify adds !', () => { expect(e.amplify('hi', 2)).toContain('！'); });
  it('dampen removes !', () => { expect(e.dampen('hi！')).not.toContain('！'); });
});
describe('EmotionPeakDetector', () => {
  const e = new EmotionPeakDetector();
  it('detect for !', () => { const r = e.detect('hi！'); expect(r.intensity).toBeGreaterThan(0); });
  it('hasPeak true', () => { expect(e.hasPeak('hi！')).toBe(true); });
});
describe('IntensityCalibrator', () => {
  const e = new IntensityCalibrator();
  it('calibrate difference', () => { expect(e.calibrate(0.5, 0.3)).toBeCloseTo(0.2, 5); });
  it('isCalibrated true for 0', () => { expect(e.isCalibrated(0)).toBe(true); });
});
describe('EmotionDynamics', () => {
  const e = new EmotionDynamics();
  it('arc returns emotions', () => { expect(e.arc(['joy', 'sad'])).toHaveLength(2); });
  it('isMonotone for same', () => { expect(e.isMonotone(['joy', 'joy'])).toBe(true); });
});
describe('EmotionCurveSmoother', () => {
  const e = new EmotionCurveSmoother();
  it('smooth for [0.1, 0.9]', () => { expect(e.smooth([0.1, 0.9])).toHaveLength(2); });
});
describe('MoodTransitioner', () => {
  const e = new MoodTransitioner();
  it('transition joy→sadness = natural', () => { expect(e.transition('joy', 'sadness')).toBe('natural'); });
  it('isNatural for natural', () => { expect(e.isNatural('joy', 'sadness')).toBe(true); });
});
describe('EmotionIntensityTuner', () => {
  const e = new EmotionIntensityTuner();
  it('tune adds ! for low target', () => { expect(e.tune('hi', 0.8)).toContain('！'); });
  it('isTuned true', () => { expect(e.isTuned('hi！', 0.5)).toBe(true); });
});
describe('EmotionBalance', () => {
  const e = new EmotionBalance();
  it('balance for mixed', () => { const r = e.balance({ joy: 0.5, sadness: 0.5 }); expect(r.ratio).toBe(1); });
  it('isBalanced for both > 0', () => { expect(e.isBalanced({ positive: 0.5, negative: 0.5 })).toBe(true); });
});
describe('IntensityCoreIndex', () => {
  const idx = new IntensityCoreIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});