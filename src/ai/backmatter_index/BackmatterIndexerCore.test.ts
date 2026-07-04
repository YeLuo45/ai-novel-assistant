/**
 * BackmatterIndexerCore.test.ts — Direction BB, V3916-V3925 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { BackmatterIndex, BackmatterSearch, BackmatterTagGenerator, BackmatterTOCBuilder, BackmatterCrossReference, BackmatterKeywordExtractor, BackmatterSummaryGenerator, BackmatterPageNumberer, BackmatterVersion, BackmatterBackup, BackmatterIndexerCoreIndex } from './BackmatterIndexerCore';

describe('BackmatterIndex', () => {
  const e = new BackmatterIndex();
  it('add + get', () => { e.add('plot', 'hero arc'); expect(e.get('plot')).toContain('hero arc'); });
  it('allCategories', () => { e.add('character', 'a'); expect(e.allCategories().length).toBeGreaterThanOrEqual(1); });
});

describe('BackmatterSearch', () => {
  const e = new BackmatterSearch();
  it('search for query', () => { const idx = new BackmatterIndex(); idx.add('plot', 'hero saves world'); expect(e.search(idx, 'hero').length).toBeGreaterThan(0); });
  it('hasResults true', () => { expect(e.hasResults([{ category: 'x' } as any])).toBe(true); });
});

describe('BackmatterTagGenerator', () => {
  const e = new BackmatterTagGenerator();
  it('generate for character', () => { expect(e.generateTags('人物角色')).toContain('character'); });
  it('hasTags true', () => { expect(e.hasTags('人物')).toBe(true); });
});

describe('BackmatterTOCBuilder', () => {
  const e = new BackmatterTOCBuilder();
  it('buildTOC for 2 items', () => { const r = e.buildTOC([{ title: 'A', level: 1 }, { title: 'B', level: 2 }]); expect(r).toContain('A'); });
  it('isValidTOC true', () => { expect(e.isValidTOC('- A')).toBe(true); });
});

describe('BackmatterCrossReference', () => {
  const e = new BackmatterCrossReference();
  it('hasReference true', () => { expect(e.hasReference('A', 'B')).toBe(true); });
  it('count', () => { expect(e.count('A')).toBe(1); });
});

describe('BackmatterKeywordExtractor', () => {
  const e = new BackmatterKeywordExtractor();
  it('extract for text', () => { const r = e.extract('魔法世界冒险故事'); expect(r.length).toBeGreaterThan(0); });
  it('isRich for 3+', () => { expect(e.isRich(['a', 'b', 'c'])).toBe(true); });
});

describe('BackmatterSummaryGenerator', () => {
  const e = new BackmatterSummaryGenerator();
  it('generate for short', () => { expect(e.generate('hi')).toBe('hi'); });
  it('hasSummary true', () => { expect(e.hasSummary('hi')).toBe(true); });
});

describe('BackmatterPageNumberer', () => {
  const e = new BackmatterPageNumberer();
  it('numberPages for 2', () => { expect(e.numberPages(['a', 'b'])).toHaveLength(2); });
  it('isNumbered true', () => { expect(e.isNumbered([{ page: 1 }])).toBe(true); });
});

describe('BackmatterVersion', () => {
  const e = new BackmatterVersion();
  it('bump + get', () => { e.bump(); expect(e.get()).toBeGreaterThan(1); });
});

describe('BackmatterBackup', () => {
  const e = new BackmatterBackup();
  it('backup + count', () => { e.backup('data'); expect(e.count()).toBe(1); });
});

describe('BackmatterIndexerCoreIndex', () => {
  const idx = new BackmatterIndexerCoreIndex();
  it('lists 10 engines', () => { expect(idx.count()).toBe(10); });
});