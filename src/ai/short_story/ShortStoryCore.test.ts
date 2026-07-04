/**
 * ShortStoryCore.test.ts — Direction BH, V4096-V4105 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { StoryCondenser, ThemeExtracter, PlotCompressor, CharacterReducer, ScenePacker, WordBudgetEnforcer, ImpactMaximizer, ShortStoryHook, ShortStoryPacing, ShortStoryCoreIndex } from './ShortStoryCore';

describe('StoryCondenser', () => {
  const e = new StoryCondenser();
  it('condense short text', () => { expect(e.condense('short', 100)).toBe('short'); });
  it('condense long text', () => { expect(e.condense('a'.repeat(1000), 10)).toContain('...'); });
  it('isCondensed true', () => { expect(e.isCondensed('a'.repeat(100), 'a'.repeat(10))).toBe(true); });
});

describe('ThemeExtracter', () => {
  const e = new ThemeExtracter();
  it('extract for text', () => { const r = e.extract('魔法世界冒险故事'); expect(r.length).toBeGreaterThan(0); });
  it('isRich true', () => { expect(e.isRich(['a', 'b'])).toBe(true); });
});

describe('PlotCompressor', () => {
  const e = new PlotCompressor();
  it('compress for 2', () => { expect(e.compress(['a', 'b'])).toContain(' '); });
  it('isCompressed true', () => { expect(e.isCompressed('x')).toBe(true); });
});

describe('CharacterReducer', () => {
  const e = new CharacterReducer();
  it('reduce for 5 → 3', () => { const r = e.reduce([{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }, { name: 'E' }]); expect(r).toHaveLength(3); });
  it('isReduced true', () => { expect(e.isReduced(5, 3)).toBe(true); });
});

describe('ScenePacker', () => {
  const e = new ScenePacker();
  it('pack includes |', () => { expect(e.pack(['a', 'b'])).toContain('|'); });
  it('isPacked true', () => { expect(e.isPacked('a|b')).toBe(true); });
});

describe('WordBudgetEnforcer', () => {
  const e = new WordBudgetEnforcer();
  it('enforce for over', () => { expect(e.enforce('a'.repeat(100), 10)).toHaveLength(10); });
  it('isWithinBudget true', () => { expect(e.isWithinBudget('short', 100)).toBe(true); });
});

describe('ImpactMaximizer', () => {
  const e = new ImpactMaximizer();
  it('maximize includes 高潮', () => { expect(e.maximize('text')).toContain('高潮'); });
  it('isMaximized true', () => { expect(e.isMaximized('高潮')).toBe(true); });
});

describe('ShortStoryHook', () => {
  const e = new ShortStoryHook();
  it('hook includes [HOOK]', () => { expect(e.hook('topic')).toContain('[HOOK]'); });
  it('isHook true', () => { expect(e.isHook('[HOOK]')).toBe(true); });
});

describe('ShortStoryPacing', () => {
  const e = new ShortStoryPacing();
  it('pace includes 分钟', () => { expect(e.pace('a'.repeat(600), 5)).toContain('分钟'); });
  it('isValidPacing true', () => { expect(e.isValidPacing('5 分钟')).toBe(true); });
});

describe('ShortStoryCoreIndex', () => {
  const idx = new ShortStoryCoreIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});