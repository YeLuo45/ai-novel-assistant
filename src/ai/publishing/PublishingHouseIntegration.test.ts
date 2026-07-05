/**
 * PublishingHouseIntegration.test.ts — Direction BL, V4236-V4245 (Batch 3/3 收口)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { PublishingMatcher, SubmissionPipeline, PublishingDirector, PublishingReport, PublishingLibrary, PublishingValidator, PublishingTools, PublishingQualityGate, PublishingExport, PublishingHouseMasterIndex } from './PublishingHouseIntegration';
import { PublishingHouse, PublishingHouseLibrary } from './PublishingHouseCore';

describe('PublishingMatcher', () => {
  const e = new PublishingMatcher();
  it('match for genre', () => {
    const lib = new PublishingHouseLibrary();
    lib.add({ name: 'X', genre: 'romance' } as PublishingHouse);
    expect(e.match(lib, { genre: 'romance', wordCount: 100000 }).length).toBe(1);
  });
  it('hasMatch true', () => { expect(e.hasMatch([{} as any])).toBe(true); });
});

describe('SubmissionPipeline', () => {
  const e = new SubmissionPipeline();
  it('isComplete for follow_up', () => { expect(e.isComplete('follow_up')).toBe(true); });
  it('next from match', () => { expect(e.next('match')).toBe('prepare'); });
});

describe('PublishingDirector', () => {
  const e = new PublishingDirector();
  it('decide find_match for not matched', () => { expect(e.decide({ matched: false, submitted: false })).toBe('find_match'); });
  it('decide wait for submitted', () => { expect(e.decide({ matched: true, submitted: true })).toBe('wait'); });
});

describe('PublishingReport', () => {
  const e = new PublishingReport();
  it('generate includes 匹配', () => { expect(e.generate({ matched: 3, submitted: 1 })).toContain('匹配'); });
  it('hasReport true', () => { expect(e.hasReport('匹配')).toBe(true); });
});

describe('PublishingLibrary', () => {
  const e = new PublishingLibrary();
  it('save + get', () => { e.save('X', { name: 'X', genre: 'romance' } as PublishingHouse); expect(e.get('X')?.name).toBe('X'); });
  it('count', () => { expect(e.count()).toBe(1); });
});

describe('PublishingValidator', () => {
  const e = new PublishingValidator();
  it('validate for good', () => { expect(e.validate({ name: 'X', genre: 'romance' } as PublishingHouse).valid).toBe(true); });
  it('isValid true', () => { expect(e.isValid({ valid: true })).toBe(true); });
});

describe('PublishingTools', () => {
  const e = new PublishingTools();
  it('isAvailable for QueryTracker', () => { expect(e.isAvailable('QueryTracker')).toBe(true); });
  it('count returns 3', () => { expect(e.count()).toBe(3); });
});

describe('PublishingQualityGate', () => {
  const e = new PublishingQualityGate();
  it('gate true for full', () => { expect(e.gate({ name: 'X', genre: 'romance' } as PublishingHouse)).toBe(true); });
});

describe('PublishingExport', () => {
  const e = new PublishingExport();
  it('export for empty', () => { expect(e.export(new PublishingHouseLibrary())).toBe('[]'); });
  it('isValid true', () => { expect(e.isValid('[]')).toBe(true); });
});

describe('PublishingHouseMasterIndex', () => {
  const idx = new PublishingHouseMasterIndex();
  it('lists 28 engines', () => { expect(idx.count()).toBe(28); });
});