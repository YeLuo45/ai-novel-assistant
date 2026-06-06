/**
 * V899 PlotMechanicsEngine Tests — Direction C Iter 12/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPlotMechanicsEngineState,
  addPlotMechanism,
  activateMechanism,
  recordMechanismInteraction,
  getMechanismsByType,
  getPlotMechanicsReport,
  resetPlotMechanicsEngineState,
  type PlotMechanicsEngineState,
} from './PlotMechanicsEngine';

describe('PlotMechanicsEngine', () => {
  let state: PlotMechanicsEngineState;

  beforeEach(() => { state = createPlotMechanicsEngineState(); });

  describe('createPlotMechanicsEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.mechanisms.size).toBe(0);
      expect(state.interactions.size).toBe(0);
    });
  });

  describe('addPlotMechanism', () => {
    it('should add mechanism', () => {
      const next = addPlotMechanism(state, 'm1', 'trigger', 'desc', 1, 'reliable');
      expect(next.mechanisms.size).toBe(1);
      expect(next.totalMechanisms).toBe(1);
    });
  });

  describe('activateMechanism', () => {
    it('should activate', () => {
      let next = addPlotMechanism(state, 'm1', 'trigger', 'desc', 1);
      next = activateMechanism(next, 'm1', true);
      expect(next.mechanisms.get('m1')?.activationCount).toBe(1);
      expect(next.mechanisms.get('m1')?.successCount).toBe(1);
    });
  });

  describe('recordMechanismInteraction', () => {
    it('should record', () => {
      const next = recordMechanismInteraction(state, 'i1', 'm1', 'm2', 'synergy', 0.7, 5);
      expect(next.totalInteractions).toBe(1);
    });
  });

  describe('getMechanismsByType', () => {
    it('should filter by type', () => {
      let next = addPlotMechanism(state, 'm1', 'trigger', 'desc', 1);
      next = addPlotMechanism(next, 'm2', 'obstacle', 'desc', 1);
      const triggers = getMechanismsByType(next, 'trigger');
      expect(triggers.length).toBe(1);
    });
  });

  describe('getPlotMechanicsReport', () => {
    it('should return comprehensive report', () => {
      const report = getPlotMechanicsReport(state);
      expect(report.totalMechanisms).toBe(0);
      expect(typeof report.mechanismElegance).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getPlotMechanicsReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetPlotMechanicsEngineState', () => {
    it('should reset all state', () => {
      let next = addPlotMechanism(state, 'm1', 'trigger', 'desc', 1);
      next = resetPlotMechanicsEngineState();
      expect(next.mechanisms.size).toBe(0);
      expect(next.totalMechanisms).toBe(0);
    });
  });
});