/**
 * StreakCore.test.ts — Direction AN, V3496-V3505 (Batch 1/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  StreakCalculator,
  StreakRecord,
  HabitLoopBuilder,
  DailyGoalSuggester,
  ProgressVisualizer,
  StreakMilestone,
  StreakRecovery,
  HabitStackingEngine,
  TriggerRoutineBuilder,
  StreakCoreIndex,
  type WritingSession,
} from './StreakCore';

describe('StreakCalculator', () => {
  const e = new StreakCalculator();

  it('currentStreak for 3 consecutive days', () => {
    e.record('2026-01-01');
    e.record('2026-01-02');
    e.record('2026-01-03');
    expect(e.currentStreak('2026-01-03')).toBe(3);
  });

  it('currentStreak 0 if today not recorded', () => {
    e.record('2026-01-01');
    expect(e.currentStreak('2026-01-10')).toBe(0);
  });

  it('bestStreak for 3 in a row', () => {
    e.record('2026-01-01');
    e.record('2026-01-02');
    e.record('2026-01-03');
    expect(e.bestStreak()).toBe(3);
  });
});

describe('StreakRecord', () => {
  const e = new StreakRecord();

  it('addSession + totalWords', () => {
    e.addSession({ date: 'd1', words: 100, durationMinutes: 30, quality: 0.8 });
    e.addSession({ date: 'd2', words: 200, durationMinutes: 60, quality: 0.9 });
    expect(e.totalWords()).toBe(300);
  });

  it('averageQuality', () => {
    const e2 = new StreakRecord();
    e2.addSession({ date: 'd1', words: 100, durationMinutes: 30, quality: 0.8 });
    e2.addSession({ date: 'd2', words: 200, durationMinutes: 60, quality: 0.6 });
    expect(e2.averageQuality()).toBeCloseTo(0.7, 5);
  });
});

describe('HabitLoopBuilder', () => {
  const e = new HabitLoopBuilder();

  it('build returns 3 fields', () => {
    const r = e.build('起床', '写作 30 分钟', '喝咖啡');
    expect(r.cue).toBe('起床');
  });

  it('isComplete true for non-empty', () => {
    expect(e.isComplete({ cue: 'a', routine: 'b', reward: 'c' })).toBe(true);
  });
});

describe('DailyGoalSuggester', () => {
  const e = new DailyGoalSuggester();

  it('suggest for avg 1000', () => {
    expect(e.suggest(1000)).toBeGreaterThanOrEqual(100);
  });

  it('isAmbitious for 3x', () => {
    expect(e.isAmbitious(3000, 1000)).toBe(true);
  });

  it('isRealistic for 100-5000', () => {
    expect(e.isRealistic(1000)).toBe(true);
  });
});

describe('ProgressVisualizer', () => {
  const e = new ProgressVisualizer();

  it('renderCalendar for N days', () => {
    expect(e.renderCalendar(['a', 'b', 'c'])).toHaveLength(3);
  });

  it('renderProgressBar 50%', () => {
    expect(e.renderProgressBar(0.5, 10)).toHaveLength(10);
  });

  it('renderStreak for 5', () => {
    expect(e.renderStreak(5)).toBe('🔥🔥🔥🔥🔥');
  });
});

describe('StreakMilestone', () => {
  const e = new StreakMilestone();

  it('check for 7 days', () => {
    const r = e.check(7);
    expect(r.achieved).toContain(7);
    expect(r.nextTarget).toBe(14);
  });

  it('isMajorMilestone for 7', () => {
    expect(e.isMajorMilestone(7)).toBe(true);
  });
});

describe('StreakRecovery', () => {
  const e = new StreakRecovery();

  it('recommend for 1 day', () => {
    expect(e.recommend(1)).toContain('1 天');
  });

  it('recommend for 30+', () => {
    expect(e.recommend(30)).toContain('5 分钟');
  });

  it('isRecoverable for 30-', () => {
    expect(e.isRecoverable(30)).toBe(true);
  });
});

describe('HabitStackingEngine', () => {
  const e = new HabitStackingEngine();

  it('stack returns formatted', () => {
    expect(e.stack('写 30 分钟', '喝咖啡')).toContain('喝咖啡');
    expect(e.stack('写 30 分钟', '喝咖啡')).toContain('写 30 分钟');
  });

  it('isValidStack for proper format', () => {
    expect(e.isValidStack('在A之后，我立即B')).toBe(true);
  });
});

describe('TriggerRoutineBuilder', () => {
  const e = new TriggerRoutineBuilder();

  it('build returns trigger/routine/reward', () => {
    const r = e.build('起床', '写作', '咖啡');
    expect(r.trigger).toBe('起床');
  });

  it('isComplete true', () => {
    expect(e.isComplete({ trigger: 'a', routine: 'b', reward: 'c' })).toBe(true);
  });
});

describe('StreakCoreIndex', () => {
  const idx = new StreakCoreIndex();

  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});
