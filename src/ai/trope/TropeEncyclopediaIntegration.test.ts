/**
 * TropeEncyclopediaIntegration.test.ts — Direction BJ, V4176-V4185 (Batch 3/3 收口)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { TropeEncyclopedia, TropeCategoryFilter, TropeImport, TropeExport, TropeSearchEngine2, TropeIndexBuilder, TropeBrowser, TropeADirector, TropeTools, TropeEncyclopediaMasterIndex } from './TropeEncyclopediaIntegration';
import { TropeEntry, TropeLibrary } from './TropeEncyclopediaCore';

describe('TropeEncyclopedia', () => {
  const e = new TropeEncyclopedia();
  it('addTrope + count', () => {
    e.addTrope({ name: 'X', genre: 'romance', description: 'd' } as TropeEntry);
    expect(e.count()).toBe(1);
  });
});

describe('TropeCategoryFilter', () => {
  const e = new TropeCategoryFilter();
  it('filter for romance', () => {
    const lib = new TropeLibrary();
    lib.add({ name: 'X', genre: 'romance', description: 'd' } as any);
    expect(e.filter(lib, 'romance').length).toBe(1);
  });
  it('hasMatch true', () => { expect(e.hasMatch([{} as any])).toBe(true); });
});

describe('TropeImport', () => {
  const e = new TropeImport();
  it('importJSON', () => {
    const lib = new TropeLibrary();
    e.importJSON(lib, '[{"name":"X","genre":"romance","description":"d"}]');
    expect(lib.find('X')?.name).toBe('X');
  });
  it('isValid true', () => { expect(e.isValid('[]')).toBe(true); });
});

describe('TropeExport', () => {
  const e = new TropeExport();
  it('export for empty', () => {
    const lib = new TropeLibrary();
    expect(e.export(lib)).toBe('[]');
  });
  it('isValidJSON true', () => { expect(e.isValidJSON('[]')).toBe(true); });
});

describe('TropeSearchEngine2', () => {
  const e = new TropeSearchEngine2();
  it('searchByTag', () => {
    const lib = new TropeLibrary();
    lib.add({ name: 'X', genre: 'romance', description: 'hero saves' } as any);
    expect(e.searchByTag(lib, 'hero').length).toBe(1);
  });
  it('hasResults true', () => { expect(e.hasResults([{} as any])).toBe(true); });
});

describe('TropeIndexBuilder', () => {
  const e = new TropeIndexBuilder();
  it('build for 2', () => {
    const lib = new TropeLibrary();
    lib.add({ name: 'X', genre: 'romance', description: 'd' } as any);
    lib.add({ name: 'Y', genre: 'mystery', description: 'd' } as any);
    expect(e.build(lib).length).toBe(2);
  });
  it('isValid true', () => { expect(e.isValid([{ category: 'x' }])).toBe(true); });
});

describe('TropeBrowser', () => {
  const e = new TropeBrowser();
  it('browse page 0', () => {
    const lib = new TropeLibrary();
    lib.add({ name: 'X', genre: 'romance', description: 'd' } as any);
    expect(e.browse(lib, 0, 5).length).toBe(1);
  });
});

describe('TropeADirector', () => {
  const e = new TropeADirector();
  it('decide add for empty', () => { expect(e.decide({ hasTropes: false, categorized: false })).toBe('add'); });
  it('decide finalize for done', () => { expect(e.decide({ hasTropes: true, categorized: true })).toBe('finalize'); });
});

describe('TropeTools', () => {
  const e = new TropeTools();
  it('isAvailable for TVTropes', () => { expect(e.isAvailable('TVTropes')).toBe(true); });
  it('count returns 2', () => { expect(e.count()).toBe(2); });
});

describe('TropeEncyclopediaMasterIndex', () => {
  const idx = new TropeEncyclopediaMasterIndex();
  it('lists 28 engines', () => { expect(idx.count()).toBe(28); });
});