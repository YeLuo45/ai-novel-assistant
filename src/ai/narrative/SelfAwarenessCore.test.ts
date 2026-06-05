/**
 * V843 SelfAwarenessCore Tests — Direction A Iter 8/9 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSelfAwarenessCoreState,
  createSelfModel,
  updateStability,
  recordSelfObservation,
  getModelsByAspect,
  getSelfAwarenessReport,
  resetSelfAwarenessCoreState,
  type SelfAwarenessCoreState,
} from './SelfAwarenessCore';

describe('SelfAwarenessCore', () => {
  let state: SelfAwarenessCoreState;

  beforeEach(() => { state = createSelfAwarenessCoreState(); });

  describe('createSelfAwarenessCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.models.size).toBe(0);
      expect(state.observations.size).toBe(0);
    });
  });

  describe('createSelfModel', () => {
    it('should create model', () => {
      const next = createSelfModel(state, 'm1', 'capability', 'Can write prose', 'aware', 0.7);
      expect(next.models.size).toBe(1);
      expect(next.totalModels).toBe(1);
    });

    it('should clamp accuracy', () => {
      const next = createSelfModel(state, 'm1', 'capability', 'desc', 'aware', 1.5);
      expect(next.models.get('m1')?.accuracy).toBe(1);
    });
  });

  describe('updateStability', () => {
    it('should update stability', () => {
      let next = createSelfModel(state, 'm1', 'capability', 'desc');
      next = updateStability(next, 'm1', 0.9);
      expect(next.models.get('m1')?.stability).toBe(0.9);
      expect(next.models.get('m1')?.state).toBe('stable');
    });
  });

  describe('recordSelfObservation', () => {
    it('should record', () => {
      const next = recordSelfObservation(state, 'o1', 'm1', 'obs', 'insight', 0.8);
      expect(next.totalObservations).toBe(1);
    });
  });

  describe('getModelsByAspect', () => {
    it('should filter by aspect', () => {
      let next = createSelfModel(state, 'm1', 'capability', 'desc');
      next = createSelfModel(next, 'm2', 'limitation', 'desc');
      const capabilities = getModelsByAspect(next, 'capability');
      expect(capabilities.length).toBe(1);
    });
  });

  describe('getSelfAwarenessReport', () => {
    it('should return comprehensive report', () => {
      const report = getSelfAwarenessReport(state);
      expect(report.totalModels).toBe(0);
      expect(typeof report.overallSelfAwareness).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getSelfAwarenessReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetSelfAwarenessCoreState', () => {
    it('should reset all state', () => {
      let next = createSelfModel(state, 'm1', 'capability', 'desc');
      next = resetSelfAwarenessCoreState();
      expect(next.models.size).toBe(0);
      expect(next.totalModels).toBe(0);
    });
  });
});