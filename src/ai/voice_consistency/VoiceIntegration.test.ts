/**
 * VoiceIntegration.test.ts — Direction AX, V3816-V3825 (Batch 3/3 收口)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { VoiceConsistencyPipeline, VoiceConsistencyDirector, VoiceConsistencyStats, VoiceConsistencyReportGenerator, VoiceEnforcementADirector, VoiceConsistencyLibrary, VoiceConsistencyValidator, VoiceConsistencyTools, VoiceConsistencyADirector2, VoiceConsistencyMasterIndex } from './VoiceIntegration';

describe('VoiceConsistencyPipeline', () => {
  const e = new VoiceConsistencyPipeline();
  it('isComplete for review', () => { expect(e.isComplete('review')).toBe(true); });
  it('next from capture', () => { expect(e.next('capture')).toBe('check'); });
});

describe('VoiceConsistencyDirector', () => {
  const e = new VoiceConsistencyDirector();
  it('decide done for enforced', () => { expect(e.decide({ drift: 0, enforced: true })).toBe('done'); });
  it('decide enforce_strong for 0.6', () => { expect(e.decide({ drift: 0.6, enforced: false })).toBe('enforce_strong'); });
});

describe('VoiceConsistencyStats', () => {
  const e = new VoiceConsistencyStats();
  it('recordCheck + recordViolation + rate', () => { e.recordCheck(); e.recordCheck(); e.recordViolation(); expect(e.violationRate()).toBe(0.5); });
});

describe('VoiceConsistencyReportGenerator', () => {
  const e = new VoiceConsistencyReportGenerator();
  it('generate includes stats', () => { expect(e.generate({ checks: 10, violations: 2 })).toContain('10'); });
  it('hasIssues true', () => { expect(e.hasIssues('违规')).toBe(true); });
});

describe('VoiceEnforcementADirector', () => {
  const e = new VoiceEnforcementADirector();
  it('decide finalize for no violations', () => { expect(e.decideNextStep({ violations: 0, total: 5 })).toBe('finalize'); });
  it('decide manual_review for 70%+', () => { expect(e.decideNextStep({ violations: 4, total: 5 })).toBe('manual_review'); });
});

describe('VoiceConsistencyLibrary', () => {
  const e = new VoiceConsistencyLibrary();
  it('save + load', () => { e.save('A', { avgLen: 10 }); expect(e.load('A')).toBeDefined(); });
  it('count', () => { expect(e.count()).toBe(1); });
});

describe('VoiceConsistencyValidator', () => {
  const e = new VoiceConsistencyValidator();
  it('validate for good profile', () => { expect(e.validate({ avgLen: 10, vocabRichness: 0.5, formality: 0.5 }).valid).toBe(true); });
  it('isValid true', () => { expect(e.isValid({ valid: true })).toBe(true); });
});

describe('VoiceConsistencyTools', () => {
  const e = new VoiceConsistencyTools();
  it('isAvailable for AutoEnforce', () => { expect(e.isAvailable('AutoEnforce')).toBe(true); });
  it('count returns 3', () => { expect(e.count()).toBe(3); });
});

describe('VoiceConsistencyADirector2', () => {
  const e = new VoiceConsistencyADirector2();
  it('decidePriority low for 0.1', () => { expect(e.decidePriority(0.1)).toBe('low'); });
  it('decidePriority high for 0.6', () => { expect(e.decidePriority(0.6)).toBe('high'); });
});

describe('VoiceConsistencyMasterIndex', () => {
  const idx = new VoiceConsistencyMasterIndex();
  it('lists 29 engines', () => { expect(idx.count()).toBe(29); });
});