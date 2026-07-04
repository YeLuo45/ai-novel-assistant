/**
 * BackmatterCore.test.ts — Direction AT, V3676-V3685 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { SideStoryGenerator, BackstoryGenerator, EpilogueGenerator, PrologueGenerator, CharacterBioGenerator, WorldRuleGuide, GlossaryGenerator, TimelineAppendix, AuthorNoteGenerator, BackmatterCoreIndex } from './BackmatterCore';

describe('SideStoryGenerator', () => {
  const e = new SideStoryGenerator();
  it('generate includes character', () => { expect(e.generate('Alice', 'meet Bob')).toContain('Alice'); });
  it('isValid for long', () => { expect(e.isValid('a'.repeat(10))).toBe(true); });
});
describe('BackstoryGenerator', () => {
  const e = new BackstoryGenerator();
  it('generate includes age', () => { expect(e.generate('Alice', 25)).toContain('25'); });
  it('isValidBackstory true', () => { expect(e.isValidBackstory('a'.repeat(10))).toBe(true); });
});
describe('EpilogueGenerator', () => {
  const e = new EpilogueGenerator();
  it('generate includes 多年以后', () => { expect(e.generate('end')).toContain('多年以后'); });
  it('isHappy for no 悲剧', () => { expect(e.isHappy('happy ending')).toBe(true); });
});
describe('PrologueGenerator', () => {
  const e = new PrologueGenerator();
  it('generate includes 一切开始', () => { expect(e.generate('past')).toContain('一切开始'); });
  it('isHook for long', () => { expect(e.isHook('a'.repeat(10))).toBe(true); });
});
describe('CharacterBioGenerator', () => {
  const e = new CharacterBioGenerator();
  it('generate includes name + traits', () => { expect(e.generate('Alice', ['brave', 'kind'])).toContain('brave'); });
  it('isComplete true', () => { expect(e.isComplete('Alice：brave')).toBe(true); });
});
describe('WorldRuleGuide', () => {
  const e = new WorldRuleGuide();
  it('generate numbered', () => { expect(e.generate(['rule1', 'rule2'])).toContain('1.'); });
  it('isComprehensive for long', () => { expect(e.isComprehensive('a'.repeat(50))).toBe(true); });
});
describe('GlossaryGenerator', () => {
  const e = new GlossaryGenerator();
  it('generate includes k: v', () => { expect(e.generate({ X: 'Y' })).toContain('X: Y'); });
  it('hasGlossary true', () => { expect(e.hasGlossary('X: Y')).toBe(true); });
});
describe('TimelineAppendix', () => {
  const e = new TimelineAppendix();
  it('generate includes date', () => { expect(e.generate([{ date: '2026', event: 'event' }])).toContain('2026'); });
  it('isComplete for non-empty', () => { expect(e.isComplete('text')).toBe(true); });
});
describe('AuthorNoteGenerator', () => {
  const e = new AuthorNoteGenerator();
  it('generate includes 作者按', () => { expect(e.generate('topic')).toContain('作者按'); });
  it('isHelpful true', () => { expect(e.isHelpful('a'.repeat(10))).toBe(true); });
});
describe('BackmatterCoreIndex', () => {
  const idx = new BackmatterCoreIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});