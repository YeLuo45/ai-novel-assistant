/**
 * V829 NarrativeSelfRegulationCore Tests — Direction A Iter 1/9 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeSelfRegulationCoreState,
  createRegulationLoop,
  monitorAndAdjust,
  getLoopsByTarget,
  getSelfRegulationReport,
  resetNarrativeSelfRegulationCoreState,
  type NarrativeSelfRegulationCoreState,
} from './NarrativeSelfRegulationCore';

describe('NarrativeSelfRegulationCore', () => {
  let state: NarrativeSelfRegulationCoreState;

  beforeEach(() => { state = createNarrativeSelfRegulationCoreState(); });

  describe('createNarrativeSelfRegulationCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.loops.size).toBe(0);
      expect(state.events.size).toBe(0);
    });
  });

  describe('createRegulationLoop', () => {
    it('should create loop', () => {
      const next = createRegulationLoop(state, 'l1', 'output', 0.5, 0.2);
      expect(next.loops.size).toBe(1);
      expect(next.totalLoops).toBe(1);
    });
  });

  describe('monitorAndAdjust', () => {
    it('should mark optimal when on target', () => {
      let next = createRegulationLoop(state, 'l1', 'output', 0.5);
      next = monitorAndAdjust(next, 'l1', 0.55);
      expect(next.loops.get('l1')?.state).toBe('optimal');
    });

    it('should mark struggling when far from baseline', () => {
      let next = createRegulationLoop(state, 'l1', 'output', 0.5);
      next = monitorAndAdjust(next, 'l1', 0.05);
      expect(['struggling', 'recovering']).toContain(next.loops.get('l1')?.state);
    });

    it('should record event when intervention used', () => {
      let next = createRegulationLoop(state, 'l1', 'output', 0.5, 0.1);
      next = monitorAndAdjust(next, 'l1', 0.9, 'intervention');
      expect(next.totalEvents).toBe(1);
    });
  });

  describe('getLoopsByTarget', () => {
    it('should filter by target', () => {
      let next = createRegulationLoop(state, 'l1', 'output', 0.5);
      next = createRegulationLoop(next, 'l2', 'process', 0.5);
      const outputs = getLoopsByTarget(next, 'output');
      expect(outputs.length).toBe(1);
    });
  });

  describe('getSelfRegulationReport', () => {
    it('should return comprehensive report', () => {
      const report = getSelfRegulationReport(state);
      expect(report.totalLoops).toBe(0);
      expect(typeof report.overallStability).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getSelfRegulationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeSelfRegulationCoreState', () => {
    it('should reset all state', () => {
      let next = createRegulationLoop(state, 'l1', 'output', 0.5);
      next = resetNarrativeSelfRegulationCoreState();
      expect(next.loops.size).toBe(0);
      expect(next.totalLoops).toBe(0);
    });
  });
});