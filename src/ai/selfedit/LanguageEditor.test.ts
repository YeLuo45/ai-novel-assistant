/**
 * LanguageEditor.test.ts — Direction AS, V3656-V3665 (Batch 2/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { ProsePolisher, RedundancyRemover, VerbImprover, AdverbCutter, ClichéRemover, ToneAdjuster, SentenceVariety, ReadabilityScorer, DialogueTagger, LanguageEditorIndex } from './LanguageEditor';

describe('ProsePolisher', () => {
  const e = new ProsePolisher();
  it('polish trims', () => { expect(e.polish('  hello  ')).toBe('hello'); });
  it('polish removes 然后', () => { expect(e.polish('然后走')).toContain('接着'); });
  it('isPolished true', () => { expect(e.isPolished('a', 'bcd')).toBe(true); });
});
describe('RedundancyRemover', () => {
  const e = new RedundancyRemover();
  it('remove for 非常', () => { expect(e.remove('非常好')).not.toContain('非常'); });
  it('countRemoved', () => { expect(e.countRemoved('非常特别的')).toBe(2); });
});
describe('VerbImprover', () => {
  const e = new VerbImprover();
  it('improve 走→迈步', () => { expect(e.improve('他走')).toContain('迈步'); });
  it('isImproved for different', () => { expect(e.isImproved('a', 'b')).toBe(true); });
});
describe('AdverbCutter', () => {
  const e = new AdverbCutter();
  it('cut removes 地', () => { expect(e.cut('慢慢地')).not.toContain('地'); });
  it('isAdverbFree true', () => { expect(e.isAdverbFree('clean')).toBe(true); });
});
describe('ClichéRemover', () => {
  const e = new ClichéRemover();
  it('remove 他很帅', () => { expect(e.remove('他很帅')).not.toContain('很帅'); });
  it('isClean for clean', () => { expect(e.isClean('clean')).toBe(true); });
});
describe('ToneAdjuster', () => {
  const e = new ToneAdjuster();
  it('adjust prepends', () => { expect(e.adjust('hi', 'formal')).toContain('[formal]'); });
  it('hasTone true', () => { expect(e.hasTone('[formal] hi')).toBe(true); });
});
describe('SentenceVariety', () => {
  const e = new SentenceVariety();
  it('analyze for text', () => { expect(e.analyze('一句话。两句话。').avgLen).toBeGreaterThan(0); });
  it('isVaried for varied', () => { expect(e.isVaried({ avgLen: 10 })).toBe(true); });
});
describe('ReadabilityScorer', () => {
  const e = new ReadabilityScorer();
  it('score high for long', () => { expect(e.score('a'.repeat(1000))).toBe(1); });
  it('isReadable for 0.5+', () => { expect(e.isReadable(0.6)).toBe(true); });
});
describe('DialogueTagger', () => {
  const e = new DialogueTagger();
  it('tag includes quotes', () => { expect(e.tag('Alice', 'hi')).toContain('"'); });
  it('isValid for tag', () => { expect(e.isValid('Alice说："hi"')).toBe(true); });
});
describe('LanguageEditorIndex', () => {
  const idx = new LanguageEditorIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});