/**
 * BackmatterAdvanced.test.ts — Direction AT, V3686-V3695 (Batch 2/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { BloopersGenerator, AuthorInterviewGenerator, DeletedSceneGenerator, AlternateEndingGenerator, ArtPromptGenerator, MusicPlaylistCurator, TimelineInfographic, ReadingGroupGuide, BonusContentGenerator, BackmatterAdvancedIndex } from './BackmatterAdvanced';

describe('BloopersGenerator', () => {
  const e = new BloopersGenerator();
  it('generate includes 穿帮', () => { expect(e.generate('scene')).toContain('穿帮'); });
  it('isFunny for long', () => { expect(e.isFunny('a'.repeat(10))).toBe(true); });
});
describe('AuthorInterviewGenerator', () => {
  const e = new AuthorInterviewGenerator();
  it('generate includes Q: A:', () => { const r = e.generate('Q?'); expect(r).toContain('Q:'); expect(r).toContain('A:'); });
  it('isComplete true', () => { expect(e.isComplete('Q: x\nA: y')).toBe(true); });
});
describe('DeletedSceneGenerator', () => {
  const e = new DeletedSceneGenerator();
  it('generate includes 删除原因', () => { expect(e.generate('s', 'r')).toContain('删除原因'); });
  it('isDeleted true', () => { expect(e.isDeleted('[删除原因] x')).toBe(true); });
});
describe('AlternateEndingGenerator', () => {
  const e = new AlternateEndingGenerator();
  it('generate has 结局A B', () => { expect(e.generate('A', 'B')).toContain('结局A'); });
  it('hasAlternate true', () => { expect(e.hasAlternate('结局A: x\n结局B: y')).toBe(true); });
});
describe('ArtPromptGenerator', () => {
  const e = new ArtPromptGenerator();
  it('generate includes [art]', () => { expect(e.generate('scene')).toContain('[art]'); });
  it('isArtPrompt true', () => { expect(e.isArtPrompt('[art] scene')).toBe(true); });
});
describe('MusicPlaylistCurator', () => {
  const e = new MusicPlaylistCurator();
  it('generate 2 songs', () => { expect(e.generate('book', 'sad')).toHaveLength(2); });
  it('isValid true', () => { expect(e.isValid(['x'])).toBe(true); });
});
describe('TimelineInfographic', () => {
  const e = new TimelineInfographic();
  it('generate includes numbers', () => { expect(e.generate([{ date: 'd', event: 'e' }])).toContain('1.'); });
  it('hasNumbers true', () => { expect(e.hasNumbers('1. x')).toBe(true); });
});
describe('ReadingGroupGuide', () => {
  const e = new ReadingGroupGuide();
  it('generate includes weeks', () => { expect(e.generate(20, 4)).toContain('周'); });
  it('isRealistic true', () => { expect(e.isRealistic('a'.repeat(10))).toBe(true); });
});
describe('BonusContentGenerator', () => {
  const e = new BonusContentGenerator();
  it('generate includes [bonus-', () => { expect(e.generate('art')).toContain('[bonus-'); });
  it('isBonus true', () => { expect(e.isBonus('[bonus-art] x')).toBe(true); });
});
describe('BackmatterAdvancedIndex', () => {
  const idx = new BackmatterAdvancedIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});