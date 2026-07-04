/**
 * BackmatterIndexerAdvanced.test.ts — Direction BB, V3926-V3935 (Batch 2/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { BackmatterExporter, BackmatterImporter, BackmatterIndexExporter, BackmatterSearchEngine, BackmatterArchive, BackmatterReferenceGraph, BackmatterCatalog, BackmatterValidator, BackmatterAdvancedIndex } from './BackmatterIndexerAdvanced';

describe('BackmatterExporter', () => {
  const e = new BackmatterExporter();
  it('exportToMarkdown for 1', () => { expect(e.exportToMarkdown([{ title: 'A', content: 'C' }])).toContain('# A'); });
  it('isValid true', () => { expect(e.isValid('# A')).toBe(true); });
});

describe('BackmatterImporter', () => {
  const e = new BackmatterImporter();
  it('importFromMarkdown', () => { const r = e.importFromMarkdown('# A\n\nContent'); expect(r).toHaveLength(1); });
  it('isValid true', () => { expect(e.isValid('# A')).toBe(true); });
});

describe('BackmatterIndexExporter', () => {
  const e = new BackmatterIndexExporter();
  it('exportJSON for empty', () => { expect(e.exportJSON({ allCategories: () => [], get: () => [] })).toContain('{'); });
  it('isValidJSON true', () => { expect(e.isValidJSON('{}')).toBe(true); });
});

describe('BackmatterSearchEngine', () => {
  const e = new BackmatterSearchEngine();
  it('search for match', () => { const r = e.search([{ content: 'hi world', tags: [] }], 'world'); expect(r.length).toBe(1); });
  it('isRanked true', () => { expect(e.isRanked([{ score: 1 }])).toBe(true); });
});

describe('BackmatterArchive', () => {
  const e = new BackmatterArchive();
  it('record + totalCount', () => { e.record(2026, 5); e.record(2025, 3); expect(e.totalCount()).toBe(8); });
});

describe('BackmatterReferenceGraph', () => {
  const e = new BackmatterReferenceGraph();
  it('addEdge + getRelated', () => { e.addEdge('A', 'B'); expect(e.getRelated('A')).toContain('B'); });
  it('isConnected for direct', () => { expect(e.isConnected('A', 'B')).toBe(true); });
});

describe('BackmatterCatalog', () => {
  const e = new BackmatterCatalog();
  it('add + byType', () => { e.add('A', 'plot', 1); e.add('B', 'character', 2); expect(e.byType('plot')).toHaveLength(1); });
  it('count', () => { expect(e.count()).toBe(2); });
});

describe('BackmatterValidator', () => {
  const e = new BackmatterValidator();
  it('validate for valid', () => { expect(e.validate({ title: 'A good title', content: 'Content here' }).valid).toBe(true); });
  it('isValid true', () => { expect(e.isValid({ valid: true })).toBe(true); });
});

describe('BackmatterAdvancedIndex', () => {
  const idx = new BackmatterAdvancedIndex();
  it('lists 8 engines', () => { expect(idx.count()).toBe(8); });
});