/**
 * V869 PlotStructureEngine Tests — Direction B Iter 12/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPlotStructureEngineState,
  addStructureBeat,
  createStructureNode,
  updateStructureEffectiveness,
  getBeatsByType,
  getPlotStructureReport,
  resetPlotStructureEngineState,
  type PlotStructureEngineState,
} from './PlotStructureEngine';

describe('PlotStructureEngine', () => {
  let state: PlotStructureEngineState;

  beforeEach(() => { state = createPlotStructureEngineState(); });

  describe('createPlotStructureEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.beats.size).toBe(0);
      expect(state.nodes.size).toBe(0);
    });
  });

  describe('addStructureBeat', () => {
    it('should add beat', () => {
      const next = addStructureBeat(state, 'b1', 'three_act', 'exposition', 'Setup', 'description', 1, true);
      expect(next.beats.size).toBe(1);
      expect(next.totalBeats).toBe(1);
    });
  });

  describe('createStructureNode', () => {
    it('should create node', () => {
      let next = addStructureBeat(state, 'b1', 'three_act', 'exposition', 'Setup', 'desc', 1);
      next = createStructureNode(next, 'n1', 'three_act', ['b1'], 0.7, 0.6);
      expect(next.totalStructures).toBe(1);
    });
  });

  describe('updateStructureEffectiveness', () => {
    it('should update', () => {
      let next = addStructureBeat(state, 'b1', 'three_act', 'exposition', 'Setup', 'desc', 1);
      next = createStructureNode(next, 'n1', 'three_act', ['b1']);
      next = updateStructureEffectiveness(next, 'n1', 0.9);
      expect(next.nodes.get('n1')?.effectiveness).toBe(0.9);
    });
  });

  describe('getBeatsByType', () => {
    it('should filter by type', () => {
      let next = addStructureBeat(state, 'b1', 'three_act', 'exposition', 'Setup', 'desc', 1);
      next = addStructureBeat(next, 'b2', 'hero_journey', 'rising_action', 'Threshold', 'desc', 5);
      const threeAct = getBeatsByType(next, 'three_act');
      expect(threeAct.length).toBe(1);
    });
  });

  describe('getPlotStructureReport', () => {
    it('should return comprehensive report', () => {
      const report = getPlotStructureReport(state);
      expect(report.totalBeats).toBe(0);
      expect(typeof report.structureMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getPlotStructureReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetPlotStructureEngineState', () => {
    it('should reset all state', () => {
      let next = addStructureBeat(state, 'b1', 'three_act', 'exposition', 'Setup', 'desc', 1);
      next = resetPlotStructureEngineState();
      expect(next.beats.size).toBe(0);
      expect(next.totalBeats).toBe(0);
    });
  });
});