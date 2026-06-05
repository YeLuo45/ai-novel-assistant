/**
 * V757 NarrativeCraftingEngine Tests — Direction B Iter 1/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCraftingEngineState,
  recordCraftPractice,
  addCraftAttempt,
  setCraftStatus,
  getPracticesByTechnique,
  getTechniqueMetrics,
  getCraftingReport,
  resetNarrativeCraftingEngineState,
  type NarrativeCraftingEngineState,
} from './NarrativeCraftingEngine';

describe('NarrativeCraftingEngine', () => {
  let state: NarrativeCraftingEngineState;

  beforeEach(() => { state = createNarrativeCraftingEngineState(); });

  describe('createNarrativeCraftingEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.practices.size).toBe(0);
      expect(state.totalPractices).toBe(0);
    });
  });

  describe('recordCraftPractice', () => {
    it('should record practice', () => {
      const next = recordCraftPractice(state, 'p1', 'foreshadowing', 'proficient', true, 'good example');
      expect(next.practices.size).toBe(1);
      expect(next.totalPractices).toBe(1);
    });

    it('should update technique metrics', () => {
      const next = recordCraftPractice(state, 'p1', 'foreshadowing', 'proficient', true);
      expect(next.techniqueMetrics.get('foreshadowing')?.attempts).toBe(1);
      expect(next.techniqueMetrics.get('foreshadowing')?.successes).toBe(1);
    });
  });

  describe('addCraftAttempt', () => {
    it('should add attempt', () => {
      let next = recordCraftPractice(state, 'p1', 'foreshadowing', 'proficient', true);
      next = addCraftAttempt(next, 'p1', true);
      expect(next.practices.get('p1')?.attempts).toBe(2);
    });

    it('should mark as mastered on full success', () => {
      let next = recordCraftPractice(state, 'p1', 'foreshadowing', 'proficient', true);
      next = addCraftAttempt(next, 'p1', true);
      expect(next.practices.get('p1')?.status).toBe('mastered');
    });

    it('should return state for unknown practice', () => {
      const next = addCraftAttempt(state, 'unknown', true);
      expect(next.totalAttempts).toBe(0);
    });
  });

  describe('setCraftStatus', () => {
    it('should set status', () => {
      let next = recordCraftPractice(state, 'p1', 'foreshadowing');
      next = setCraftStatus(next, 'p1', 'refining');
      expect(next.practices.get('p1')?.status).toBe('refining');
    });
  });

  describe('getPracticesByTechnique', () => {
    it('should filter by technique', () => {
      let next = recordCraftPractice(state, 'p1', 'foreshadowing');
      next = recordCraftPractice(next, 'p2', 'subtext');
      const foreshadows = getPracticesByTechnique(next, 'foreshadowing');
      expect(foreshadows.length).toBe(1);
    });
  });

  describe('getTechniqueMetrics', () => {
    it('should return metrics for technique', () => {
      let next = recordCraftPractice(state, 'p1', 'foreshadowing', 'proficient', true);
      const metrics = getTechniqueMetrics(next, 'foreshadowing');
      expect(metrics?.attempts).toBe(1);
    });

    it('should return null for unknown technique', () => {
      const metrics = getTechniqueMetrics(state, 'foreshadowing');
      expect(metrics).toBeNull();
    });
  });

  describe('getCraftingReport', () => {
    it('should return comprehensive report', () => {
      const report = getCraftingReport(state);
      expect(report.totalPractices).toBe(0);
      expect(typeof report.overallSuccessRate).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCraftingReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeCraftingEngineState', () => {
    it('should reset all state', () => {
      let next = recordCraftPractice(state, 'p1', 'foreshadowing');
      next = resetNarrativeCraftingEngineState();
      expect(next.practices.size).toBe(0);
      expect(next.totalPractices).toBe(0);
    });
  });
});