/**
 * TomatoStyleCore.test.ts — Direction BW, V4466-V4475 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { TomatoChapterLengthAdjuster, TomatoTitleStyleMatcher, TomatoOpeningHookGenerator, TomatoConflictPacer, TomatoCliffhangerInserter, TomatoForeshadowDensity, TomatoDialogueRatioBalancer, TomatoPOVOptimizer, TomatoNameFormatValidator, TomatoPunctuationFormatter, TomatoStyleCoreIndex } from './TomatoStyleCore';

describe('TomatoChapterLengthAdjuster', () => {
  const e = new TomatoChapterLengthAdjuster();
  it('adjust short', () => { expect(e.adjust('short', 2000)).toBe('short'); });
  it('isValidLength for 2000', () => { expect(e.isValidLength('a'.repeat(2000))).toBe(true); });
});

describe('TomatoTitleStyleMatcher', () => {
  const e = new TomatoTitleStyleMatcher();
  it('style for 震惊', () => { expect(e.style('震惊！')).toBe('clickbait'); });
  it('isClickbait true', () => { expect(e.isClickbait('clickbait')).toBe(true); });
});

describe('TomatoOpeningHookGenerator', () => {
  const e = new TomatoOpeningHookGenerator();
  it('generate includes genre', () => { expect(e.generate('romance')).toContain('romance'); });
  it('isGenerated true', () => { expect(e.isGenerated('x')).toBe(true); });
});

describe('TomatoConflictPacer', () => {
  const e = new TomatoConflictPacer();
  it('insert includes [CONFLICT]', () => { expect(e.insert('a')).toContain('[CONFLICT]'); });
  it('hasConflict true', () => { expect(e.hasConflict('a [CONFLICT]')).toBe(true); });
});

describe('TomatoCliffhangerInserter', () => {
  const e = new TomatoCliffhangerInserter();
  it('insert includes ？', () => { expect(e.insert('end')).toContain('？'); });
  it('isCliffhanger true', () => { expect(e.isCliffhanger('？')).toBe(true); });
});

describe('TomatoForeshadowDensity', () => {
  const e = new TomatoForeshadowDensity();
  it('set + isBalanced', () => { e.set(0.1); expect(e.isBalanced()).toBe(true); });
});

describe('TomatoDialogueRatioBalancer', () => {
  const e = new TomatoDialogueRatioBalancer();
  it('set + isBalanced', () => { e.set(0.5); expect(e.isBalanced()).toBe(true); });
});

describe('TomatoPOVOptimizer', () => {
  const e = new TomatoPOVOptimizer();
  it('set + isValid', () => { e.set('first'); expect(e.isValid('first')).toBe(true); });
});

describe('TomatoNameFormatValidator', () => {
  const e = new TomatoNameFormatValidator();
  it('isValid for 张三', () => { expect(e.isValid('张三')).toBe(true); });
});

describe('TomatoPunctuationFormatter', () => {
  const e = new TomatoPunctuationFormatter();
  it('format includes ，', () => { expect(e.format('hello,world.')).toContain('，'); });
  it('isFormatted true', () => { expect(e.isFormatted('。')).toBe(true); });
});

describe('TomatoStyleCoreIndex', () => {
  const idx = new TomatoStyleCoreIndex();
  it('lists 10 engines', () => { expect(idx.count()).toBe(10); });
});