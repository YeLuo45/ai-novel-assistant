/**
 * FandomWikiIntegration.test.ts — Direction BK, V4206-V4215 (Batch 3/3 收口)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { WikiGenerator, WikiTemplate, WikiConsistencyChecker, WikiSearchEngine2, WikiADirector, WikiReport, WikiLibrary2, WikiTools, WikiValidator, FandomWikiMasterIndex } from './FandomWikiIntegration';
import { WikiEntry, WikiLibrary } from './FandomWikiCore';

describe('WikiGenerator', () => {
  const e = new WikiGenerator();
  it('generate includes #', () => {
    const lib = new WikiLibrary();
    expect(e.generate(lib, { name: 'X', description: 'd' } as WikiEntry)).toContain('#');
  });
  it('isGenerated true', () => { expect(e.isGenerated('# X')).toBe(true); });
});

describe('WikiTemplate', () => {
  const e = new WikiTemplate();
  it('apply replaces content', () => { e.template = '{content}'; expect(e.apply('hi')).toBe('hi'); });
  it('isApplied true', () => { expect(e.isApplied('x')).toBe(true); });
});

describe('WikiConsistencyChecker', () => {
  const e = new WikiConsistencyChecker();
  it('check for empty', () => { expect(e.check(new WikiLibrary()).consistent).toBe(false); });
  it('isConsistent false', () => { expect(e.isConsistent({ consistent: false })).toBe(false); });
});

describe('WikiSearchEngine2', () => {
  const e = new WikiSearchEngine2();
  it('searchByTag', () => {
    const lib = new WikiLibrary();
    lib.add({ name: 'X', description: 'magic' } as any);
    expect(e.searchByTag(lib, 'magic').length).toBe(1);
  });
  it('hasResults true', () => { expect(e.hasResults([{} as any])).toBe(true); });
});

describe('WikiADirector', () => {
  const e = new WikiADirector();
  it('decide add for empty', () => { expect(e.decide({ hasEntries: false, categorized: false })).toBe('add'); });
  it('decide finalize for done', () => { expect(e.decide({ hasEntries: true, categorized: true })).toBe('finalize'); });
});

describe('WikiReport', () => {
  const e = new WikiReport();
  it('generate includes 项', () => { expect(e.generate({ entries: 10, categories: 3 })).toContain('项'); });
  it('hasReport true', () => { expect(e.hasReport('项')).toBe(true); });
});

describe('WikiLibrary2', () => {
  const e = new WikiLibrary2();
  it('add + count', () => { e.add({ name: 'X', description: 'd' } as WikiEntry); expect(e.count()).toBe(1); });
  it('search for match', () => { e.add({ name: 'Y', description: 'hero' } as WikiEntry); expect(e.search('hero').length).toBe(1); });
});

describe('WikiTools', () => {
  const e = new WikiTools();
  it('isAvailable for MediaWiki', () => { expect(e.isAvailable('MediaWiki')).toBe(true); });
  it('count returns 3', () => { expect(e.count()).toBe(3); });
});

describe('WikiValidator', () => {
  const e = new WikiValidator();
  it('validate for good', () => { expect(e.validate({ name: 'Hero', description: 'A great hero' } as WikiEntry).valid).toBe(true); });
  it('isValid true', () => { expect(e.isValid({ valid: true })).toBe(true); });
});

describe('FandomWikiMasterIndex', () => {
  const idx = new FandomWikiMasterIndex();
  it('lists 28 engines', () => { expect(idx.count()).toBe(28); });
});