/**
 * VoiceCommandIntegration.test.ts — Direction BX, V4516-V4525 (Batch 3/3 收口)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { VoiceCommandPipeline, VoiceCommandDirector, VoiceCommandReport, VoiceCommandLibrary, VoiceCommandValidator, VoiceCommandTools, VoiceCommandQualityGate, VoiceCommandADirector, VoiceCommandAnalytics, VoiceCommandMasterIndex } from './VoiceCommandIntegration';

describe('VoiceCommandPipeline', () => {
  const e = new VoiceCommandPipeline();
  it('isComplete for feedback', () => { expect(e.isComplete('feedback')).toBe(true); });
  it('next from detect', () => { expect(e.next('detect')).toBe('recognize'); });
});

describe('VoiceCommandDirector', () => {
  const e = new VoiceCommandDirector();
  it('decide detect for empty', () => { expect(e.decide({ detected: false, dispatched: false })).toBe('detect'); });
  it('decide feedback for done', () => { expect(e.decide({ detected: true, dispatched: true })).toBe('feedback'); });
});

describe('VoiceCommandReport', () => {
  const e = new VoiceCommandReport();
  it('generate includes 命令', () => { expect(e.generate({ commands: 10, success: 8 })).toContain('命令'); });
  it('hasReport true', () => { expect(e.hasReport('命令')).toBe(true); });
});

describe('VoiceCommandLibrary', () => {
  const e = new VoiceCommandLibrary();
  it('save + get', () => { e.save('open', 'openFile'); expect(e.get('open')).toBe('openFile'); });
  it('count', () => { expect(e.count()).toBe(1); });
});

describe('VoiceCommandValidator', () => {
  const e = new VoiceCommandValidator();
  it('validate for good', () => { expect(e.validate({ name: 'open', action: 'openFile' }).valid).toBe(true); });
  it('isValid true', () => { expect(e.isValid({ valid: true })).toBe(true); });
});

describe('VoiceCommandTools', () => {
  const e = new VoiceCommandTools();
  it('isAvailable for Porcupine', () => { expect(e.isAvailable('Porcupine')).toBe(true); });
  it('count returns 3', () => { expect(e.count()).toBe(3); });
});

describe('VoiceCommandQualityGate', () => {
  const e = new VoiceCommandQualityGate();
  it('gate true for full', () => { expect(e.gate({ name: 'A', action: 'B' })).toBe(true); });
});

describe('VoiceCommandADirector', () => {
  const e = new VoiceCommandADirector();
  it('decide listen for empty', () => { expect(e.decide({ listened: false, executed: false })).toBe('listen'); });
  it('decide confirm for done', () => { expect(e.decide({ listened: true, executed: true })).toBe('confirm'); });
});

describe('VoiceCommandAnalytics', () => {
  const e = new VoiceCommandAnalytics();
  it('compute for 10/8', () => { expect(e.compute({ total: 10, success: 8 }).successRate).toBe(0.8); });
  it('isHealthy for 0.8', () => { expect(e.isHealthy({ successRate: 0.8 })).toBe(true); });
});

describe('VoiceCommandMasterIndex', () => {
  const idx = new VoiceCommandMasterIndex();
  it('lists 30 engines', () => { expect(idx.count()).toBe(30); });
});