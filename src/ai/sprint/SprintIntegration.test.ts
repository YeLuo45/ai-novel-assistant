/**
 * SprintIntegration.test.ts — Direction BD, V3996-V4005 (Batch 3/3 收口)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { SprintRunner, SprintSchedule, SprintChallenge, SprintPhase, SprintFocusMusic, SprintADirector, SprintLibrary, SprintTools, SprintReport, SprintMasterIndex } from './SprintIntegration';

describe('SprintRunner', () => {
  const e = new SprintRunner();
  it('run + averageWpm', () => { e.run('2026-01-01', 300, 10); expect(e.averageWpm()).toBe(30); });
  it('totalWords', () => { expect(e.totalWords()).toBe(300); });
});

describe('SprintSchedule', () => {
  const e = new SprintSchedule();
  it('add + hasOnDay', () => { e.add('Monday', 1); expect(e.hasOnDay('Monday')).toBe(true); });
});

describe('SprintChallenge', () => {
  const e = new SprintChallenge();
  it('set + isCompleted', () => { e.set(1000); expect(e.isCompleted(1000)).toBe(true); });
});

describe('SprintPhase', () => {
  const e = new SprintPhase();
  it('duration for warmup', () => { expect(e.duration('warmup')).toBe(5); });
  it('isValid true', () => { expect(e.isValid('peak')).toBe(true); });
});

describe('SprintFocusMusic', () => {
  const e = new SprintFocusMusic();
  it('isCalming for lofi', () => { expect(e.isCalming('lofi')).toBe(true); });
  it('isEnergizing for rock', () => { expect(e.isEnergizing('rock')).toBe(true); });
});

describe('SprintADirector', () => {
  const e = new SprintADirector();
  it('decide start for 0', () => { expect(e.decide({ lastSprintWords: 0, goal: 500 })).toBe('start'); });
  it('decide continue for goal', () => { expect(e.decide({ lastSprintWords: 500, goal: 500 })).toBe('continue'); });
});

describe('SprintLibrary', () => {
  const e = new SprintLibrary();
  it('add + findByWords', () => { e.add('A', 25, 500); expect(e.findByWords(500)?.name).toBe('A'); });
  it('count', () => { expect(e.count()).toBe(1); });
});

describe('SprintTools', () => {
  const e = new SprintTools();
  it('isAvailable for Pomodoro', () => { expect(e.isAvailable('Pomodoro')).toBe(true); });
  it('count returns 3', () => { expect(e.count()).toBe(3); });
});

describe('SprintReport', () => {
  const e = new SprintReport();
  it('generate includes 冲刺', () => { expect(e.generate([{ words: 500, duration: 10 }])).toContain('冲刺'); });
  it('hasReport true', () => { expect(e.hasReport('冲刺')).toBe(true); });
});

describe('SprintMasterIndex', () => {
  const idx = new SprintMasterIndex();
  it('lists 28 engines', () => { expect(idx.count()).toBe(28); });
});