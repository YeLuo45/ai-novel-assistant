/**
 * V969 NarrativeSelfRegulationEngine Tests — Direction A Iter 2/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeSelfRegulationEngineState,
  addSelfRegulationLoop,
  addSelfRegulationController,
  updateSelfRegulationLoop,
  getLoopsByTargetSR,
  getSelfRegulationReport,
  resetNarrativeSelfRegulationEngineState,
  type NarrativeSelfRegulationEngineState,
} from './NarrativeSelfRegulationEngine';

describe('NarrativeSelfRegulationEngine', () => {
  let state: NarrativeSelfRegulationEngineState;

  beforeEach(() => { state = createNarrativeSelfRegulationEngineState(); });

  describe('createNarrativeSelfRegulationEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.loops.size).toBe(0);
      expect(state.controllers.size).toBe(0);
    });
  });

  describe('addSelfRegulationLoop', () => {
    it('should add loop', () => {
      const next = addSelfRegulationLoop(state, 'l1', 'homeostasis', 'quality', 0.8, 0.7, 1);
      expect(next.loops.size).toBe(1);
      expect(next.totalLoops).toBe(1);
    });
  });

  describe('addSelfRegulationController', () => {
    it('should add controller', () => {
      let next = addSelfRegulationLoop(state, 'l1', 'homeostasis', 'quality', 0.8, 0.7, 1);
      next = addSelfRegulationController(next, 'c1', 'l1', 0.5, 'tune', 0.7);
      expect(next.totalControllers).toBe(1);
    });
  });

  describe('updateSelfRegulationLoop', () => {
    it('should update', () => {
      let next = addSelfRegulationLoop(state, 'l1', 'homeostasis', 'quality', 0.8, 0.7, 1);
      next = updateSelfRegulationLoop(next, 'l1', 0.82);
      expect(next.loops.get('l1')?.current).toBe(0.82);
      expect(next.loops.get('l1')?.status).toBe('stable');
    });
  });

  describe('getLoopsByTargetSR', () => {
    it('should filter by target', () => {
      let next = addSelfRegulationLoop(state, 'l1', 'homeostasis', 'quality', 0.8, 0.7, 1);
      next = addSelfRegulationLoop(next, 'l2', 'homeostasis', 'pacing', 0.5, 0.5, 1);
      const quality = getLoopsByTargetSR(next, 'quality');
      expect(quality.length).toBe(1);
    });
  });

  describe('getSelfRegulationReport', () => {
    it('should return comprehensive report', () => {
      const report = getSelfRegulationReport(state);
      expect(report.totalLoops).toBe(0);
      expect(typeof report.selfRegulationMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getSelfRegulationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeSelfRegulationEngineState', () => {
    it('should reset all state', () => {
      let next = addSelfRegulationLoop(state, 'l1', 'homeostasis', 'quality', 0.8, 0.7, 1);
      next = resetNarrativeSelfRegulationEngineState();
      expect(next.loops.size).toBe(0);
      expect(next.totalLoops).toBe(0);
    });
  });
});