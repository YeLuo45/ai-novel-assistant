/**
 * V1031 PlotRhetoricEngine Tests — Direction C Iter 3/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPlotRhetoricEngineState,
  addPlotRhetoric,
  addRhetoricLayer,
  getRhetoricsByDevice,
  getRhetoricReport,
  resetPlotRhetoricEngineState,
  type PlotRhetoricEngineState,
} from './PlotRhetoricEngine';

describe('PlotRhetoricEngine', () => {
  let state: PlotRhetoricEngineState;

  beforeEach(() => { state = createPlotRhetoricEngineState(); });

  describe('createPlotRhetoricEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.rhetorics.size).toBe(0);
      expect(state.layers.size).toBe(0);
    });
  });

  describe('addPlotRhetoric', () => {
    it('should add rhetoric', () => {
      const next = addPlotRhetoric(state, 'r1', 'metaphor', 'strong', 'connect', 'desc', 0.8, 0.7, 1);
      expect(next.rhetorics.size).toBe(1);
      expect(next.totalRhetorics).toBe(1);
    });
  });

  describe('addRhetoricLayer', () => {
    it('should add layer', () => {
      let next = addPlotRhetoric(state, 'r1', 'metaphor', 'strong', 'connect', 'desc', 0.8, 0.7, 1);
      next = addRhetoricLayer(next, 'l1', ['r1']);
      expect(next.totalLayers).toBe(1);
    });
  });

  describe('getRhetoricsByDevice', () => {
    it('should filter by device', () => {
      let next = addPlotRhetoric(state, 'r1', 'metaphor', 'strong', 'connect', 'desc', 0.8, 0.7, 1);
      next = addPlotRhetoric(next, 'r2', 'irony', 'strong', 'connect', 'desc', 0.8, 0.7, 1);
      const metaphor = getRhetoricsByDevice(next, 'metaphor');
      expect(metaphor.length).toBe(1);
    });
  });

  describe('getRhetoricReport', () => {
    it('should return comprehensive report', () => {
      const report = getRhetoricReport(state);
      expect(report.totalRhetorics).toBe(0);
      expect(typeof report.rhetoricMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getRhetoricReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetPlotRhetoricEngineState', () => {
    it('should reset all state', () => {
      let next = addPlotRhetoric(state, 'r1', 'metaphor', 'strong', 'connect', 'desc', 0.8, 0.7, 1);
      next = resetPlotRhetoricEngineState();
      expect(next.rhetorics.size).toBe(0);
      expect(next.totalRhetorics).toBe(0);
    });
  });
});