/**
 * V1129 NarrativeTransportationEngine Tests — Direction E Iter 12/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTransportationEngineState,
  addTransportation,
  addTransportationLayer,
  getTransportationsByMode,
  getTransportationReport,
  resetNarrativeTransportationEngineState,
  type NarrativeTransportationEngineState,
} from './NarrativeTransportationEngine';

describe('NarrativeTransportationEngine', () => {
  let state: NarrativeTransportationEngineState;

  beforeEach(() => { state = createNarrativeTransportationEngineState(); });

  describe('createNarrativeTransportationEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.transportations.size).toBe(0);
      expect(state.layers.size).toBe(0);
    });
  });

  describe('addTransportation', () => {
    it('should add transportation', () => {
      const next = addTransportation(state, 't1', 'spatial', 'far', 'vivid', 'desc', 0.85, 0.9, 1);
      expect(next.transportations.size).toBe(1);
      expect(next.totalTransportations).toBe(1);
    });
  });

  describe('addTransportationLayer', () => {
    it('should add layer', () => {
      let next = addTransportation(state, 't1', 'spatial', 'far', 'vivid', 'desc', 0.85, 0.9, 1);
      next = addTransportationLayer(next, 'l1', ['t1']);
      expect(next.totalLayers).toBe(1);
    });
  });

  describe('getTransportationsByMode', () => {
    it('should filter by mode', () => {
      let next = addTransportation(state, 't1', 'spatial', 'far', 'vivid', 'desc', 0.85, 0.9, 1);
      next = addTransportation(next, 't2', 'temporal', 'far', 'vivid', 'desc', 0.85, 0.9, 1);
      const spatial = getTransportationsByMode(next, 'spatial');
      expect(spatial.length).toBe(1);
    });
  });

  describe('getTransportationReport', () => {
    it('should return comprehensive report', () => {
      const report = getTransportationReport(state);
      expect(report.totalTransportations).toBe(0);
      expect(typeof report.transportationMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTransportationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTransportationEngineState', () => {
    it('should reset all state', () => {
      let next = addTransportation(state, 't1', 'spatial', 'far', 'vivid', 'desc', 0.85, 0.9, 1);
      next = resetNarrativeTransportationEngineState();
      expect(next.transportations.size).toBe(0);
      expect(next.totalTransportations).toBe(0);
    });
  });
});