/**
 * V1195 NarrativeTimeVortexEngine Tests — Direction G Iter 5/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTimeVortexEngineState,
  addTimeVortex,
  addTimeVortexWhirl,
  getTimeVortexesByType,
  getTimeVortexReport,
  resetNarrativeTimeVortexEngineState,
  type NarrativeTimeVortexEngineState,
} from './NarrativeTimeVortexEngine';

describe('NarrativeTimeVortexEngine', () => {
  let state: NarrativeTimeVortexEngineState;

  beforeEach(() => { state = createNarrativeTimeVortexEngineState(); });

  describe('createNarrativeTimeVortexEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.vortexes.size).toBe(0);
      expect(state.whirls.size).toBe(0);
    });
  });

  describe('addTimeVortex', () => {
    it('should add vortex', () => {
      const next = addTimeVortex(state, 'v1', 'convergence', 'violent', 'pulling', 'desc', 0.9, 0.85, 1);
      expect(next.vortexes.size).toBe(1);
      expect(next.totalVortexes).toBe(1);
    });
  });

  describe('addTimeVortexWhirl', () => {
    it('should add whirl', () => {
      let next = addTimeVortex(state, 'v1', 'convergence', 'violent', 'pulling', 'desc', 0.9, 0.85, 1);
      next = addTimeVortexWhirl(next, 'w1', ['v1']);
      expect(next.totalWhirls).toBe(1);
    });
  });

  describe('getTimeVortexesByType', () => {
    it('should filter by type', () => {
      let next = addTimeVortex(state, 'v1', 'convergence', 'violent', 'pulling', 'desc', 0.9, 0.85, 1);
      next = addTimeVortex(next, 'v2', 'spiral', 'violent', 'pulling', 'desc', 0.9, 0.85, 1);
      const conv = getTimeVortexesByType(next, 'convergence');
      expect(conv.length).toBe(1);
    });
  });

  describe('getTimeVortexReport', () => {
    it('should return comprehensive report', () => {
      const report = getTimeVortexReport(state);
      expect(report.totalVortexes).toBe(0);
      expect(typeof report.timeVortexMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTimeVortexReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTimeVortexEngineState', () => {
    it('should reset all state', () => {
      let next = addTimeVortex(state, 'v1', 'convergence', 'violent', 'pulling', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeTimeVortexEngineState();
      expect(next.vortexes.size).toBe(0);
      expect(next.totalVortexes).toBe(0);
    });
  });
});