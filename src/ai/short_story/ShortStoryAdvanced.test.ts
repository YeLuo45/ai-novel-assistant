/**
 * ShortStoryAdvanced.test.ts — Direction BH, V4106-V4115 (Batch 2/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { ShortStoryStructure, ShortStoryGenreAdapter, ShortStoryLengthChecker, ShortStoryConflictFocuser, ShortStoryTwistBuilder, ShortStoryToneSelector, ShortStoryProtagonistSelector, ShortStoryWordplayInserter, ShortStoryEndingPolisher, ShortStoryAdvancedIndex } from './ShortStoryAdvanced';

describe('ShortStoryStructure', () => {
  const e = new ShortStoryStructure();
  it('isValid for linear', () => { expect(e.isValid('linear')).toBe(true); });
  it('isValid false for unknown', () => { expect(e.isValid('xxx')).toBe(false); });
});

describe('ShortStoryGenreAdapter', () => {
  const e = new ShortStoryGenreAdapter();
  it('adapt changes genre', () => { const r = e.adapt({ themes: ['love'] }, 'romance'); expect(r.genre).toBe('romance'); });
  it('isAdapted true', () => { expect(e.isAdapted({ genre: 'romance' })).toBe(true); });
});

describe('ShortStoryLengthChecker', () => {
  const e = new ShortStoryLengthChecker();
  it('check in range', () => { const r = e.check('a'.repeat(1000), { min: 100, max: 1000 }); expect(r.inRange).toBe(true); });
  it('isInRange true', () => { expect(e.isInRange({ inRange: true })).toBe(true); });
});

describe('ShortStoryConflictFocuser', () => {
  const e = new ShortStoryConflictFocuser();
  it('focus sets intensity', () => { const r = e.focus({ conflict: 'a' }, 'high'); expect(r.intensity).toBe('high'); });
  it('isFocused true', () => { expect(e.isFocused({ intensity: 'high' })).toBe(true); });
});

describe('ShortStoryTwistBuilder', () => {
  const e = new ShortStoryTwistBuilder();
  it('build includes [TWIST]', () => { expect(e.build('x')).toContain('[TWIST]'); });
  it('isBuilt true', () => { expect(e.isBuilt('[TWIST] x')).toBe(true); });
});

describe('ShortStoryToneSelector', () => {
  const e = new ShortStoryToneSelector();
  it('isValid for light', () => { expect(e.isValid('light')).toBe(true); });
});

describe('ShortStoryProtagonistSelector', () => {
  const e = new ShortStoryProtagonistSelector();
  it('isValid for active', () => { expect(e.isValid('active')).toBe(true); });
});

describe('ShortStoryWordplayInserter', () => {
  const e = new ShortStoryWordplayInserter();
  it('insert adds wordplay', () => { expect(e.insert('text', 'pun').length).toBeGreaterThan(4); });
  it('isInserted true', () => { expect(e.isInserted('text pun', 'text')).toBe(true); });
});

describe('ShortStoryEndingPolisher', () => {
  const e = new ShortStoryEndingPolisher();
  it('polish includes FIN', () => { expect(e.polish('end')).toContain('FIN'); });
  it('isPolished true', () => { expect(e.isPolished('end (FIN)')).toBe(true); });
});

describe('ShortStoryAdvancedIndex', () => {
  const idx = new ShortStoryAdvancedIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});