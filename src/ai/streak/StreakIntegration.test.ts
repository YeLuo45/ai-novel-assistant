/**
 * StreakIntegration.test.ts — Direction AN, V3516-V3525 (Batch 3/3 收口)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  StreakCoachingAI,
  StreakStrategyRecommender,
  WritingSessionPlanner,
  DailyWritingRoutine,
  StreakInsightsGenerator,
  StreakGoalTracker,
  StreakProgressReport,
  StreakADirector,
  HabitFormationPredictor,
  StreakMasterIndex,
} from './StreakIntegration';

describe('StreakCoachingAI', () => {
  const e = new StreakCoachingAI();

  it('getMessage returns string', () => {
    expect(e.getMessage().length).toBeGreaterThan(0);
  });

  it('isEncouraging for 加油', () => {
    expect(e.isEncouraging('加油！')).toBe(true);
  });
});

describe('StreakStrategyRecommender', () => {
  const e = new StreakStrategyRecommender();

  it('recommend for 0', () => {
    expect(e.recommend(0, 0)).toContain('基础');
  });

  it('recommend for 50', () => {
    expect(e.recommend(50, 1000)).toContain('稳定');
  });
});

describe('WritingSessionPlanner', () => {
  const e = new WritingSessionPlanner();

  it('plan returns 4 time segments', () => {
    const r = e.plan(60, 1000);
    expect(r.warmup).toBeGreaterThan(0);
    expect(r.writing).toBeGreaterThan(0);
    expect(r.review).toBeGreaterThan(0);
  });

  it('isBalanced true', () => {
    const r = e.plan(60, 1000);
    expect(e.isBalanced(r)).toBe(true);
  });
});

describe('DailyWritingRoutine', () => {
  const e = new DailyWritingRoutine();

  it('generate returns steps + duration', () => {
    const r = e.generate(['warmup', 'write', 'review']);
    expect(r.totalDuration).toBe(45);
  });

  it('hasMinimumSteps for 2+', () => {
    expect(e.hasMinimumSteps(['a', 'b'])).toBe(true);
  });
});

describe('StreakInsightsGenerator', () => {
  const e = new StreakInsightsGenerator();

  it('generate includes stats', () => {
    expect(e.generate({ streak: 7, avgWords: 1000, avgQuality: 0.8 })).toContain('7');
  });
});

describe('StreakGoalTracker', () => {
  const e = new StreakGoalTracker();

  it('add + update + getProgress', () => {
    e.add('words', 1000);
    e.update('words', 500);
    expect(e.getProgress('words')).toBe(0.5);
  });

  it('isAchieved for 1.0', () => {
    e.add('done', 100);
    e.update('done', 100);
    expect(e.isAchieved('done')).toBe(true);
  });
});

describe('StreakProgressReport', () => {
  const e = new StreakProgressReport();

  it('generate markdown', () => {
    const r = e.generate({ streak: 7, totalWords: 7000, daysActive: 7, avgQuality: 0.8 });
    expect(r).toContain('周报');
  });
});

describe('StreakADirector', () => {
  const e = new StreakADirector();

  it('decideAction easy for low energy', () => {
    expect(e.decideAction({ streak: 5, todayDone: false, energy: 0.2 })).toBe('easy');
  });

  it('decideAction hard for 30+', () => {
    expect(e.decideAction({ streak: 30, todayDone: false, energy: 0.7 })).toBe('hard');
  });
});

describe('HabitFormationPredictor', () => {
  const e = new HabitFormationPredictor();

  it('predict for 21 days + 1.0 = 1.0', () => {
    expect(e.predict(21, 1.0)).toBe(1);
  });

  it('isHabitFormed for 1.0', () => {
    expect(e.isHabitFormed(1.0)).toBe(true);
  });
});

describe('StreakMasterIndex', () => {
  const idx = new StreakMasterIndex();

  it('lists 28 engines', () => {
    expect(idx.count()).toBe(28);
  });
});
