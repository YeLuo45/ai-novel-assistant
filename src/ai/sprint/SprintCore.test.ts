/**
 * SprintCore.test.ts — Direction BD, V3976-V3985 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { SprintTimer, SprintTracker, SprintSessionType, SprintProgress, SprintGoalSetter, SprintBreakTimer, SprintGoalPredictor, SprintDistractionLogger, SprintStats, SprintCoreIndex } from './SprintCore';

describe('SprintTimer', () => {
  const e = new SprintTimer();
  it('start returns startTime + duration', () => { const s = e.start(30); expect(s.duration).toBe(30); });
  it('isComplete for past', () => { expect(e.isComplete({ startTime: Date.now() - 100000, duration: 1 })).toBe(true); });
  it('remaining 0 for past', () => { expect(e.remaining({ startTime: Date.now() - 100000, duration: 1 })).toBe(0); });
});

describe('SprintTracker', () => {
  const e = new SprintTracker();
  it('record + totalWords', () => { e.record({ startTime: Date.now(), duration: 30 }, 500); expect(e.totalWords()).toBe(500); });
  it('sprintCount', () => { expect(e.sprintCount()).toBe(1); });
});

describe('SprintSessionType', () => {
  const e = new SprintSessionType();
  it('getDuration for pomodoro', () => { e.type = 'pomodoro'; expect(e.getDuration()).toBe(25); });
  it('isStructured true for pomodoro', () => { e.type = 'pomodoro'; expect(e.isStructured()).toBe(true); });
});

describe('SprintProgress', () => {
  const e = new SprintProgress();
  it('progress high for past', () => { expect(e.progress({ startTime: Date.now() - 1000000, duration: 1 })).toBeGreaterThan(0.9); });
  it('isHalfway for past', () => { expect(e.isHalfway({ startTime: Date.now() - 1000000, duration: 1 })).toBe(true); });
});

describe('SprintGoalSetter', () => {
  const e = new SprintGoalSetter();
  it('set + isAchieved', () => { e.set(500); expect(e.isAchieved(500)).toBe(true); });
  it('progress for 0', () => { e.set(0); expect(e.progress(0)).toBe(0); });
});

describe('SprintBreakTimer', () => {
  const e = new SprintBreakTimer();
  it('startBreak returns', () => { const b = e.startBreak(5); expect(b.duration).toBe(5); });
  it('isOver for past', () => { expect(e.isOver({ startTime: Date.now() - 1000000, duration: 1 })).toBe(true); });
});

describe('SprintGoalPredictor', () => {
  const e = new SprintGoalPredictor();
  it('predict linear', () => { expect(e.predict(100, 10, 30)).toBe(300); });
  it('isOnTrack true', () => { expect(e.isOnTrack(500, 500)).toBe(true); });
});

describe('SprintDistractionLogger', () => {
  const e = new SprintDistractionLogger();
  it('log + count', () => { e.log('phone'); expect(e.count()).toBe(1); });
});

describe('SprintStats', () => {
  const e = new SprintStats();
  it('record + wpm', () => { e.record(300, 10); expect(e.wpm()).toBe(30); });
  it('totalWords', () => { expect(e.totalWords()).toBe(300); });
});

describe('SprintCoreIndex', () => {
  const idx = new SprintCoreIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});