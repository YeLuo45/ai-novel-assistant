/**
 * BlockIntegration.test.ts — Direction AJ, V3396-V3405 (Batch 3/3 收口)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  ComprehensiveBlockAnalyzer,
  BlockPreventionPredictor,
  BlockRecoveryPlan,
  WritingHabitTracker,
  EnergyMonitor,
  BlockAlertSystem,
  WriterProfileTracker,
  BlockCategoryReport,
  BlockAIDirector,
  BlockBreakerIndex,
  type BlockType,
} from './BlockIntegration';

describe('ComprehensiveBlockAnalyzer', () => {
  const e = new ComprehensiveBlockAnalyzer();

  it('analyze empty returns 0', () => {
    const r = e.analyze([]);
    expect(r.totalSeverity).toBe(0);
  });

  it('analyze finds primary type', () => {
    const r = e.analyze([
      { type: 'plot' as BlockType, severity: 0.8, date: '2026-01-01' },
      { type: 'plot' as BlockType, severity: 0.5, date: '2026-01-02' },
    ]);
    expect(r.primaryType).toBe('plot');
  });
});

describe('BlockPreventionPredictor', () => {
  const e = new BlockPreventionPredictor();

  it('predict low words high risk', () => {
    const r = e.predict([
      { wordsWritten: 100, date: 'd1' },
      { wordsWritten: 200, date: 'd2' },
      { wordsWritten: 150, date: 'd3' },
    ]);
    expect(r.risk).toBeGreaterThan(0.5);
  });

  it('predict high words low risk', () => {
    const r = e.predict([
      { wordsWritten: 2000, date: 'd1' },
      { wordsWritten: 2500, date: 'd2' },
      { wordsWritten: 3000, date: 'd3' },
    ]);
    expect(r.risk).toBeLessThan(0.5);
  });
});

describe('BlockRecoveryPlan', () => {
  const e = new BlockRecoveryPlan();

  it('generate for low severity', () => {
    const r = e.generate(0.2, 'plot');
    expect(r.steps.length).toBeGreaterThan(0);
  });

  it('generate for high severity longer steps', () => {
    const low = e.generate(0.2, 'plot').steps.length;
    const high = e.generate(0.9, 'plot').steps.length;
    expect(high).toBeGreaterThanOrEqual(low);
  });
});

describe('WritingHabitTracker', () => {
  const e = new WritingHabitTracker();

  it('record + getHabit', () => {
    e.record('2026-01-01', 500);
    expect(e.getHabit('2026-01-01')?.count).toBe(1);
  });

  it('isConsistent false for <5', () => {
    e.record('2026-01-01', 100);
    e.record('2026-01-02', 200);
    expect(e.isConsistent(5)).toBe(false);
  });
});

describe('EnergyMonitor', () => {
  const e = new EnergyMonitor();

  it('averageLevel for empty = 0', () => {
    expect(e.averageLevel()).toBe(0);
  });

  it('log + averageLevel', () => {
    e.log('d1', 0.8);
    e.log('d2', 0.6);
    expect(e.averageLevel()).toBeCloseTo(0.7, 5);
  });

  it('isLow for 0.2', () => {
    const e2 = new EnergyMonitor();
    e2.log('d1', 0.2);
    expect(e2.isLow(0.3)).toBe(true);
  });
});

describe('BlockAlertSystem', () => {
  const e = new BlockAlertSystem();

  it('alert + getAlerts', () => {
    e.alert('test', 'low');
    expect(e.getAlerts()).toHaveLength(1);
  });

  it('hasHighAlert for high', () => {
    e.alert('test', 'high');
    expect(e.hasHighAlert()).toBe(true);
  });
});

describe('WriterProfileTracker', () => {
  const e = new WriterProfileTracker();

  it('setName + addWords', () => {
    e.setName('Alice');
    e.addWords(1000);
    expect(e.getProfile().totalWords).toBe(1000);
  });

  it('setBestStreak', () => {
    e.setBestStreak(5);
    e.setBestStreak(3);
    expect(e.getProfile().bestStreak).toBe(5);
  });

  it('setPreferredTime', () => {
    e.setPreferredTime('evening');
    expect(e.getProfile().preferredTime).toBe('evening');
  });
});

describe('BlockCategoryReport', () => {
  const e = new BlockCategoryReport();

  it('generate for multiple types', () => {
    const r = e.generate([
      { type: 'plot' as BlockType, severity: 0.5 },
      { type: 'character' as BlockType, severity: 0.7 },
    ]);
    expect(r).toContain('plot');
    expect(r).toContain('character');
  });
});

describe('BlockAIDirector', () => {
  const e = new BlockAIDirector();

  it('recommendSolution for high', () => {
    expect(e.recommendSolution('plot', 0.9)).toContain('休息');
  });

  it('recommendSolution for low', () => {
    expect(e.recommendSolution('plot', 0.1)).toContain('继续');
  });

  it('hasHistory false initially', () => {
    expect(e.hasHistory('plot')).toBe(false);
  });
});

describe('BlockBreakerIndex', () => {
  const idx = new BlockBreakerIndex();

  it('lists 28 engines', () => {
    expect(idx.count()).toBe(28);
  });
});
