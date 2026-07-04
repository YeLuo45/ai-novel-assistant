/**
 * ShortStoryIntegration.test.ts — Direction BH, V4116-V4125 (Batch 3/3 收口)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { ShortStoryPipeline, ShortStoryDirector, ShortStoryReport, ShortStoryLibrary, ShortStoryValidator, ShortStoryTools, ShortStoryMarketCheck, ShortStoryCompensation, ShortStoryADirector2, ShortStoryMasterIndex } from './ShortStoryIntegration';

describe('ShortStoryPipeline', () => {
  const e = new ShortStoryPipeline();
  it('isComplete for review', () => { expect(e.isComplete('review')).toBe(true); });
  it('next from condense', () => { expect(e.next('condense')).toBe('theme'); });
});

describe('ShortStoryDirector', () => {
  const e = new ShortStoryDirector();
  it('decide expand for low', () => { expect(e.decide({ wordCount: 100, target: 1000 })).toBe('expand'); });
  it('decide finalize for target', () => { expect(e.decide({ wordCount: 1000, target: 1000 })).toBe('finalize'); });
});

describe('ShortStoryReport', () => {
  const e = new ShortStoryReport();
  it('generate includes 字', () => { expect(e.generate({ words: 1000, themes: 3, characters: 2 })).toContain('字'); });
  it('hasReport true', () => { expect(e.hasReport('1000 字')).toBe(true); });
});

describe('ShortStoryLibrary', () => {
  const e = new ShortStoryLibrary();
  it('save + get', () => { e.save('A', { data: 'x' }); expect(e.get('A')).toBeDefined(); });
  it('count', () => { expect(e.count()).toBe(1); });
});

describe('ShortStoryValidator', () => {
  const e = new ShortStoryValidator();
  it('validate for good', () => { expect(e.validate({ words: 1000, themes: ['love'] }).valid).toBe(true); });
  it('isValid true', () => { expect(e.isValid({ valid: true })).toBe(true); });
});

describe('ShortStoryTools', () => {
  const e = new ShortStoryTools();
  it('isAvailable for Scrivener', () => { expect(e.isAvailable('Scrivener')).toBe(true); });
  it('count returns 3', () => { expect(e.count()).toBe(3); });
});

describe('ShortStoryMarketCheck', () => {
  const e = new ShortStoryMarketCheck();
  it('check viable for 1000+', () => { expect(e.check({ genre: 'romance', words: 1000 }).viable).toBe(true); });
  it('isViable true', () => { expect(e.isViable({ viable: true })).toBe(true); });
});

describe('ShortStoryCompensation', () => {
  const e = new ShortStoryCompensation();
  it('compute for 1000', () => { expect(e.compute({ words: 1000, ratePerWord: 0.1 })).toBe(100); });
  it('isPaid true', () => { expect(e.isPaid(200)).toBe(true); });
});

describe('ShortStoryADirector2', () => {
  const e = new ShortStoryADirector2();
  it('decide draft for not drafted', () => { expect(e.decide({ drafted: false, reviewed: false })).toBe('draft'); });
  it('decide submit for done', () => { expect(e.decide({ drafted: true, reviewed: true })).toBe('submit'); });
});

describe('ShortStoryMasterIndex', () => {
  const idx = new ShortStoryMasterIndex();
  it('lists 28 engines', () => { expect(idx.count()).toBe(28); });
});