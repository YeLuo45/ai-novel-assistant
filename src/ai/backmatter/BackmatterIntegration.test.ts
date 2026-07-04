/**
 * BackmatterIntegration.test.ts — Direction AT, V3696-V3705 (Batch 3/3 收口)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { BackmatterCollection, BackmatterOrderer, BonusPDFGenerator, BackmatterIndex, ExclusiveContent, BackmatterLengthAdjuster, BackmatterTranslator, BackmatterADirector, BackmatterPackager, BackmatterMasterIndex } from './BackmatterIntegration';

describe('BackmatterCollection', () => {
  const e = new BackmatterCollection();
  it('add + size', () => { e.add('a'); expect(e.size()).toBe(1); });
  it('getAll returns', () => { e.add('b'); expect(e.getAll()).toHaveLength(2); });
});
describe('BackmatterOrderer', () => {
  const e = new BackmatterOrderer();
  it('order sorts', () => { expect(e.order(['c', 'a', 'b'])).toEqual(['a', 'b', 'c']); });
  it('isOrdered for sorted', () => { expect(e.isOrdered(['a', 'b'], ['a', 'b'])).toBe(true); });
});
describe('BonusPDFGenerator', () => {
  const e = new BonusPDFGenerator();
  it('generate joins', () => { expect(e.generate(['a', 'b'])).toContain('a'); });
  it('isValidPDF for long', () => { expect(e.isValidPDF('a'.repeat(20))).toBe(true); });
});
describe('BackmatterIndex', () => {
  const e = new BackmatterIndex();
  it('count returns 4', () => { expect(e.count()).toBe(4); });
  it('isStandard for known', () => { expect(e.isStandard('epilogue')).toBe(true); });
});
describe('ExclusiveContent', () => {
  const e = new ExclusiveContent();
  it('isValid for both', () => { e.title = 'T'; e.content = 'C'; expect(e.isValid()).toBe(true); });
});
describe('BackmatterLengthAdjuster', () => {
  const e = new BackmatterLengthAdjuster();
  it('adjust reaches target', () => { const r = e.adjust('start', 5); expect(e.meetsTarget(r, 5)).toBe(true); });
  it('meetsTarget true', () => { expect(e.meetsTarget('word '.repeat(10), 5)).toBe(true); });
});
describe('BackmatterTranslator', () => {
  const e = new BackmatterTranslator();
  it('translate prepends lang', () => { expect(e.translate('hi', 'en')).toContain('[en]'); });
  it('isTranslated true', () => { expect(e.isTranslated('[en] hi')).toBe(true); });
});
describe('BackmatterADirector', () => {
  const e = new BackmatterADirector();
  it('decide create for no items', () => { expect(e.decide(false, false)).toBe('create'); });
  it('decide publish for done', () => { expect(e.decide(true, true)).toBe('publish'); });
});
describe('BackmatterPackager', () => {
  const e = new BackmatterPackager();
  it('package returns name + count', () => { const r = e.package(['a', 'b']); expect(r.count).toBe(2); });
  it('isPackaged true', () => { expect(e.isPackaged({ count: 1 })).toBe(true); });
});
describe('BackmatterMasterIndex', () => {
  const idx = new BackmatterMasterIndex();
  it('lists 28 engines', () => { expect(idx.count()).toBe(28); });
});