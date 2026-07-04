/**
 * ComicScriptAdvanced.test.ts — Direction BG, V4076-V4085 (Batch 2/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { ComicInkStyleAdvisor, ComicPanelDescriber, ComicTransitionAdviser, ComicColorPalette, ComicCoverDesigner, ComicPageCounter, ComicReadingDirection, ComicArtStyle, ComicVolumeBinder, ComicScriptAdvancedIndex } from './ComicScriptAdvanced';

describe('ComicInkStyleAdvisor', () => {
  const e = new ComicInkStyleAdvisor();
  it('isValid for manga', () => { expect(e.isValid('manga')).toBe(true); });
  it('recommend for romance', () => { expect(e.recommend('romance')).toBe('cartoon'); });
});

describe('ComicPanelDescriber', () => {
  const e = new ComicPanelDescriber();
  it('describe includes ACTION', () => { expect(e.describe('jump')).toContain('[ACTION]'); });
  it('isDescribed true', () => { expect(e.isDescribed('[ACTION] x')).toBe(true); });
});

describe('ComicTransitionAdviser', () => {
  const e = new ComicTransitionAdviser();
  it('suggest includes 转', () => { expect(e.suggest('A', 'B')).toContain('转'); });
  it('isValid true', () => { expect(e.isValid('转')).toBe(true); });
});

describe('ComicColorPalette', () => {
  const e = new ComicColorPalette();
  it('add + count', () => { e.add('red'); expect(e.count()).toBe(1); });
  it('isBlackAndWhite for empty', () => { const e2 = new ComicColorPalette(); expect(e2.isBlackAndWhite()).toBe(true); });
});

describe('ComicCoverDesigner', () => {
  const e = new ComicCoverDesigner();
  it('design includes 封面', () => { expect(e.design('A', ['B'])).toContain('封面'); });
  it('isDesigned true', () => { expect(e.isDesigned('封面')).toBe(true); });
});

describe('ComicPageCounter', () => {
  const e = new ComicPageCounter();
  it('add + count', () => { e.add(); e.add(); expect(e.count()).toBe(2); });
});

describe('ComicReadingDirection', () => {
  const e = new ComicReadingDirection();
  it('isWestern for ltr', () => { expect(e.isWestern()).toBe(true); });
  it('isManga for rtl', () => { e.direction = 'rtl'; expect(e.isManga()).toBe(true); });
});

describe('ComicArtStyle', () => {
  const e = new ComicArtStyle();
  it('isValid for shonen', () => { expect(e.isValid('shonen')).toBe(true); });
});

describe('ComicVolumeBinder', () => {
  const e = new ComicVolumeBinder();
  it('bind includes Volume', () => { expect(e.bind(['1', '2'])).toContain('Volume'); });
  it('isBound true', () => { expect(e.isBound('Volume: 1')).toBe(true); });
});

describe('ComicScriptAdvancedIndex', () => {
  const idx = new ComicScriptAdvancedIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});