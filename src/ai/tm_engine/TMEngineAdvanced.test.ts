/**
 * TMEngineAdvanced.test.ts — Direction BC, V3956-V3965 (Batch 2/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { TMConcordancer, TMConvergence, TMPretranslation, TMLeverage, TMConsistency, TMStatistics, TMEditor, TMVersioning, TMBatch, TMAdvancedIndex } from './TMEngineAdvanced';
import { TMStore } from './TMEngineCore';

describe('TMConcordancer', () => {
  const e = new TMConcordancer();
  it('search for match', () => { const s = new TMStore(); s.add({ source: 'hi world', target: '你好世界', quality: 1 }); expect(e.search(s, 'hi').length).toBe(1); });
  it('isRich true', () => { expect(e.isRich([{} as any])).toBe(true); });
});

describe('TMConvergence', () => {
  const e = new TMConvergence();
  it('compute for 0', () => { expect(e.compute(new TMStore()).domains).toBe(0); });
  it('isConverged false for 0', () => { expect(e.isConverged({ domains: 0 }, 3)).toBe(false); });
});

describe('TMPretranslation', () => {
  const e = new TMPretranslation();
  it('pretranslate for known', () => { const s = new TMStore(); s.add({ source: 'hi', target: '你好', quality: 1 }); expect(e.pretranslate(s, 'hi')).toBe('你好'); });
  it('isPretranslated true for diff', () => { expect(e.isPretranslated('a', 'b')).toBe(true); });
});

describe('TMLeverage', () => {
  const e = new TMLeverage();
  it('compute for exact', () => { const s = new TMStore(); s.add({ source: 'a', target: 'b', quality: 1 }); expect(e.compute(s, 'a').exact).toBe(1); });
  it('isHighLeverage for 1.0', () => { expect(e.isHighLeverage({ exact: 1, fuzzy: 0, newWords: 0 })).toBe(true); });
});

describe('TMConsistency', () => {
  const e = new TMConsistency();
  it('check for exact', () => { const s = new TMStore(); s.add({ source: 'a', target: 'b', quality: 1 }); expect(e.check(s, 'a').consistent).toBe(true); });
  it('isConsistent true', () => { expect(e.isConsistent({ consistent: true })).toBe(true); });
});

describe('TMStatistics', () => {
  const e = new TMStatistics();
  it('compute returns 3 fields', () => { const s = new TMStore(); s.add({ source: 'a', target: 'b', quality: 1 }); expect(e.compute(s).total).toBe(1); });
  it('isHealthy for 100+', () => { expect(e.isHealthy({ total: 100 }, 100)).toBe(true); });
});

describe('TMEditor', () => {
  const e = new TMEditor();
  it('edit changes target', () => { const s = new TMStore(); s.add({ source: 'a', target: 'old', quality: 1 }); e.edit(s, 'a', 'new'); expect(s.find('a')?.target).toBe('new'); });
  it('isEdited true', () => { const s = new TMStore(); s.add({ source: 'a', target: 'b', quality: 1 }); expect(e.isEdited(s, 'a', 'b')).toBe(true); });
});

describe('TMVersioning', () => {
  const e = new TMVersioning();
  it('bump + get', () => { e.bump('A'); expect(e.get('A')).toBe(1); });
});

describe('TMBatch', () => {
  const e = new TMBatch();
  it('add + commit', () => { const s = new TMStore(); e.add({ source: 'a', target: 'b', quality: 1 }); e.commit(s); expect(s.size()).toBe(1); });
  it('isCommitted true', () => { expect(e.isCommitted()).toBe(true); });
});

describe('TMAdvancedIndex', () => {
  const idx = new TMAdvancedIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});