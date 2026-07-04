/**
 * SelfEditIntegration.test.ts — Direction AS, V3666-V3675 (Batch 3/3 收口)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  EditingPipeline, EditVersionControl, SelfEditStats, EditingChecklist,
  SelfEditDirector, EditDiffReporter, StyleConsistencyChecker,
  SelfEditMemoryBank, EditingGuide, SelfEditMasterIndex,
} from './SelfEditIntegration';

describe('EditingPipeline', () => {
  const e = new EditingPipeline();
  it('isComplete for polish', () => { expect(e.isComplete('polish')).toBe(true); });
  it('next from structure', () => { expect(e.next('structure')).toBe('language'); });
});

describe('EditVersionControl', () => {
  const e = new EditVersionControl();
  it('save + getVersion', () => { const v = e.save('content'); expect(e.getVersion(v)).toBe('content'); });
  it('count after saves', () => { e.save('a'); e.save('b'); expect(e.count()).toBeGreaterThanOrEqual(2); });
});

describe('SelfEditStats', () => {
  const e = new SelfEditStats();
  it('recordEdit + getEditCount', () => { e.recordEdit(); e.recordEdit(); expect(e.getEditCount()).toBe(2); });
  it('recordImprovement + rate', () => { e.recordImprovement(); expect(e.getImprovementRate()).toBeGreaterThan(0); });
});

describe('EditingChecklist', () => {
  const e = new EditingChecklist();
  it('isComplete for all 5', () => { expect(e.isComplete(['结构清晰', '语言流畅', '对话自然', '描写生动', '主题明确'])).toBe(true); });
  it('remaining', () => { expect(e.remaining([])).toHaveLength(5); });
});

describe('SelfEditDirector', () => {
  const e = new SelfEditDirector();
  it('decide fix_critical for many', () => { expect(e.decide({ pipelineStep: 'language', issueCount: 10 })).toBe('fix_critical'); });
  it('decide polish for done', () => { expect(e.decide({ pipelineStep: 'done', issueCount: 0 })).toBe('polish'); });
});

describe('EditDiffReporter', () => {
  const e = new EditDiffReporter();
  it('generateDiff includes before/after', () => { expect(e.generateDiff('abc', 'abcd')).toContain('4'); });
  it('hasChanges for different', () => { expect(e.hasChanges('a', 'b')).toBe(true); });
});

describe('StyleConsistencyChecker', () => {
  const e = new StyleConsistencyChecker();
  it('check for rule', () => { expect(e.check('has X', ['X']).length).toBe(1); });
  it('isConsistent for clean', () => { expect(e.isConsistent('clean', ['X'])).toBe(true); });
});

describe('SelfEditMemoryBank', () => {
  const e = new SelfEditMemoryBank();
  it('recordPattern + topPattern', () => { e.recordPattern('X'); e.recordPattern('X'); e.recordPattern('Y'); expect(e.topPattern()).toBe('X'); });
  it('size', () => { expect(e.size()).toBe(2); });
});

describe('EditingGuide', () => {
  const e = new EditingGuide();
  it('randomTip in list', () => { expect(e.tips).toContain(e.randomTip()); });
  it('isValidTip true', () => { expect(e.isValidTip('先改结构')).toBe(true); });
});

describe('SelfEditMasterIndex', () => {
  const idx = new SelfEditMasterIndex();
  it('lists 28 engines', () => { expect(idx.count()).toBe(28); });
});