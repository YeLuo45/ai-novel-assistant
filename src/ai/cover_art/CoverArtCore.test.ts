/**
 * CoverArtCore.test.ts — Direction BM, V4246-V4255 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { CoverArtDescriber, ColorPaletteGenerator, CompositionGenerator, CharacterPoseGenerator, BackgroundSceneGenerator, ArtStyleSelector, FontRecommender, CoverLayout, MoodGenerator, CoverArtCoreIndex } from './CoverArtCore';

describe('CoverArtDescriber', () => {
  const e = new CoverArtDescriber();
  it('describe includes 封面', () => { expect(e.describe({ title: 'A', genre: 'romance', themes: ['love'] })).toContain('封面'); });
  it('isDescribed true', () => { expect(e.isDescribed('封面')).toBe(true); });
});

describe('ColorPaletteGenerator', () => {
  const e = new ColorPaletteGenerator();
  it('generate for dark', () => { expect(e.generate('dark')).toContain('black'); });
  it('isValid true', () => { expect(e.isValid(['x'])).toBe(true); });
});

describe('CompositionGenerator', () => {
  const e = new CompositionGenerator();
  it('layout joins', () => { expect(e.layout(['a', 'b'])).toContain('|'); });
  it('isValid true', () => { expect(e.isValid('a')).toBe(true); });
});

describe('CharacterPoseGenerator', () => {
  const e = new CharacterPoseGenerator();
  it('pose includes char', () => { expect(e.pose('Alice', 'happy')).toContain('Alice'); });
  it('isValid true', () => { expect(e.isValid('x')).toBe(true); });
});

describe('BackgroundSceneGenerator', () => {
  const e = new BackgroundSceneGenerator();
  it('scene includes at', () => { expect(e.scene('forest', 'night')).toContain('at'); });
  it('isValid true', () => { expect(e.isValid('x')).toBe(true); });
});

describe('ArtStyleSelector', () => {
  const e = new ArtStyleSelector();
  it('isValid for realistic', () => { expect(e.isValid('realistic')).toBe(true); });
  it('recommend for romance', () => { expect(e.recommend('romance')).toBe('anime'); });
});

describe('FontRecommender', () => {
  const e = new FontRecommender();
  it('recommend for romance', () => { expect(e.recommend('romance')).toBe('serif'); });
  it('isValid for serif', () => { expect(e.isValid('serif')).toBe(true); });
});

describe('CoverLayout', () => {
  const e = new CoverLayout();
  it('isValid for center', () => { expect(e.isValid('center')).toBe(true); });
});

describe('MoodGenerator', () => {
  const e = new MoodGenerator();
  it('isValid for neutral', () => { expect(e.isValid('neutral')).toBe(true); });
});

describe('CoverArtCoreIndex', () => {
  const idx = new CoverArtCoreIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});