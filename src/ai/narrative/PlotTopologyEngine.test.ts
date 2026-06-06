/**
 * V891 PlotTopologyEngine Tests — Direction C Iter 8/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPlotTopologyEngineState,
  addPlotNode,
  connectPlotNodes,
  createPlotPath,
  getPlotTopologyReport,
  resetPlotTopologyEngineState,
  type PlotTopologyEngineState,
} from './PlotTopologyEngine';

describe('PlotTopologyEngine', () => {
  let state: PlotTopologyEngineState;

  beforeEach(() => { state = createPlotTopologyEngineState(); });

  describe('createPlotTopologyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.nodes.size).toBe(0);
      expect(state.paths.size).toBe(0);
    });
  });

  describe('addPlotNode', () => {
    it('should add node', () => {
      const next = addPlotNode(state, 'n1', 'Inciting incident', 'origin', 1);
      expect(next.nodes.size).toBe(1);
      expect(next.totalNodes).toBe(1);
    });
  });

  describe('connectPlotNodes', () => {
    it('should connect', () => {
      let next = addPlotNode(state, 'n1', 'A', 'origin', 1);
      next = addPlotNode(next, 'n2', 'B', 'junction', 5);
      next = connectPlotNodes(next, 'n1', 'n2');
      expect(next.nodes.get('n1')?.degree).toBe(1);
      expect(next.nodes.get('n2')?.degree).toBe(1);
    });
  });

  describe('createPlotPath', () => {
    it('should create path', () => {
      let next = addPlotNode(state, 'n1', 'A', 'origin', 1);
      next = addPlotNode(next, 'n2', 'B', 'junction', 5);
      next = createPlotPath(next, 'p1', 'main', ['n1', 'n2']);
      expect(next.totalPaths).toBe(1);
    });
  });

  describe('getPlotTopologyReport', () => {
    it('should return comprehensive report', () => {
      const report = getPlotTopologyReport(state);
      expect(report.totalNodes).toBe(0);
      expect(typeof report.complexity).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getPlotTopologyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetPlotTopologyEngineState', () => {
    it('should reset all state', () => {
      let next = addPlotNode(state, 'n1', 'A', 'origin', 1);
      next = resetPlotTopologyEngineState();
      expect(next.nodes.size).toBe(0);
      expect(next.totalNodes).toBe(0);
    });
  });
});