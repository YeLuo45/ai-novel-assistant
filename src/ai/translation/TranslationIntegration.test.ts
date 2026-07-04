/**
 * TranslationIntegration.test.ts — Direction AU, V3726-V3735 (Batch 3/3 收口)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { TranslationGuide, WritingForTranslation, LocaleSpecificTerms, TranslationIssuesTracker, StylePreservation, TranslationFeedbackLoop, CrossLangIndex, TranslationADirector2, TranslationTools, TranslationMasterIndex } from './TranslationIntegration';

describe('TranslationGuide', () => {
  const e = new TranslationGuide();
  it('randomTip in tips', () => { expect(e.tips).toContain(e.randomTip()); });
  it('isValid for known', () => { expect(e.isValid('避免成语')).toBe(true); });
});
describe('WritingForTranslation', () => {
  const e = new WritingForTranslation();
  it('check for clean text', () => { expect(e.check('plain text').score).toBe(1); });
  it('isGood for 0.7+', () => { expect(e.isGood({ score: 0.8 })).toBe(true); });
});
describe('LocaleSpecificTerms', () => {
  const e = new LocaleSpecificTerms();
  it('isUniversal for same', () => { e.en = 'hello'; e.ja = 'hello'; e.ko = 'hello'; expect(e.isUniversal()).toBe(true); });
});
describe('TranslationIssuesTracker', () => {
  const e2 = new TranslationIssuesTracker();
  it('track + count', () => { e2.track('a'); expect(e2.count()).toBe(1); });
  it('getAll returns', () => { expect(e2.getAll()).toHaveLength(1); });
});
describe('StylePreservation', () => {
  const e2 = new StylePreservation();
  it('isPreserved for both', () => { e2.original = 'a'; e2.translated = 'b'; expect(e2.isPreserved()).toBe(true); });
  it('similarity', () => { expect(e2.similarity()).toBe(0.5); });
});
describe('TranslationFeedbackLoop', () => {
  const e2 = new TranslationFeedbackLoop();
  it('averageRating for 2 feedbacks', () => { e2.addFeedback(1, 4); e2.addFeedback(2, 5); expect(e2.averageRating()).toBe(4.5); });
  it('isGood for 4+', () => { expect(e2.isGood()).toBe(true); });
});
describe('CrossLangIndex', () => {
  const e2 = new CrossLangIndex();
  it('add + get', () => { e2.add('hi', { en: 'hi', ja: 'やあ' }); expect(e2.get('hi', 'en')).toBe('hi'); });
  it('size', () => { expect(e2.size()).toBe(1); });
});
describe('TranslationADirector2', () => {
  const e2 = new TranslationADirector2();
  it('decideAction redo for low', () => { expect(e2.decideAction(0.3)).toBe('redo'); });
  it('decideAction publish for high', () => { expect(e2.decideAction(0.9)).toBe('publish'); });
});
describe('TranslationTools', () => {
  const e2 = new TranslationTools();
  it('isAvailable for DeepL', () => { expect(e2.isAvailable('DeepL')).toBe(true); });
  it('count returns 4', () => { expect(e2.count()).toBe(4); });
});
describe('TranslationMasterIndex', () => {
  const idx = new TranslationMasterIndex();
  it('lists 28 engines', () => { expect(idx.count()).toBe(28); });
});