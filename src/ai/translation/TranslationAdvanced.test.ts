/**
 * TranslationAdvanced.test.ts — Direction AU, V3716-V3725 (Batch 2/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { MultilingualCoherence, TranslationGlossary, ParallelTextGenerator, TranslatorNotes, LanguagePair, TranslationProject, TMEntry, TranslationMemory, TranslationADirector, TranslationAdvancedIndex } from './TranslationAdvanced';

describe('MultilingualCoherence', () => {
  const e = new MultilingualCoherence();
  it('add + get', () => { e.add('en', 'hello'); expect(e.get('en')).toBe('hello'); });
  it('hasAll true', () => { e.add('ja', 'こんにちは'); expect(e.hasAll(['en', 'ja'])).toBe(true); });
});
describe('TranslationGlossary', () => {
  const e = new TranslationGlossary();
  it('add + getTarget', () => { e.add('你好', 'hello'); expect(e.getTarget('你好')).toBe('hello'); });
  it('size', () => { expect(e.size()).toBe(1); });
});
describe('ParallelTextGenerator', () => {
  const e = new ParallelTextGenerator();
  it('generate includes both', () => { expect(e.generate('hi', 'やあ')).toContain('EN:'); });
  it('isParallel true', () => { expect(e.isParallel('EN: hi\nJA: やあ')).toBe(true); });
});
describe('TranslatorNotes', () => {
  const e = new TranslatorNotes();
  it('addNote + hasNote', () => { e.addNote('a', 'b', '[translator: note]'); expect(e.hasNote('[translator: note]')).toBe(true); });
});
describe('LanguagePair', () => {
  it('isReversed for en→zh', () => { expect(new LanguagePair('en', 'zh').isReversed()).toBe(true); });
});
describe('TranslationProject', () => {
  const e = new TranslationProject();
  it('addPage + totalPages', () => { e.addPage('p1'); e.addPage('p2'); expect(e.totalPages()).toBe(2); });
  it('getPages returns', () => { expect(e.getPages()).toHaveLength(2); });
});
describe('TMEntry', () => {
  it('isReliable for 0.8+', () => { const e = new TMEntry(); e.quality = 0.9; expect(e.isReliable()).toBe(true); });
});
describe('TranslationMemory', () => {
  const e = new TranslationMemory();
  it('add + find', () => { const entry = new TMEntry(); entry.source = 'a'; entry.target = 'b'; e.add(entry); expect(e.find('a')?.target).toBe('b'); });
  it('size', () => { expect(e.size()).toBe(1); });
});
describe('TranslationADirector', () => {
  const e = new TranslationADirector();
  it('decide create_glossary for no glossary', () => { expect(e.decide({ chaptersTranslated: 5, totalChapters: 10, hasGlossary: false })).toBe('create_glossary'); });
  it('decide finalize for done', () => { expect(e.decide({ chaptersTranslated: 10, totalChapters: 10, hasGlossary: true })).toBe('finalize'); });
});
describe('TranslationAdvancedIndex', () => {
  const idx = new TranslationAdvancedIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});