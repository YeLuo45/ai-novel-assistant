/**
 * V781 PlotCausalityEngine Tests — Direction C Iter 4/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPlotCausalityEngineState,
  addCausalEvent,
  createCausalChain,
  completeCausalChain,
  getCausalChainsByType,
  getEventsByType,
  getCausalityReport,
  resetPlotCausalityEngineState,
  type PlotCausalityEngineState,
} from './PlotCausalityEngine';

describe('PlotCausalityEngine', () => {
  let state: PlotCausalityEngineState;

  beforeEach(() => { state = createPlotCausalityEngineState(); });

  describe('createPlotCausalityEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.events.size).toBe(0);
      expect(state.chains.size).toBe(0);
    });
  });

  describe('addCausalEvent', () => {
    it('should add event', () => {
      const next = addCausalEvent(state, 'e1', 'Hero saves village', 'action', 5, 'major');
      expect(next.events.size).toBe(1);
      expect(next.totalEvents).toBe(1);
    });

    it('should update cause event effects', () => {
      let next = addCausalEvent(state, 'e1', 'Cause', 'action', 1, 'minor');
      next = addCausalEvent(next, 'e2', 'Effect', 'event', 5, 'major', ['e1']);
      expect(next.events.get('e1')?.effectEventIds.length).toBe(1);
    });
  });

  describe('createCausalChain', () => {
    it('should create chain', () => {
      let next = addCausalEvent(state, 'e1', 'desc', 'action', 1, 'major');
      next = addCausalEvent(next, 'e2', 'desc', 'event', 5, 'major', ['e1']);
      next = createCausalChain(next, 'c1', ['e1', 'e2'], 'linear');
      expect(next.chains.size).toBe(1);
    });
  });

  describe('completeCausalChain', () => {
    it('should complete chain', () => {
      let next = addCausalEvent(state, 'e1', 'desc', 'action', 1, 'major');
      next = createCausalChain(next, 'c1', ['e1'], 'linear');
      next = completeCausalChain(next, 'c1');
      expect(next.chains.get('c1')?.completed).toBe(true);
    });
  });

  describe('getCausalChainsByType', () => {
    it('should filter by type', () => {
      let next = addCausalEvent(state, 'e1', 'desc', 'action', 1, 'major');
      next = createCausalChain(next, 'c1', ['e1'], 'linear');
      next = createCausalChain(next, 'c2', ['e1'], 'branching');
      const linear = getCausalChainsByType(next, 'linear');
      expect(linear.length).toBe(1);
    });
  });

  describe('getEventsByType', () => {
    it('should filter by type', () => {
      let next = addCausalEvent(state, 'e1', 'desc', 'action', 1, 'major');
      next = addCausalEvent(next, 'e2', 'desc', 'coincidence', 5, 'moderate');
      const actions = getEventsByType(next, 'action');
      expect(actions.length).toBe(1);
    });
  });

  describe('getCausalityReport', () => {
    it('should return comprehensive report', () => {
      const report = getCausalityReport(state);
      expect(report.totalEvents).toBe(0);
      expect(typeof report.depthScore).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCausalityReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetPlotCausalityEngineState', () => {
    it('should reset all state', () => {
      let next = addCausalEvent(state, 'e1', 'desc', 'action', 1, 'major');
      next = resetPlotCausalityEngineState();
      expect(next.events.size).toBe(0);
      expect(next.totalEvents).toBe(0);
    });
  });
});