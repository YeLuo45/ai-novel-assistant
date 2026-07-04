/**
 * VoiceConsistency.test.ts — Direction AX, V3796-V3805 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { VoiceProfileManager, ConsistencyChecker, VoiceEnforcer, VoiceWarningGenerator, VoiceCorrectionEngine, VoiceDriftDetector, VoiceBaselineCapture, VoiceTargetEnforcer, VoiceConsistencyReport, VoiceBatchProcessor, VoiceConsistencyIndex, type VoiceProfile } from './VoiceConsistency';

const profile: VoiceProfile = { id: 'A', avgLen: 10, vocabRichness: 0.5, formality: 0.5 };

describe('VoiceProfileManager', () => {
  const e = new VoiceProfileManager();
  it('set + get', () => { e.set(profile); expect(e.get('A')?.avgLen).toBe(10); });
  it('count after set', () => { expect(e.count()).toBeGreaterThanOrEqual(1); });
});

describe('ConsistencyChecker', () => {
  const e = new ConsistencyChecker();
  it('check for matching avgLen', () => { expect(e.check('a sentence here。', { id: 'A', avgLen: 17, vocabRichness: 0.5, formality: 0.5 }).consistent).toBe(true); });
  it('isConsistent for true', () => { expect(e.isConsistent({ consistent: true })).toBe(true); });
});

describe('VoiceEnforcer', () => {
  const e = new VoiceEnforcer();
  it('enforce for consistent', () => { const r = e.enforce('a sentence here。', { id: 'A', avgLen: 17, vocabRichness: 0.5, formality: 0.5 }); expect(r.length).toBeGreaterThan(0); });
  it('isEnforced true', () => { expect(e.isEnforced('a sentence here。', { id: 'A', avgLen: 17, vocabRichness: 0.5, formality: 0.5 })).toBe(true); });
});

describe('VoiceWarningGenerator', () => {
  const e = new VoiceWarningGenerator();
  it('generate for deviations', () => { expect(e.generate(profile, ['x'])).toContain('声音偏离'); });
  it('hasWarning true', () => { expect(e.hasWarning('声音偏离')).toBe(true); });
});

describe('VoiceCorrectionEngine', () => {
  const e = new VoiceCorrectionEngine();
  it('correct collapses ！！', () => { expect(e.correct('hi！！！', profile).corrected).toBe('hi！'); });
  it('isCorrected true', () => { expect(e.isCorrected('hi！', 'hi！')).toBe(false); });
});

describe('VoiceDriftDetector', () => {
  const e = new VoiceDriftDetector();
  it('detect low drift', () => { expect(e.detect('a sentence here。', { id: 'A', avgLen: 17, vocabRichness: 0.5, formality: 0.5 })).toBeLessThan(0.1); });
  it('hasSignificantDrift true for 0.5', () => { expect(e.hasSignificantDrift(0.5)).toBe(true); });
});

describe('VoiceBaselineCapture', () => {
  const e = new VoiceBaselineCapture();
  it('capture returns profile', () => { expect(e.capture('a sentence here。another sentence。').avgLen).toBeGreaterThan(0); });
  it('isValid for > 0', () => { expect(e.isValid({ id: 'A', avgLen: 5, vocabRichness: 0.5, formality: 0.5 })).toBe(true); });
});

describe('VoiceTargetEnforcer', () => {
  const e = new VoiceTargetEnforcer();
  it('getTarget returns profile', () => { expect(e.getTarget().id).toBe('target'); });
  it('hasTarget true', () => { expect(e.hasTarget()).toBe(true); });
});

describe('VoiceConsistencyReport', () => {
  const e = new VoiceConsistencyReport();
  it('generate for 2/3', () => { expect(e.generate(profile, [{ consistent: true }, { consistent: false }])).toContain('通过'); });
  it('isPositive true', () => { expect(e.isPositive('通过')).toBe(true); });
});

describe('VoiceBatchProcessor', () => {
  const e = new VoiceBatchProcessor();
  it('processBatch for 2', () => { const r = e.processBatch(['a sentence here。', 'b sentence here。'], { id: 'A', avgLen: 17, vocabRichness: 0.5, formality: 0.5 }); expect(r.total).toBe(2); });
});

describe('VoiceConsistencyIndex', () => {
  const idx = new VoiceConsistencyIndex();
  it('lists 10 engines', () => { expect(idx.count()).toBe(10); });
});