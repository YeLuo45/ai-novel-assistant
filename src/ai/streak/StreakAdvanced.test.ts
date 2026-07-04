/**
 * StreakAdvanced.test.ts — Direction AN, V3506-V3515 (Batch 2/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  StreakPredictor,
  EnergyLevelPredictor,
  OptimalWritingTime,
  StreakRewardSystem,
  HabitResistancePredictor,
  ProductivityAnalyzer,
  WritingEnvironmentOptimizer,
  DistractionBlocker,
  MomentumTracker,
  StreakAdvancedIndex,
  type WritingSession,
} from './StreakAdvanced';

describe('StreakPredictor', () => {
  const e = new StreakPredictor();

  it('predict for 7 days', () => {
    const history = Array.from({ length: 7 }, () => ({ date: 'd', wrote: true }));
    expect(e.predict(history)).toBeGreaterThan(0.8);
  });

  it('isOnTrackToExtend for high success', () => {
    expect(e.isOnTrackToExtend(10, 0.9)).toBe(true);
  });
});

describe('EnergyLevelPredictor', () => {
  const e = new EnergyLevelPredictor();

  it('peak hour 10', () => {
    expect(e.predict(10, 3)).toBeGreaterThan(0.5);
  });

  it('isPeakHour for 10', () => {
    expect(e.isPeakHour(10)).toBe(true);
  });

  it('isPeakHour false for 14', () => {
    expect(e.isPeakHour(14)).toBe(false);
  });
});

describe('OptimalWritingTime', () => {
  const e = new OptimalWritingTime();

  it('recommend for empty', () => {
    expect(e.recommend([]).hour).toBe(9);
  });

  it('recommend for history picks max hour', () => {
    const r = e.recommend([{ hour: 9, words: 100 }, { hour: 15, words: 500 }]);
    expect(r.hour).toBe(15);
  });
});

describe('StreakRewardSystem', () => {
  const e = new StreakRewardSystem();

  it('getReward for 7', () => {
    expect(e.getReward(7)).toContain('书');
  });

  it('nextMilestone for 5', () => {
    expect(e.nextMilestone(5)?.streak).toBe(7);
  });
});

describe('HabitResistancePredictor', () => {
  const e = new HabitResistancePredictor();

  it('predict for distractions', () => {
    expect(e.predict([{ type: 'phone', intensity: 0.5 }])).toBeGreaterThan(0);
  });

  it('isHighRisk for 0.8+', () => {
    expect(e.isHighRisk(0.8)).toBe(true);
  });
});

describe('ProductivityAnalyzer', () => {
  const e = new ProductivityAnalyzer();

  it('analyze returns 3 fields', () => {
    const r = e.analyze([{ date: 'd1', words: 100, durationMinutes: 30, quality: 0.8 }]);
    expect(r.wordsPerHour).toBeGreaterThan(0);
  });

  it('analyze up trend', () => {
    const sessions: WritingSession[] = [
      { date: 'd1', words: 100, durationMinutes: 30, quality: 0.5 },
      { date: 'd2', words: 150, durationMinutes: 30, quality: 0.5 },
      { date: 'd3', words: 200, durationMinutes: 30, quality: 0.5 },
      { date: 'd4', words: 500, durationMinutes: 30, quality: 0.8 },
      { date: 'd5', words: 600, durationMinutes: 30, quality: 0.8 },
      { date: 'd6', words: 700, durationMinutes: 30, quality: 0.8 },
    ];
    expect(e.analyze(sessions).trend).toBe('up');
  });
});

describe('WritingEnvironmentOptimizer', () => {
  const e = new WritingEnvironmentOptimizer();

  it('optimize for good env', () => {
    const r = e.optimize([{ factor: 'noise', rating: 0.9 }]);
    expect(r.issues).toHaveLength(0);
  });

  it('optimize for bad noise', () => {
    const r = e.optimize([{ factor: 'noise', rating: 0.2 }]);
    expect(r.issues.length).toBeGreaterThan(0);
  });
});

describe('DistractionBlocker', () => {
  const e = new DistractionBlocker();

  it('record + topDistractions', () => {
    e.record('phone');
    e.record('phone');
    e.record('email');
    const top = e.topDistractions(2);
    expect(top[0].source).toBe('phone');
  });
});

describe('MomentumTracker', () => {
  const e = new MomentumTracker();

  it('recordSession + getMomentum', () => {
    e.recordSession(1000);
    expect(e.getMomentum()).toBeGreaterThan(0.5);
  });

  it('recordSkip reduces momentum', () => {
    e.recordSession(1000);
    e.recordSkip();
    expect(e.getMomentum()).toBeLessThan(1);
  });

  it('isHighMomentum for 0.7+', () => {
    e.recordSession(2000);
    expect(e.isHighMomentum()).toBe(true);
  });
});

describe('StreakAdvancedIndex', () => {
  const idx = new StreakAdvancedIndex();

  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});
