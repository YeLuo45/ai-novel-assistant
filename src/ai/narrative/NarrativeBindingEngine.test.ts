/**
 * V1081 NarrativeBindingEngine Tests — Direction D Iter 8/20 (Round 6)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeBindingEngineState,
  addBinding,
  addBindingNetwork,
  getBindingsByType,
  getBindingReport,
  resetNarrativeBindingEngineState,
  type NarrativeBindingEngineState,
} from './NarrativeBindingEngine';

describe('NarrativeBindingEngine', () => {
  let state: NarrativeBindingEngineState;

  beforeEach(() => { state = createNarrativeBindingEngineState(); });

  describe('createNarrativeBindingEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.bindings.size).toBe(0);
      expect(state.networks.size).toBe(0);
    });
  });

  describe('addBinding', () => {
    it('should add binding', () => {
      const next = addBinding(state, 'b1', 'thematic', 'strong', 'arc', 'desc', 0.8, 0.9, 1);
      expect(next.bindings.size).toBe(1);
      expect(next.totalBindings).toBe(1);
    });
  });

  describe('addBindingNetwork', () => {
    it('should add network', () => {
      let next = addBinding(state, 'b1', 'thematic', 'strong', 'arc', 'desc', 0.8, 0.9, 1);
      next = addBindingNetwork(next, 'n1', 'main', ['b1']);
      expect(next.totalNetworks).toBe(1);
    });
  });

  describe('getBindingsByType', () => {
    it('should filter by type', () => {
      let next = addBinding(state, 'b1', 'thematic', 'strong', 'arc', 'desc', 0.8, 0.9, 1);
      next = addBinding(next, 'b2', 'symbolic', 'strong', 'arc', 'desc', 0.8, 0.9, 1);
      const thematic = getBindingsByType(next, 'thematic');
      expect(thematic.length).toBe(1);
    });
  });

  describe('getBindingReport', () => {
    it('should return comprehensive report', () => {
      const report = getBindingReport(state);
      expect(report.totalBindings).toBe(0);
      expect(typeof report.bindingMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getBindingReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeBindingEngineState', () => {
    it('should reset all state', () => {
      let next = addBinding(state, 'b1', 'thematic', 'strong', 'arc', 'desc', 0.8, 0.9, 1);
      next = resetNarrativeBindingEngineState();
      expect(next.bindings.size).toBe(0);
      expect(next.totalBindings).toBe(0);
    });
  });
});