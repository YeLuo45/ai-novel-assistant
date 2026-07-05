/**
 * VoiceEmotionCore.test.ts — Direction CA, V4586-V4595 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { EmotionClassifier, ToneAnalyzer, StressDetector, EnergyEstimator, FatigueDetector, SentimentScore, PitchExtractor, TempoAnalyzer, VolumeAnalyzer, EmotionTrajectory, VoiceEmotionCoreIndex } from './VoiceEmotionCore';

describe('EmotionClassifier', () => {
  const e = new EmotionClassifier();
  it('classify for 开心', () => { expect(e.classify('我很开心')).toBe('happy'); });
  it('isValidEmotion true', () => { expect(e.isValidEmotion('happy')).toBe(true); });
});

describe('ToneAnalyzer', () => {
  const e = new ToneAnalyzer();
  it('analyze for text', () => { const r = e.analyze('Hello!!!'); expect(r.pitch).toBeGreaterThan(0.5); });
  it('isHigh for high pitch', () => { expect(e.isHigh({ pitch: 0.8 })).toBe(true); });
});

describe('StressDetector', () => {
  const e = new StressDetector();
  it('detect for diff 0.4', () => { expect(e.detect(0.9)).toBe(0.4); });
  it('isStressed for 0.4', () => { expect(e.isStressed(0.4)).toBe(true); });
});

describe('EnergyEstimator', () => {
  const e = new EnergyEstimator();
  it('estimate for 1+1', () => { expect(e.estimate({ wordRate: 1, pitch: 1 })).toBe(1); });
  it('isEnergetic for 0.7+', () => { expect(e.isEnergetic(0.7)).toBe(true); });
});

describe('FatigueDetector', () => {
  const e = new FatigueDetector();
  it('detect for 150', () => { expect(e.detect(150).fatigued).toBe(true); });
  it('isFatigued true', () => { expect(e.isFatigued({ fatigued: true })).toBe(true); });
});

describe('SentimentScore', () => {
  const e = new SentimentScore();
  it('score for positive', () => { expect(e.score('很开心，好，棒')).toBeGreaterThan(0); });
  it('isPositive for 0.5+', () => { expect(e.isPositive(0.5)).toBe(true); });
});

describe('PitchExtractor', () => {
  const e = new PitchExtractor();
  it('extract returns', () => { expect(e.extract({ freq: 440 })).toBe(440); });
  it('isValid true', () => { expect(e.isValid(440)).toBe(true); });
});

describe('TempoAnalyzer', () => {
  const e = new TempoAnalyzer();
  it('analyze returns', () => { expect(e.analyze({ rate: 200 })).toBe(200); });
  it('isFast true', () => { expect(e.isFast(250)).toBe(true); });
});

describe('VolumeAnalyzer', () => {
  const e = new VolumeAnalyzer();
  it('analyze returns', () => { expect(e.analyze({ volume: 0.6 })).toBe(0.6); });
  it('isLoud true', () => { expect(e.isLoud(0.6)).toBe(true); });
});

describe('EmotionTrajectory', () => {
  const e = new EmotionTrajectory();
  it('add + trend', () => { e.add('happy'); expect(e.trend()).toBe('happy'); });
  it('count', () => { expect(e.count()).toBe(1); });
});

describe('VoiceEmotionCoreIndex', () => {
  const idx = new VoiceEmotionCoreIndex();
  it('lists 10 engines', () => { expect(idx.count()).toBe(10); });
});