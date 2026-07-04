/**
 * TMEngineCore.test.ts — Direction BC, V3946-V3955 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { TMStore, TMIndexer, TMQuery, TMSegmenter, TMAlignment, TMQuality, TMContext, TMUpdate, TMExport, TMImport, TMCoreIndex, type TMEntry } from './TMEngineCore';

describe('TMStore', () => {
  const e = new TMStore();
  it('add + find', () => { e.add({ source: 'hello', target: '你好', quality: 1 }); expect(e.find('hello')?.target).toBe('你好'); });
  it('findFuzzy for similar', () => { e.add({ source: 'hello world', target: '你好世界', quality: 1 }); expect(e.findFuzzy('hello word')?.target).toBe('你好世界'); });
  it('size', () => { expect(e.size()).toBe(2); });
});

describe('TMIndexer', () => {
  const e = new TMIndexer();
  it('index returns pairs', () => { const s = new TMStore(); s.add({ source: 'a', target: 'b', quality: 1 }); expect(e.index(s)).toHaveLength(1); });
  it('isIndexed true', () => { const s = new TMStore(); s.add({ source: 'a', target: 'b', quality: 1 }); expect(e.isIndexed(s)).toBe(true); });
});

describe('TMQuery', () => {
  const e = new TMQuery();
  it('query for exact', () => { const s = new TMStore(); s.add({ source: 'hi', target: '你好', quality: 1 }); const r = e.query(s, 'hi'); expect(r.score).toBe(1); });
  it('isExact for 1.0', () => { expect(e.isExact({ score: 1 })).toBe(true); });
});

describe('TMSegmenter', () => {
  const e = new TMSegmenter();
  it('segment for 1', () => { const r = e.segment('hello world.', 5); expect(r.length).toBeGreaterThanOrEqual(1); });
  it('isValid true', () => { expect(e.isValid(['a'])).toBe(true); });
});

describe('TMAlignment', () => {
  const e = new TMAlignment();
  it('align for 2 pairs', () => { expect(e.align(['a', 'b'], ['x', 'y'])).toHaveLength(2); });
  it('isAligned true', () => { expect(e.isAligned([{ source: 'a', target: 'b' }])).toBe(true); });
});

describe('TMQuality', () => {
  const e = new TMQuality();
  it('quality for long', () => { expect(e.quality({ source: 'a'.repeat(50), target: 'b', quality: 1 })).toBeGreaterThan(0.5); });
  it('isHighQuality for 0.7+', () => { expect(e.isHighQuality(0.8)).toBe(true); });
});

describe('TMContext', () => {
  const e = new TMContext();
  it('addContext + hasContext', () => { const entry: TMEntry = { source: 'a', target: 'b', quality: 1 }; e.addContext(entry, 'chapter1'); expect(e.hasContext(entry)).toBe(true); });
});

describe('TMUpdate', () => {
  const e = new TMUpdate();
  it('update existing', () => { const s = new TMStore(); s.add({ source: 'a', target: 'old', quality: 1 }); e.update(s, 'a', { source: 'a', target: 'new', quality: 1 }); expect(s.find('a')?.target).toBe('new'); });
  it('isUpdated true', () => { const s = new TMStore(); s.add({ source: 'a', target: 'b', quality: 1 }); expect(e.isUpdated(s, 'a')).toBe(true); });
});

describe('TMExport', () => {
  const e = new TMExport();
  it('exportJSON for 1', () => { const s = new TMStore(); s.add({ source: 'a', target: 'b', quality: 1 }); expect(e.exportJSON(s)).toContain('a'); });
  it('isValidJSON true', () => { expect(e.isValidJSON('[]')).toBe(true); });
});

describe('TMImport', () => {
  const e = new TMImport();
  it('importJSON', () => { const s = new TMStore(); e.importJSON(s, '[{"source":"a","target":"b","quality":1}]'); expect(s.find('a')?.target).toBe('b'); });
  it('isValid true', () => { expect(e.isValid('[]')).toBe(true); });
});

describe('TMCoreIndex', () => {
  const idx = new TMCoreIndex();
  it('lists 10 engines', () => { expect(idx.count()).toBe(10); });
});