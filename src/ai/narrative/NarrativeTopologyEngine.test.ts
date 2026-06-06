/**
 * V893 NarrativeTopologyEngine Tests — Direction C Iter 9/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTopologyEngineState,
  addNarrativeLayer,
  addNarrativeBridge,
  getLayersByElement,
  getNarrativeTopologyReport,
  resetNarrativeTopologyEngineState,
  type NarrativeTopologyEngineState,
} from './NarrativeTopologyEngine';

describe('NarrativeTopologyEngine', () => {
  let state: NarrativeTopologyEngineState;

  beforeEach(() => { state = createNarrativeTopologyEngineState(); });

  describe('createNarrativeTopologyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.layers.size).toBe(0);
      expect(state.bridges.size).toBe(0);
    });
  });

  describe('addNarrativeLayer', () => {
    it('should add layer', () => {
      const next = addNarrativeLayer(state, 'l1', 'Main', 0, 'frame', 1);
      expect(next.layers.size).toBe(1);
      expect(next.totalLayers).toBe(1);
    });

    it('should update parent child count', () => {
      let next = addNarrativeLayer(state, 'l1', 'Main', 0, 'frame', 1);
      next = addNarrativeLayer(next, 'l2', 'Inset', 1, 'inset', 5, 'l1');
      expect(next.layers.get('l1')?.childCount).toBe(1);
    });
  });

  describe('addNarrativeBridge', () => {
    it('should add bridge', () => {
      let next = addNarrativeLayer(state, 'l1', 'Main', 0, 'frame', 1);
      next = addNarrativeLayer(next, 'l2', 'Inset', 1, 'inset', 5);
      next = addNarrativeBridge(next, 'b1', 'l1', 'l2', 'reference', 0.7);
      expect(next.totalBridges).toBe(1);
    });
  });

  describe('getLayersByElement', () => {
    it('should filter by element', () => {
      let next = addNarrativeLayer(state, 'l1', 'Main', 0, 'frame', 1);
      next = addNarrativeLayer(next, 'l2', 'Inset', 1, 'inset', 5);
      const frames = getLayersByElement(next, 'frame');
      expect(frames.length).toBe(1);
    });
  });

  describe('getNarrativeTopologyReport', () => {
    it('should return comprehensive report', () => {
      const report = getNarrativeTopologyReport(state);
      expect(report.totalLayers).toBe(0);
      expect(typeof report.structuralElegance).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getNarrativeTopologyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTopologyEngineState', () => {
    it('should reset all state', () => {
      let next = addNarrativeLayer(state, 'l1', 'Main', 0, 'frame', 1);
      next = resetNarrativeTopologyEngineState();
      expect(next.layers.size).toBe(0);
      expect(next.totalLayers).toBe(0);
    });
  });
});