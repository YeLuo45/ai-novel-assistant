/**
 * ABTestIntegration.test.ts — Direction AY, V3846-V3855 (Batch 3/3 收口)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { TitleExperimentRunner, TitlePerformanceTracker, TitleABDashboard, TitleWinnerPromoter, TitleTestScheduler, TitleABInsightGenerator, TitleABBudgetCalculator, TitleABDirector, TitleABMemoryBank, TitleABMasterIndex } from './ABTestIntegration';

describe('TitleExperimentRunner', () => {
  const e = new TitleExperimentRunner();
  it('setVariant + getVariant', () => { e.setVariant('B'); expect(e.getVariant()).toBe('B'); });
  it('rotate A→B', () => { e.setVariant('A'); e.rotate(); expect(e.getVariant()).toBe('B'); });
});

describe('TitlePerformanceTracker', () => {
  const e = new TitlePerformanceTracker();
  it('record + averageCTR', () => { e.record('A', 0.1); e.record('B', 0.2); expect(e.averageCTR()).toBeCloseTo(0.15, 5); });
});

describe('TitleABDashboard', () => {
  const e = new TitleABDashboard();
  it('generate includes CTR', () => { const t = new TitlePerformanceTracker(); t.record('A', 0.1); expect(e.generate(t)).toContain('CTR'); });
  it('hasDashboard true', () => { expect(e.hasDashboard('CTR 0.1')).toBe(true); });
});

describe('TitleWinnerPromoter', () => {
  const e = new TitleWinnerPromoter();
  it('promote + isPromoted', () => { e.promote('A'); expect(e.isPromoted('A')).toBe(true); });
});

describe('TitleTestScheduler', () => {
  const e = new TitleTestScheduler();
  it('schedule for 3', () => { expect(e.schedule(['A', 'B'], 7)).toHaveLength(2); });
  it('isValidSchedule true', () => { expect(e.isValidSchedule([{ variant: 'A', day: 0 }])).toBe(true); });
});

describe('TitleABInsightGenerator', () => {
  const e = new TitleABInsightGenerator();
  it('generate for results', () => { expect(e.generate([{ variant: 'A', ctr: 0.1 }, { variant: 'B', ctr: 0.2 }])).toContain('推荐'); });
  it('isInsight true', () => { expect(e.isInsight('推荐标题')).toBe(true); });
});

describe('TitleABBudgetCalculator', () => {
  const e = new TitleABBudgetCalculator();
  it('calculate for 7 days', () => { expect(e.calculate(7, 100, 0.5)).toBe(350); });
  it('isWithinBudget true', () => { expect(e.isWithinBudget(100, 500)).toBe(true); });
});

describe('TitleABDirector', () => {
  const e = new TitleABDirector();
  it('decide start for not running', () => { expect(e.decide({ running: false, result: null })).toBe('start'); });
  it('decide finalize for result', () => { expect(e.decide({ running: true, result: 'A wins' })).toBe('finalize'); });
});

describe('TitleABMemoryBank', () => {
  const e = new TitleABMemoryBank();
  it('storeWinner + getWinner', () => { e.storeWinner('Title1', 'Variant A'); expect(e.getWinner('Title1')).toBe('Variant A'); });
  it('size', () => { expect(e.size()).toBe(1); });
});

describe('TitleABMasterIndex', () => {
  const idx = new TitleABMasterIndex();
  it('lists 28 engines', () => { expect(idx.count()).toBe(28); });
});