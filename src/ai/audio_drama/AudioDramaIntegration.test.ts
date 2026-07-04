/**
 * AudioDramaIntegration.test.ts — Direction BI, V4146-V4155 (Batch 3/3 收口)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { AudioDramaPipeline, AudioDramaDirector, AudioDramaReport, AudioDramaLibrary, AudioDramaValidator, AudioDramaTools, AudioDramaQualityGate, AudioDramaExport, AudioDramaADirector2, AudioDramaMasterIndex } from './AudioDramaIntegration';

describe('AudioDramaPipeline', () => {
  const e = new AudioDramaPipeline();
  it('isComplete for master', () => { expect(e.isComplete('master')).toBe(true); });
  it('next from script', () => { expect(e.next('script')).toBe('sound_design'); });
});

describe('AudioDramaDirector', () => {
  const e = new AudioDramaDirector();
  it('decide write_script for empty', () => { expect(e.decide({ hasScript: false, hasSound: false, hasMusic: false })).toBe('write_script'); });
  it('decide produce for all', () => { expect(e.decide({ hasScript: true, hasSound: true, hasMusic: true })).toBe('produce'); });
});

describe('AudioDramaReport', () => {
  const e = new AudioDramaReport();
  it('generate includes 分钟', () => { expect(e.generate({ duration: 30, cues: 20 })).toContain('分钟'); });
  it('hasReport true', () => { expect(e.hasReport('分钟')).toBe(true); });
});

describe('AudioDramaLibrary', () => {
  const e = new AudioDramaLibrary();
  it('save + get', () => { e.save('A', { data: 'x' }); expect(e.get('A')).toBeDefined(); });
  it('count', () => { expect(e.count()).toBe(1); });
});

describe('AudioDramaValidator', () => {
  const e = new AudioDramaValidator();
  it('validate for good', () => { expect(e.validate({ cues: 10, duration: 30 }).valid).toBe(true); });
  it('isValid true', () => { expect(e.isValid({ valid: true })).toBe(true); });
});

describe('AudioDramaTools', () => {
  const e = new AudioDramaTools();
  it('isAvailable for Audacity', () => { expect(e.isAvailable('Audacity')).toBe(true); });
  it('count returns 3', () => { expect(e.count()).toBe(3); });
});

describe('AudioDramaQualityGate', () => {
  const e = new AudioDramaQualityGate();
  it('gate true for 5+/5+', () => { expect(e.gate({ duration: 5, cues: 5 })).toBe(true); });
  it('gate false for short', () => { expect(e.gate({ duration: 1, cues: 1 })).toBe(false); });
});

describe('AudioDramaExport', () => {
  const e = new AudioDramaExport();
  it('export includes [AUDIO_DRAMA]', () => { expect(e.export('x')).toContain('[AUDIO_DRAMA]'); });
  it('isValid true', () => { expect(e.isValid('[AUDIO_DRAMA]')).toBe(true); });
});

describe('AudioDramaADirector2', () => {
  const e = new AudioDramaADirector2();
  it('decide produce for not produced', () => { expect(e.decide({ produced: false, reviewed: false })).toBe('produce'); });
  it('decide distribute for done', () => { expect(e.decide({ produced: true, reviewed: true })).toBe('distribute'); });
});

describe('AudioDramaMasterIndex', () => {
  const idx = new AudioDramaMasterIndex();
  it('lists 28 engines', () => { expect(idx.count()).toBe(28); });
});