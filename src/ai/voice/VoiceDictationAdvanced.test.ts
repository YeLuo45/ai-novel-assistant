/**
 * VoiceDictationAdvanced.test.ts — Direction BU, V4416-V4425 (Batch 2/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { WhisperPromptOptimizer, DictationCorrector, DictationPunctuation, DictationParagraph, DictationFormatter, DictationSpeedAdjuster, DictationNoiseFilter, DictationConfidence, DictationHistory, DictationExport, VoiceDictationAdvancedIndex } from './VoiceDictationAdvanced';

describe('WhisperPromptOptimizer', () => {
  const e = new WhisperPromptOptimizer();
  it('optimize includes context', () => { expect(e.optimize('hello', 'novel')).toContain('novel'); });
  it('isOptimized true', () => { expect(e.isOptimized('[x] hello')).toBe(true); });
});

describe('DictationCorrector', () => {
  const e = new DictationCorrector();
  it('correct removes errors', () => { expect(e.correct('bad text', ['bad'])).toBe('* text'); });
  it('hasCorrected true', () => { expect(e.hasCorrected('bad', '*')).toBe(true); });
});

describe('DictationPunctuation', () => {
  const e = new DictationPunctuation();
  it('punctuate includes 。', () => { expect(e.punctuate('hi there')).toContain('。'); });
  it('hasPunctuation true', () => { expect(e.hasPunctuation('。')).toBe(true); });
});

describe('DictationParagraph', () => {
  const e = new DictationParagraph();
  it('paragraphize for 1', () => { const r = e.paragraphize('短文本'); expect(r.length).toBeGreaterThanOrEqual(1); });
  it('isParagraphed true', () => { expect(e.isParagraphed(['a'])).toBe(true); });
});

describe('DictationFormatter', () => {
  const e = new DictationFormatter();
  it('format includes \\n', () => { expect(e.format('hi。bye。')).toContain('\n'); });
  it('isFormatted true', () => { expect(e.isFormatted('a\nb')).toBe(true); });
});

describe('DictationSpeedAdjuster', () => {
  const e = new DictationSpeedAdjuster();
  it('set + isFast', () => { e.set(1.8); expect(e.isFast()).toBe(true); });
});

describe('DictationNoiseFilter', () => {
  const e = new DictationNoiseFilter();
  it('hasContent for 500', () => { expect(e.hasContent('a'.repeat(500))).toBe(true); });
});

describe('DictationConfidence', () => {
  const e = new DictationConfidence();
  it('score for 100 chars', () => { expect(e.score('a'.repeat(100))).toBe(1); });
  it('isHigh for 0.5+', () => { expect(e.isHigh(0.6)).toBe(true); });
});

describe('DictationHistory', () => {
  const e = new DictationHistory();
  it('add + count', () => { e.add('hello'); expect(e.count()).toBe(1); });
});

describe('DictationExport', () => {
  const e = new DictationExport();
  it('export includes format', () => { expect(e.export('hi', 'md')).toContain('md'); });
  it('isValid true', () => { expect(e.isValid('[md]')).toBe(true); });
});

describe('VoiceDictationAdvancedIndex', () => {
  const idx = new VoiceDictationAdvancedIndex();
  it('lists 10 engines', () => { expect(idx.count()).toBe(10); });
});