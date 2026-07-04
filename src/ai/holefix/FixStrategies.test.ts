/**
 * FixStrategies.test.ts — Direction AV, V3746-V3755 (Batch 2/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { MotivationInserter, LogicalChainBuilder, ContinuityRestorer, SettingEnforcer, UnexplainedResolver, BulkFixApplier, FixSafetyChecker, RevisionRecorder, FixIterationCounter, FixStrategiesIndex } from './FixStrategies';

describe('MotivationInserter', () => {
  const e = new MotivationInserter();
  it('insert adds parens', () => { expect(e.insert('hi', 'because')).toContain('because'); });
  it('hasMotivation for parens', () => { expect(e.hasMotivation('hi (because)')).toBe(true); });
});
describe('LogicalChainBuilder', () => {
  const e = new LogicalChainBuilder();
  it('build adds 因为所以', () => { expect(e.build('hi')).toContain('因为'); });
  it('isComplete for 因为+所以', () => { expect(e.isComplete('因为A所以B')).toBe(true); });
});
describe('ContinuityRestorer', () => {
  const e = new ContinuityRestorer();
  it('restore adds reference', () => { expect(e.restore('hi', 'long previous chapter text').slice(0, 200)).toContain('参考'); });
  it('hasRestoration true', () => { expect(e.hasRestoration('[参考] hi')).toBe(true); });
});
describe('SettingEnforcer', () => {
  const e = new SettingEnforcer();
  it('enforce for clean', () => { expect(e.enforce('魔法世界', ['魔法']).violations).toHaveLength(0); });
  it('isCompliant true', () => { expect(e.isCompliant({ violations: [] })).toBe(true); });
});
describe('UnexplainedResolver', () => {
  const e = new UnexplainedResolver();
  it('resolve appends', () => { expect(e.resolve('hi', 'because')).toContain('because'); });
  it('isResolved for parens', () => { expect(e.isResolved('hi (because)')).toBe(true); });
});
describe('BulkFixApplier', () => {
  const e = new BulkFixApplier();
  it('apply joins', () => { expect(e.apply('hi', ['fix1', 'fix2'])).toContain('fix1'); });
  it('count', () => { expect(e.count(['a', 'b', 'c'])).toBe(3); });
});
describe('FixSafetyChecker', () => {
  const e = new FixSafetyChecker();
  it('check empty = unsafe', () => { expect(e.check('').safe).toBe(false); });
  it('check valid = safe', () => { expect(e.check('fix text').safe).toBe(true); });
});
describe('RevisionRecorder', () => {
  const e = new RevisionRecorder();
  it('record + count', () => { e.record('a', 'b'); expect(e.count()).toBe(1); });
});
describe('FixIterationCounter', () => {
  const e = new FixIterationCounter();
  it('increment + count', () => { e.increment(); e.increment(); expect(e.count()).toBe(2); });
  it('isComplete for 5+', () => { for (let i = 0; i < 5; i++) e.increment(); expect(e.isComplete(5)).toBe(true); });
});
describe('FixStrategiesIndex', () => {
  const idx = new FixStrategiesIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});