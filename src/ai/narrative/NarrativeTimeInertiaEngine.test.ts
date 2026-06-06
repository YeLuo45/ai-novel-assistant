/**
 * V1217 NarrativeTimeInertiaEngine Tests — Direction G Iter 16/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTimeInertiaEngineState,
  addTimeInertia,
  addTimeInertiaPool,
  getTimeInertiasByType,
  getTimeInertiaReport,
  resetNarrativeTimeInertiaEngineState,
  type NarrativeTimeInertiaEngineState,
} from './NarrativeTimeInertiaEngine';

describe('NarrativeTimeInertiaEngine', () => {
  let state: NarrativeTimeInertiaEngineState;

  beforeEach(() => { state = createNarrativeTimeInertiaEngineState(); });

  describe('createNarrativeTimeInertiaEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.inertias.size).toBe(0);
      expect(state.pools.size).toBe(0);
    });
  });

  describe('addTimeInertia', () => {
    it('should add inertia', () => {
      const next = addTimeInertia(state, 'i1', 'static', 'immovable', 'absolute', 'desc', 0.9, 0.85, 1);
      expect(next.inertias.size).toBe(1);
      expect(next.totalInertias).toBe(1);
    });
  });

  describe('addTimeInertiaPool', () => {
    it('should add pool', () => {
      let next = addTimeInertia(state, 'i1', 'static', 'immovable', 'absolute', 'desc', 0.9, 0.85, 1);
      next = addTimeInertiaPool(next, 'p1', ['i1']);
      expect(next.totalPools).toBe(1);
    });
  });

  describe('getTimeInertiasByType', () => {
    it('should filter by type', () => {
      let next = addTimeInertia(state, 'i1', 'static', 'immovable', 'absolute', 'desc', 0.9, 0.85, 1);
      next = addTimeInertia(next, 'i2', 'kinetic', 'immovable', 'absolute', 'desc', 0.9, 0.85, 1);
      const stat = getTimeInertiasByType(next, 'static');
      expect(stat.length).toBe(1);
    });
  });

  describe('getTimeInertiaReport', () => {
    it('should return comprehensive report', () => {
      const report = getTimeInertiaReport(state);
      expect(report.totalInertias).toBe(0);
      expect(typeof report.timeInertiaMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTimeInertiaReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTimeInertiaEngineState', () => {
    it('should reset all state', () => {
      let next = addTimeInertia(state, 'i1', 'static', 'immovable', 'absolute', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeTimeInertiaEngineState();
      expect(next.inertias.size).toBe(0);
      expect(next.totalInertias).toBe(0);
    });
  });
});