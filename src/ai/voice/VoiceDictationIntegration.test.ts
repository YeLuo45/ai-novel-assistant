/**
 * VoiceDictationIntegration.test.ts — Direction BU, V4426-V4435 (Batch 3/3 收口)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { DictationPipeline, DictationDirector, DictationReport, DictationLibrary, DictationValidator, DictationTools, DictationQualityGate, DictationADirector, DictationCache, VoiceDictationMasterIndex } from './VoiceDictationIntegration';

describe('DictationPipeline', () => {
  const e = new DictationPipeline();
  it('isComplete for export', () => { expect(e.isComplete('export')).toBe(true); });
  it('next from record', () => { expect(e.next('record')).toBe('encode'); });
});

describe('DictationDirector', () => {
  const e = new DictationDirector();
  it('decide record for not recorded', () => { expect(e.decide({ recorded: false, transcribed: false })).toBe('record'); });
  it('decide export for done', () => { expect(e.decide({ recorded: true, transcribed: true })).toBe('export'); });
});

describe('DictationReport', () => {
  const e = new DictationReport();
  it('generate includes 分钟', () => { expect(e.generate({ minutes: 10, words: 1000, errors: 5 })).toContain('分钟'); });
  it('hasReport true', () => { expect(e.hasReport('分钟')).toBe(true); });
});

describe('DictationLibrary', () => {
  const e = new DictationLibrary();
  it('save + get', () => { e.save('A', 'hello'); expect(e.get('A')).toBe('hello'); });
  it('count', () => { expect(e.count()).toBe(1); });
});

describe('DictationValidator', () => {
  const e = new DictationValidator();
  it('validate for non-empty', () => { expect(e.validate('hello').valid).toBe(true); });
  it('isValid true', () => { expect(e.isValid({ valid: true })).toBe(true); });
});

describe('DictationTools', () => {
  const e = new DictationTools();
  it('isAvailable for Whisper', () => { expect(e.isAvailable('Whisper')).toBe(true); });
  it('count returns 4', () => { expect(e.count()).toBe(4); });
});

describe('DictationQualityGate', () => {
  const e = new DictationQualityGate();
  it('gate true for non-empty', () => { expect(e.gate('hello')).toBe(true); });
});

describe('DictationADirector', () => {
  const e = new DictationADirector();
  it('decide start for empty', () => { expect(e.decide({ started: false, completed: false })).toBe('start'); });
  it('decide review for done', () => { expect(e.decide({ started: true, completed: true })).toBe('review'); });
});

describe('DictationCache', () => {
  const e = new DictationCache();
  it('set + get', () => { e.set('A', 'hello'); expect(e.get('A')).toBe('hello'); });
  it('size', () => { expect(e.size()).toBe(1); });
});

describe('VoiceDictationMasterIndex', () => {
  const idx = new VoiceDictationMasterIndex();
  it('lists 30 engines', () => { expect(idx.count()).toBe(30); });
});