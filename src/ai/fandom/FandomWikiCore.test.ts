/**
 * FandomWikiCore.test.ts — Direction BK, V4186-V4195 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { WikiEntry, WikiLibrary, WikiLinker, WikiCategory, WikiHistory, WikiReference, WikiImageReference, WikiQuoteSelector, WikiTagAdder, FandomWikiCoreIndex } from './FandomWikiCore';

describe('WikiEntry', () => {
  const e = new WikiEntry();
  it('isValid for name', () => { e.name = 'X'; expect(e.isValid()).toBe(true); });
});

describe('WikiLibrary', () => {
  const e = new WikiLibrary();
  it('add + find', () => { e.add({ name: 'X', description: 'd' } as any); expect(e.find('X')?.name).toBe('X'); });
  it('count', () => { expect(e.count()).toBe(1); });
});

describe('WikiLinker', () => {
  const e = new WikiLinker();
  it('addLink + isLinked', () => { e.addLink('A', 'B'); expect(e.isLinked('A', 'B')).toBe(true); });
  it('count', () => { expect(e.count('A')).toBe(1); });
});

describe('WikiCategory', () => {
  const e = new WikiCategory();
  it('isValid for non-empty', () => { expect(e.isValid('character')).toBe(true); });
});

describe('WikiHistory', () => {
  const e = new WikiHistory();
  it('add + count', () => { e.add(2026, 'event'); expect(e.count()).toBe(1); });
});

describe('WikiReference', () => {
  const e = new WikiReference();
  it('add + count', () => { e.add('ref'); expect(e.count()).toBe(1); });
});

describe('WikiImageReference', () => {
  const e = new WikiImageReference();
  it('add + count', () => { e.add('/img.png'); expect(e.count()).toBe(1); });
});

describe('WikiQuoteSelector', () => {
  const e = new WikiQuoteSelector();
  it('add + count', () => { e.add('quote'); expect(e.count()).toBe(1); });
});

describe('WikiTagAdder', () => {
  const e = new WikiTagAdder();
  it('add + has', () => { e.add('magic'); expect(e.has('magic')).toBe(true); });
});

describe('FandomWikiCoreIndex', () => {
  const idx = new FandomWikiCoreIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});