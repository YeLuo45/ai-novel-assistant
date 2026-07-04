/**
 * TranslationCore.test.ts — Direction AU, V3706-V3715 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { CulturalReferenceDetector, IdiomaticExpressionDetector, WordplayDetector, NameAdaptabilityChecker, CulturalSensitivityScanner, HonorificTracker, TranslationLengthEstimator, LocaleAdaptability, SlangDetector, TranslationCoreIndex } from './TranslationCore';

describe('CulturalReferenceDetector', () => {
  const e = new CulturalReferenceDetector();
  it('detect for 饺子', () => { expect(e.detect('吃饺子').length).toBeGreaterThan(0); });
  it('count for 春节', () => { expect(e.count('春节快乐')).toBe(1); });
});
describe('IdiomaticExpressionDetector', () => {
  const e = new IdiomaticExpressionDetector();
  it('detect idiom', () => { expect(e.detect('说曹操').length).toBe(1); });
  it('isIdiomatic true', () => { expect(e.isIdiomatic('idiom:xx')).toBe(true); });
});
describe('WordplayDetector', () => {
  const e = new WordplayDetector();
  it('detect for 谐音', () => { expect(e.detect('一语双关和谐音')).toBe(true); });
  it('isLostInTranslation true', () => { expect(e.isLostInTranslation('一语双关')).toBe(true); });
});
describe('NameAdaptabilityChecker', () => {
  const e = new NameAdaptabilityChecker();
  it('check for translatable', () => { const r = e.check('Alice'); expect(r.translatable).toBe(true); });
  it('isAdaptable for English', () => { expect(e.isAdaptable('Alice')).toBe(true); });
});
describe('CulturalSensitivityScanner', () => {
  const e = new CulturalSensitivityScanner();
  it('scan for 歧视', () => { expect(e.scan('歧视文本').length).toBe(1); });
  it('hasIssues true', () => { expect(e.hasIssues('歧视')).toBe(true); });
});
describe('HonorificTracker', () => {
  const e = new HonorificTracker();
  it('track counts formal/informal', () => { const r = e.track('先生女士'); expect(r.formal).toBe(2); });
  it('isFormal for more formal', () => { expect(e.isFormal({ formal: 2, informal: 1 })).toBe(true); });
});
describe('TranslationLengthEstimator', () => {
  const e = new TranslationLengthEstimator();
  it('estimate en = 1.5x', () => { expect(e.estimate('a'.repeat(100), 'en')).toBe(150); });
  it('fitsInBudget true for small', () => { expect(e.fitsInBudget('short', 'en', 100)).toBe(true); });
});
describe('LocaleAdaptability', () => {
  const e = new LocaleAdaptability();
  it('adapt prepends locale', () => { expect(e.adapt('hi', 'en')).toContain('[en]'); });
  it('isAdapted true', () => { expect(e.isAdapted('[en] hi')).toBe(true); });
});
describe('SlangDetector', () => {
  const e = new SlangDetector();
  it('detect for 装逼', () => { expect(e.detect('装逼').length).toBe(1); });
  it('isSlang true', () => { expect(e.isSlang('slang:x')).toBe(true); });
});
describe('TranslationCoreIndex', () => {
  const idx = new TranslationCoreIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});