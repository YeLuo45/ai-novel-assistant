/**
 * V1039 PlotTeleologyEngine Tests — Direction C Iter 7/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPlotTeleologyEngineState,
  addPlotTeleology,
  addTeleologicalArc,
  getTeleologiesByCause,
  getTeleologyReport,
  resetPlotTeleologyEngineState,
  type PlotTeleologyEngineState,
} from './PlotTeleologyEngine';

describe('PlotTeleologyEngine', () => {
  let state: PlotTeleologyEngineState;

  beforeEach(() => { state = createPlotTeleologyEngineState(); });

  describe('createPlotTeleologyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.teleologies.size).toBe(0);
      expect(state.arcs.size).toBe(0);
    });
  });

  describe('addPlotTeleology', () => {
    it('should add teleology', () => {
      const next = addPlotTeleology(state, 't1', 'final', 'transformation', 'macro', 'desc', 0.8, 0.9, 1);
      expect(next.teleologies.size).toBe(1);
      expect(next.totalTeleologies).toBe(1);
    });
  });

  describe('addTeleologicalArc', () => {
    it('should add arc', () => {
      let next = addPlotTeleology(state, 't1', 'final', 'transformation', 'macro', 'desc', 0.8, 0.9, 1);
      next = addTeleologicalArc(next, 'a1', ['t1']);
      expect(next.totalArcs).toBe(1);
    });
  });

  describe('getTeleologiesByCause', () => {
    it('should filter by cause', () => {
      let next = addPlotTeleology(state, 't1', 'final', 'transformation', 'macro', 'desc', 0.8, 0.9, 1);
      next = addPlotTeleology(next, 't2', 'efficient', 'transformation', 'macro', 'desc', 0.8, 0.9, 1);
      const final = getTeleologiesByCause(next, 'final');
      expect(final.length).toBe(1);
    });
  });

  describe('getTeleologyReport', () => {
    it('should return comprehensive report', () => {
      const report = getTeleologyReport(state);
      expect(report.totalTeleologies).toBe(0);
      expect(typeof report.teleologyMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTeleologyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetPlotTeleologyEngineState', () => {
    it('should reset all state', () => {
      let next = addPlotTeleology(state, 't1', 'final', 'transformation', 'macro', 'desc', 0.8, 0.9, 1);
      next = resetPlotTeleologyEngineState();
      expect(next.teleologies.size).toBe(0);
      expect(next.totalTeleologies).toBe(0);
    });
  });
});