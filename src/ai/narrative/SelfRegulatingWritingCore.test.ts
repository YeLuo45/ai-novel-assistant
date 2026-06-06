/**
 * V929 SelfRegulatingWritingCore Tests — Direction D Iter 12/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSelfRegulatingWritingCoreState,
  addRegulationLoop,
  addRegulationController,
  updateLoopCurrent,
  getLoopsByTarget,
  getRegulationReport,
  resetSelfRegulatingWritingCoreState,
  type SelfRegulatingWritingCoreState,
} from './SelfRegulatingWritingCore';

describe('SelfRegulatingWritingCore', () => {
  let state: SelfRegulatingWritingCoreState;

  beforeEach(() => { state = createSelfRegulatingWritingCoreState(); });

  describe('createSelfRegulatingWritingCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.loops.size).toBe(0);
      expect(state.controllers.size).toBe(0);
    });
  });

  describe('addRegulationLoop', () => {
    it('should add loop', () => {
      const next = addRegulationLoop(state, 'l1', 'homeostasis', 'quality', 0.8, 0.7, 1);
      expect(next.loops.size).toBe(1);
      expect(next.totalLoops).toBe(1);
    });
  });

  describe('addRegulationController', () => {
    it('should add controller', () => {
      let next = addRegulationLoop(state, 'l1', 'homeostasis', 'quality', 0.8, 0.7, 1);
      next = addRegulationController(next, 'c1', 'l1', 0.5, 'tune', 0.7);
      expect(next.totalControllers).toBe(1);
    });
  });

  describe('updateLoopCurrent', () => {
    it('should update', () => {
      let next = addRegulationLoop(state, 'l1', 'homeostasis', 'quality', 0.8, 0.7, 1);
      next = updateLoopCurrent(next, 'l1', 0.82);
      expect(next.loops.get('l1')?.current).toBe(0.82);
      expect(next.loops.get('l1')?.status).toBe('stable');
    });
  });

  describe('getLoopsByTarget', () => {
    it('should filter by target', () => {
      let next = addRegulationLoop(state, 'l1', 'homeostasis', 'quality', 0.8, 0.7, 1);
      next = addRegulationLoop(next, 'l2', 'homeostasis', 'pacing', 0.5, 0.5, 1);
      const quality = getLoopsByTarget(next, 'quality');
      expect(quality.length).toBe(1);
    });
  });

  describe('getRegulationReport', () => {
    it('should return comprehensive report', () => {
      const report = getRegulationReport(state);
      expect(report.totalLoops).toBe(0);
      expect(typeof report.selfRegulationMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getRegulationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetSelfRegulatingWritingCoreState', () => {
    it('should reset all state', () => {
      let next = addRegulationLoop(state, 'l1', 'homeostasis', 'quality', 0.8, 0.7, 1);
      next = resetSelfRegulatingWritingCoreState();
      expect(next.loops.size).toBe(0);
      expect(next.totalLoops).toBe(0);
    });
  });
});