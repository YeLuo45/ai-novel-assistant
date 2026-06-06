/**
 * V1101 NarrativeStabilizationEngine Tests — Direction D Iter 18/20 (Round 6)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStabilizationEngineState,
  addStabilization,
  addStabilizationLayer,
  getStabilizationsByType,
  getStabilizationReport,
  resetNarrativeStabilizationEngineState,
  type NarrativeStabilizationEngineState,
} from './NarrativeStabilizationEngine';

describe('NarrativeStabilizationEngine', () => {
  let state: NarrativeStabilizationEngineState;

  beforeEach(() => { state = createNarrativeStabilizationEngineState(); });

  describe('createNarrativeStabilizationEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.stabilizations.size).toBe(0);
      expect(state.layers.size).toBe(0);
    });
  });

  describe('addStabilization', () => {
    it('should add stabilization', () => {
      const next = addStabilization(state, 's1', 'structural', 'solid', 'arc', 'desc', 0.8, 0.7, 1);
      expect(next.stabilizations.size).toBe(1);
      expect(next.totalStabilizations).toBe(1);
    });
  });

  describe('addStabilizationLayer', () => {
    it('should add layer', () => {
      let next = addStabilization(state, 's1', 'structural', 'solid', 'arc', 'desc', 0.8, 0.7, 1);
      next = addStabilizationLayer(next, 'l1', ['s1']);
      expect(next.totalLayers).toBe(1);
    });
  });

  describe('getStabilizationsByType', () => {
    it('should filter by type', () => {
      let next = addStabilization(state, 's1', 'structural', 'solid', 'arc', 'desc', 0.8, 0.7, 1);
      next = addStabilization(next, 's2', 'tonal', 'solid', 'arc', 'desc', 0.8, 0.7, 1);
      const structural = getStabilizationsByType(next, 'structural');
      expect(structural.length).toBe(1);
    });
  });

  describe('getStabilizationReport', () => {
    it('should return comprehensive report', () => {
      const report = getStabilizationReport(state);
      expect(report.totalStabilizations).toBe(0);
      expect(typeof report.stabilizationMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStabilizationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStabilizationEngineState', () => {
    it('should reset all state', () => {
      let next = addStabilization(state, 's1', 'structural', 'solid', 'arc', 'desc', 0.8, 0.7, 1);
      next = resetNarrativeStabilizationEngineState();
      expect(next.stabilizations.size).toBe(0);
      expect(next.totalStabilizations).toBe(0);
    });
  });
});