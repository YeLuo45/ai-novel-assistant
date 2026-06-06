/**
 * V1063 PlotPhenomenologyEngine Tests — Direction C Iter 19/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPlotPhenomenologyEngineState,
  addPlotPhenomenon,
  addPhenomenologicalSpan,
  getPhenomenaByAspect,
  getPlotPhenomenologyReport,
  resetPlotPhenomenologyEngineState,
  type PlotPhenomenologyEngineState,
} from './PlotPhenomenologyEngine';

describe('PlotPhenomenologyEngine', () => {
  let state: PlotPhenomenologyEngineState;

  beforeEach(() => { state = createPlotPhenomenologyEngineState(); });

  describe('createPlotPhenomenologyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.phenomena.size).toBe(0);
      expect(state.spans.size).toBe(0);
    });
  });

  describe('addPlotPhenomenon', () => {
    it('should add phenomenon', () => {
      const next = addPlotPhenomenon(state, 'p1', 'perception', 'intense', 'vivid', 'desc', 0.8, 0.9, 1);
      expect(next.phenomena.size).toBe(1);
      expect(next.totalPhenomena).toBe(1);
    });
  });

  describe('addPhenomenologicalSpan', () => {
    it('should add span', () => {
      let next = addPlotPhenomenon(state, 'p1', 'perception', 'intense', 'vivid', 'desc', 0.8, 0.9, 1);
      next = addPhenomenologicalSpan(next, 's1', ['p1']);
      expect(next.totalSpans).toBe(1);
    });
  });

  describe('getPhenomenaByAspect', () => {
    it('should filter by aspect', () => {
      let next = addPlotPhenomenon(state, 'p1', 'perception', 'intense', 'vivid', 'desc', 0.8, 0.9, 1);
      next = addPlotPhenomenon(next, 'p2', 'emotion', 'intense', 'vivid', 'desc', 0.8, 0.9, 1);
      const perc = getPhenomenaByAspect(next, 'perception');
      expect(perc.length).toBe(1);
    });
  });

  describe('getPlotPhenomenologyReport', () => {
    it('should return comprehensive report', () => {
      const report = getPlotPhenomenologyReport(state);
      expect(report.totalPhenomena).toBe(0);
      expect(typeof report.phenomenologyMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getPlotPhenomenologyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetPlotPhenomenologyEngineState', () => {
    it('should reset all state', () => {
      let next = addPlotPhenomenon(state, 'p1', 'perception', 'intense', 'vivid', 'desc', 0.8, 0.9, 1);
      next = resetPlotPhenomenologyEngineState();
      expect(next.phenomena.size).toBe(0);
      expect(next.totalPhenomena).toBe(0);
    });
  });
});