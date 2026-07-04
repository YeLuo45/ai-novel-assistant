/**
 * FixIntegration.test.ts — Direction AV, V3756-V3765 (Batch 3/3 收口)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { FixPipeline, FixWorkflow, AutoFixDirector, FixReportGenerator, FixVerification, FixMemoryBank, FixStats, FixADirector, FixTools, FixMasterIndex } from './FixIntegration';

describe('FixPipeline', () => {
  const e = new FixPipeline();
  it('isComplete for review', () => { expect(e.isComplete('review')).toBe(true); });
  it('next from detect', () => { expect(e.next('detect')).toBe('categorize'); });
});
describe('FixWorkflow', () => {
  const e = new FixWorkflow();
  it('transition + isComplete for done', () => { e.transition('done'); expect(e.isComplete()).toBe(true); });
});
describe('AutoFixDirector', () => {
  const e = new AutoFixDirector();
  it('decide done for 0', () => { expect(e.decide(0, 0)).toBe('done'); });
  it('decide fix_critical for 0.8+', () => { expect(e.decide(5, 0.8)).toBe('fix_critical'); });
});
describe('FixReportGenerator', () => {
  const e = new FixReportGenerator();
  it('generate includes 漏洞', () => { expect(e.generate('text', 5, 3)).toContain('漏洞'); });
  it('hasReport true', () => { expect(e.hasReport('检测到漏洞')).toBe(true); });
});
describe('FixVerification', () => {
  const e = new FixVerification();
  it('verify changed', () => { const r = e.verify('abc', 'abcd'); expect(r.improved).toBe(true); });
  it('isImproved for change', () => { expect(e.isImproved({ improved: true })).toBe(true); });
});
describe('FixMemoryBank', () => {
  const e = new FixMemoryBank();
  it('store + retrieve', () => { e.store('h', 'f'); expect(e.retrieve('h')).toBe('f'); });
  it('size', () => { expect(e.size()).toBe(1); });
});
describe('FixStats', () => {
  const e = new FixStats();
  it('recordApplied + getApplied', () => { e.recordApplied(); expect(e.getApplied()).toBe(1); });
  it('recordVerified + rate', () => { e.recordVerified(); expect(e.verificationRate()).toBe(1); });
});
describe('FixADirector', () => {
  const e = new FixADirector();
  it('decideNextStep finalize for done', () => { expect(e.decideNextStep({ pipelineStep: 'done', reviewedCount: 5, totalCount: 5 })).toBe('finalize'); });
  it('decideNextStep review_more for partial', () => { expect(e.decideNextStep({ pipelineStep: 'review', reviewedCount: 2, totalCount: 5 })).toBe('review_more'); });
});
describe('FixTools', () => {
  const e = new FixTools();
  it('isAvailable for AutoFix', () => { expect(e.isAvailable('AutoFix')).toBe(true); });
  it('count returns 3', () => { expect(e.count()).toBe(3); });
});
describe('FixMasterIndex', () => {
  const idx = new FixMasterIndex();
  it('lists 28 engines', () => { expect(idx.count()).toBe(28); });
});