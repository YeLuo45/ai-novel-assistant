/**
 * V1193 NarrativeTimeLayerEngine Tests — Direction G Iter 4/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTimeLayerEngineState,
  addTimeLayer,
  addTimeLayerStratum,
  getTimeLayersByType,
  getTimeLayerReport,
  resetNarrativeTimeLayerEngineState,
  type NarrativeTimeLayerEngineState,
} from './NarrativeTimeLayerEngine';

describe('NarrativeTimeLayerEngine', () => {
  let state: NarrativeTimeLayerEngineState;

  beforeEach(() => { state = createNarrativeTimeLayerEngineState(); });

  describe('createNarrativeTimeLayerEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.layers.size).toBe(0);
      expect(state.strata.size).toBe(0);
    });
  });

  describe('addTimeLayer', () => {
    it('should add layer', () => {
      const next = addTimeLayer(state, 'l1', 'eternal', 'abyssal', 'mirrored', 'desc', 0.9, 0.85, 1);
      expect(next.layers.size).toBe(1);
      expect(next.totalLayers).toBe(1);
    });
  });

  describe('addTimeLayerStratum', () => {
    it('should add stratum', () => {
      let next = addTimeLayer(state, 'l1', 'eternal', 'abyssal', 'mirrored', 'desc', 0.9, 0.85, 1);
      next = addTimeLayerStratum(next, 's1', ['l1']);
      expect(next.totalStrata).toBe(1);
    });
  });

  describe('getTimeLayersByType', () => {
    it('should filter by type', () => {
      let next = addTimeLayer(state, 'l1', 'eternal', 'abyssal', 'mirrored', 'desc', 0.9, 0.85, 1);
      next = addTimeLayer(next, 'l2', 'past', 'abyssal', 'mirrored', 'desc', 0.9, 0.85, 1);
      const eternal = getTimeLayersByType(next, 'eternal');
      expect(eternal.length).toBe(1);
    });
  });

  describe('getTimeLayerReport', () => {
    it('should return comprehensive report', () => {
      const report = getTimeLayerReport(state);
      expect(report.totalLayers).toBe(0);
      expect(typeof report.timeLayerMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTimeLayerReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTimeLayerEngineState', () => {
    it('should reset all state', () => {
      let next = addTimeLayer(state, 'l1', 'eternal', 'abyssal', 'mirrored', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeTimeLayerEngineState();
      expect(next.layers.size).toBe(0);
      expect(next.totalLayers).toBe(0);
    });
  });
});