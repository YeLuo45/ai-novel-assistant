/**
 * V1055 PlotPragmaticsEngine Tests — Direction C Iter 15/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPlotPragmaticsEngineState,
  addPlotPragmatic,
  addPragmaticOutcome,
  getPragmaticsByEffect,
  getPragmaticsReport,
  resetPlotPragmaticsEngineState,
  type PlotPragmaticsEngineState,
} from './PlotPragmaticsEngine';

describe('PlotPragmaticsEngine', () => {
  let state: PlotPragmaticsEngineState;

  beforeEach(() => { state = createPlotPragmaticsEngineState(); });

  describe('createPlotPragmaticsEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.pragmatics.size).toBe(0);
      expect(state.outcomes.size).toBe(0);
    });
  });

  describe('addPlotPragmatic', () => {
    it('should add pragmatic', () => {
      const next = addPlotPragmatic(state, 'p1', 'move', 'universal', 'powerful', 'desc', 0.8, 0.9, 1);
      expect(next.pragmatics.size).toBe(1);
      expect(next.totalPragmatics).toBe(1);
    });
  });

  describe('addPragmaticOutcome', () => {
    it('should add outcome', () => {
      let next = addPlotPragmatic(state, 'p1', 'move', 'universal', 'powerful', 'desc', 0.8, 0.9, 1);
      next = addPragmaticOutcome(next, 'o1', ['p1']);
      expect(next.totalOutcomes).toBe(1);
    });
  });

  describe('getPragmaticsByEffect', () => {
    it('should filter by effect', () => {
      let next = addPlotPragmatic(state, 'p1', 'move', 'universal', 'powerful', 'desc', 0.8, 0.9, 1);
      next = addPlotPragmatic(next, 'p2', 'instruct', 'universal', 'powerful', 'desc', 0.8, 0.9, 1);
      const move = getPragmaticsByEffect(next, 'move');
      expect(move.length).toBe(1);
    });
  });

  describe('getPragmaticsReport', () => {
    it('should return comprehensive report', () => {
      const report = getPragmaticsReport(state);
      expect(report.totalPragmatics).toBe(0);
      expect(typeof report.pragmaticsMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getPragmaticsReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetPlotPragmaticsEngineState', () => {
    it('should reset all state', () => {
      let next = addPlotPragmatic(state, 'p1', 'move', 'universal', 'powerful', 'desc', 0.8, 0.9, 1);
      next = resetPlotPragmaticsEngineState();
      expect(next.pragmatics.size).toBe(0);
      expect(next.totalPragmatics).toBe(0);
    });
  });
});