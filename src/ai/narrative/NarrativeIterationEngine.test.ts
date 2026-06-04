/**
 * V703 NarrativeIterationEngine Tests — Direction D Iter 1/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeIterationState,
  createIteration,
  addChange,
  updateIterationStatus,
  getIterationByVersion,
  getLatestIteration,
  getIterationsByStatus,
  getIterationHistory,
  getIterationReport,
  resetNarrativeIterationState,
  type NarrativeIterationState,
} from './NarrativeIterationEngine';

describe('NarrativeIterationEngine', () => {
  let state: NarrativeIterationState;

  beforeEach(() => { state = createNarrativeIterationState(); });

  describe('createNarrativeIterationState', () => {
    it('should initialize with defaults', () => {
      expect(state.iterations.size).toBe(0);
      expect(state.currentVersion).toBe(0);
    });

    it('should start at version 0', () => {
      expect(state.currentVersion).toBe(0);
    });
  });

  describe('createIteration', () => {
    it('should create iteration', () => {
      const next = createIteration(state, 'i1', 'Initial draft', 'draft');
      expect(next.iterations.size).toBe(1);
      expect(next.currentVersion).toBe(1);
    });

    it('should increment version', () => {
      let next = createIteration(state, 'i1', 'Draft', 'draft');
      next = createIteration(next, 'i2', 'Revision', 'revise');
      expect(next.currentVersion).toBe(2);
    });

    it('should set initial status to in_progress', () => {
      const next = createIteration(state, 'i1', 'Draft', 'draft');
      expect(next.iterations.get('i1')?.status).toBe('in_progress');
    });
  });

  describe('addChange', () => {
    it('should add change', () => {
      let next = createIteration(state, 'i1', 'Draft', 'draft');
      next = addChange(next, 'i1', 'c1', 'addition', 'Added scene', 100, 0.5, 'Better pacing');
      expect(next.iterations.get('i1')?.changes.length).toBe(1);
      expect(next.totalChanges).toBe(1);
    });

    it('should return state for unknown iteration', () => {
      const next = addChange(state, 'unknown', 'c1', 'addition', 'desc', 100, 0.5, 'reason');
      expect(next.totalChanges).toBe(0);
    });
  });

  describe('updateIterationStatus', () => {
    it('should update status', () => {
      let next = createIteration(state, 'i1', 'Draft', 'draft');
      next = updateIterationStatus(next, 'i1', 'completed', 0.9, 'Great work');
      expect(next.iterations.get('i1')?.status).toBe('completed');
      expect(next.iterations.get('i1')?.qualityScore).toBe(0.9);
      expect(next.completedIterations).toBe(1);
    });

    it('should clamp quality score', () => {
      let next = createIteration(state, 'i1', 'Draft', 'draft');
      next = updateIterationStatus(next, 'i1', 'completed', 1.5);
      expect(next.iterations.get('i1')?.qualityScore).toBe(1);
    });
  });

  describe('getIterationByVersion', () => {
    it('should return iteration', () => {
      let next = createIteration(state, 'i1', 'Draft', 'draft');
      const iteration = getIterationByVersion(next, 1);
      expect(iteration?.iterationId).toBe('i1');
    });

    it('should return null for unknown version', () => {
      const iteration = getIterationByVersion(state, 99);
      expect(iteration).toBeNull();
    });
  });

  describe('getLatestIteration', () => {
    it('should return null for empty state', () => {
      const latest = getLatestIteration(state);
      expect(latest).toBeNull();
    });

    it('should return highest version iteration', () => {
      let next = createIteration(state, 'i1', 'Draft', 'draft');
      next = createIteration(next, 'i2', 'Revision', 'revise');
      const latest = getLatestIteration(next);
      expect(latest?.iterationId).toBe('i2');
    });
  });

  describe('getIterationsByStatus', () => {
    it('should filter by status', () => {
      let next = createIteration(state, 'i1', 'Draft', 'draft');
      next = createIteration(next, 'i2', 'Revision', 'revise');
      next = updateIterationStatus(next, 'i1', 'completed', 0.9);
      const completed = getIterationsByStatus(next, 'completed');
      expect(completed.length).toBe(1);
    });
  });

  describe('getIterationHistory', () => {
    it('should return sorted history', () => {
      let next = createIteration(state, 'i1', 'Draft', 'draft');
      next = createIteration(next, 'i2', 'Revision', 'revise');
      const history = getIterationHistory(next);
      expect(history[0]?.version).toBe(1);
      expect(history[1]?.version).toBe(2);
    });
  });

  describe('getIterationReport', () => {
    it('should return comprehensive report', () => {
      const report = getIterationReport(state);
      expect(report.totalIterations).toBe(0);
      expect(typeof report.averageQuality).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getIterationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeIterationState', () => {
    it('should reset all state', () => {
      let next = createIteration(state, 'i1', 'Draft', 'draft');
      next = resetNarrativeIterationState();
      expect(next.iterations.size).toBe(0);
      expect(next.currentVersion).toBe(0);
    });
  });
});