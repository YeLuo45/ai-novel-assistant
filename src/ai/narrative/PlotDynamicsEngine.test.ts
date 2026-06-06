/**
 * V883 PlotDynamicsEngine Tests — Direction C Iter 4/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPlotDynamicsEngineState,
  addPlotForce,
  addPlotEvent,
  getForcesByType,
  getPlotDynamicsReport,
  resetPlotDynamicsEngineState,
  type PlotDynamicsEngineState,
} from './PlotDynamicsEngine';

describe('PlotDynamicsEngine', () => {
  let state: PlotDynamicsEngineState;

  beforeEach(() => { state = createPlotDynamicsEngineState(); });

  describe('createPlotDynamicsEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.forces.size).toBe(0);
      expect(state.events.size).toBe(0);
    });
  });

  describe('addPlotForce', () => {
    it('should add force', () => {
      const next = addPlotForce(state, 'f1', 'c1', 'desire', 'positive', 'goal', 1, 0.7);
      expect(next.forces.size).toBe(1);
      expect(next.totalForces).toBe(1);
    });
  });

  describe('addPlotEvent', () => {
    it('should add event', () => {
      const next = addPlotEvent(state, 'e1', 'Battle', ['f1'], 'advancement', 'fast', 5, 0.8);
      expect(next.totalEvents).toBe(1);
    });
  });

  describe('getForcesByType', () => {
    it('should filter by type', () => {
      let next = addPlotForce(state, 'f1', 'c1', 'desire', 'positive', 'goal', 1);
      next = addPlotForce(next, 'f2', 'c1', 'fear', 'negative', 'death', 1);
      const desires = getForcesByType(next, 'desire');
      expect(desires.length).toBe(1);
    });
  });

  describe('getPlotDynamicsReport', () => {
    it('should return comprehensive report', () => {
      const report = getPlotDynamicsReport(state);
      expect(report.totalForces).toBe(0);
      expect(typeof report.plotMomentum).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getPlotDynamicsReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetPlotDynamicsEngineState', () => {
    it('should reset all state', () => {
      let next = addPlotForce(state, 'f1', 'c1', 'desire', 'positive', 'goal', 1);
      next = resetPlotDynamicsEngineState();
      expect(next.forces.size).toBe(0);
      expect(next.totalForces).toBe(0);
    });
  });
});