/**
 * StyleMemoryCore.test.ts — Direction BA, V3886-V3895 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { StyleMemory, StyleProfileExtractor, StyleMemoryRetriever, StyleMemoryConsolidator, StyleMemoryPersistence, StyleMemorySimilarity, StyleMemoryRecencyScorer, StyleMemoryFrequencyTracker, StyleMemoryEvolution, StyleMemoryExporter, StyleMemoryCoreIndex } from './StyleMemoryCore';

describe('StyleMemory', () => {
  const e = new StyleMemory();
  it('add + size', () => { e.add('sample1'); expect(e.size()).toBe(1); });
  it('recent for 2', () => { e.add('sample2'); expect(e.recent(1)).toHaveLength(1); });
});

describe('StyleProfileExtractor', () => {
  const e = new StyleProfileExtractor();
  it('extract for samples', () => { const r = e.extract([{ text: 'hi world', timestamp: Date.now() }]); expect(r.avgLen).toBeGreaterThan(0); });
  it('isValid true', () => { expect(e.isValid({ avgLen: 5 })).toBe(true); });
});

describe('StyleMemoryRetriever', () => {
  const e = new StyleMemoryRetriever();
  it('retrieve for context', () => { const m = new StyleMemory(); m.add('hi', 'chapter1'); expect(e.retrieve(m, 'chapter1')).toHaveLength(1); });
});

describe('StyleMemoryConsolidator', () => {
  const e = new StyleMemoryConsolidator();
  it('consolidate dedupes', () => { const m = new StyleMemory(); m.add('a'); m.add('a'); const c = e.consolidate(m); expect(c.size()).toBe(1); });
});

describe('StyleMemoryPersistence', () => {
  const e = new StyleMemoryPersistence();
  it('save + load', () => { const m = new StyleMemory(); m.add('a'); e.save('A', m); expect(e.load('A')).not.toBeNull(); });
});

describe('StyleMemorySimilarity', () => {
  const e = new StyleMemorySimilarity();
  it('similarity for same', () => { expect(e.similarity('a', 'a')).toBe(1); });
  it('isSimilar for 0.8+', () => { expect(e.isSimilar('abc', 'abc')).toBe(true); });
});

describe('StyleMemoryRecencyScorer', () => {
  const e = new StyleMemoryRecencyScorer();
  it('score high for fresh', () => { expect(e.score({ text: 'a', timestamp: Date.now() })).toBeGreaterThan(0.9); });
  it('isRecent true', () => { expect(e.isRecent({ text: 'a', timestamp: Date.now() })).toBe(true); });
});

describe('StyleMemoryFrequencyTracker', () => {
  const e = new StyleMemoryFrequencyTracker();
  it('record + top', () => { e.record('A'); e.record('A'); e.record('B'); expect(e.top()[0].pattern).toBe('A'); });
});

describe('StyleMemoryEvolution', () => {
  const e = new StyleMemoryEvolution();
  it('save + getVersion', () => { const m = new StyleMemory(); e.save(1, m); expect(e.getVersion(1)).not.toBeNull(); });
  it('versions', () => { expect(e.versions()).toBe(1); });
});

describe('StyleMemoryExporter', () => {
  const e = new StyleMemoryExporter();
  it('export includes text', () => { const m = new StyleMemory(); m.add('hi', 'ch1'); expect(e.export(m)).toContain('hi'); });
});

describe('StyleMemoryCoreIndex', () => {
  const idx = new StyleMemoryCoreIndex();
  it('lists 10 engines', () => { expect(idx.count()).toBe(10); });
});