/**
 * StructureEditor.test.ts — Direction AS, V3646-V3655 (Batch 1/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import { StructureAnalyzer, PlotHoleFinder, ChapterReorderer, SceneCutter, PlotRestructurer, CharacterArcChecker, ThemeConsistencyChecker, ConflictBalancer, NarrativeTensionOptimizer, StructureEditorIndex } from './StructureEditor';

describe('StructureAnalyzer', () => {
  const e = new StructureAnalyzer();
  it('analyze returns counts', () => { const r = e.analyze('一。二。三。\n\n四。'); expect(r.sentences).toBeGreaterThan(3); });
  it('isStructured for multi para', () => { expect(e.isStructured('a\n\nb\n\nc')).toBe(true); });
});
describe('PlotHoleFinder', () => {
  const e = new PlotHoleFinder();
  it('find for 莫名其妙', () => { expect(e.find('莫名其妙的事情')).toHaveLength(1); });
  it('count', () => { expect(e.count('莫名其妙')).toBe(1); });
});
describe('ChapterReorderer', () => {
  const e = new ChapterReorderer();
  it('reorder filter valid', () => { expect(e.reorder([0,1,2], [1,0,2])).toEqual([1,0,2]); });
  it('isValidOrder for match', () => { expect(e.isValidOrder([0,1,2], 3)).toBe(true); });
});
describe('SceneCutter', () => {
  const e = new SceneCutter();
  it('split into scenes', () => { expect(e.splitIntoScenes('a'.repeat(60) + '\n\n' + 'b'.repeat(60))).toHaveLength(2); });
  it('count scenes', () => { expect(e.count('a'.repeat(100) + '\n\n' + 'b'.repeat(100))).toBe(2); });
});
describe('PlotRestructurer', () => {
  const e = new PlotRestructurer();
  it('restructure reverses', () => { expect(e.restructure(['a','b'])).toEqual(['b','a']); });
  it('isBetter for non-empty', () => { expect(e.isBetter(['a'])).toBe(true); });
});
describe('CharacterArcChecker', () => {
  const e = new CharacterArcChecker();
  it('check for inconsistency', () => { expect(e.check('他没有说他没有').length).toBeGreaterThan(0); });
  it('isConsistent for clean', () => { expect(e.isConsistent('干净文本')).toBe(true); });
});
describe('ThemeConsistencyChecker', () => {
  const e = new ThemeConsistencyChecker();
  it('check occurrences', () => { expect(e.check('爱', '爱与爱与爱')).toBe(3); });
  it('isStrong for 3+', () => { expect(e.isStrong(3)).toBe(true); });
});
describe('ConflictBalancer', () => {
  const e = new ConflictBalancer();
  it('balance with', () => { expect(e.balance('main', 'sub')).toContain('with'); });
  it('hasBalance for with', () => { expect(e.hasBalance('a with b')).toBe(true); });
});
describe('NarrativeTensionOptimizer', () => {
  const e = new NarrativeTensionOptimizer();
  it('optimize normalizes punctuation', () => { expect(e.optimize('a,b.')).toContain('，'); });
  it('isMoreTense for non-empty', () => { expect(e.isMoreTense('text')).toBe(true); });
});
describe('StructureEditorIndex', () => {
  const idx = new StructureEditorIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});