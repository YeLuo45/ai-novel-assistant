/**
 * V1179 NarrativeEuphonyEngine Tests — Direction F Iter 17/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeEuphonyEngineState,
  addEuphony,
  addEuphonyLayer,
  getEuphoniesByType,
  getEuphonyReport,
  resetNarrativeEuphonyEngineState,
  type NarrativeEuphonyEngineState,
} from './NarrativeEuphonyEngine';

describe('NarrativeEuphonyEngine', () => {
  let state: NarrativeEuphonyEngineState;

  beforeEach(() => { state = createNarrativeEuphonyEngineState(); });

  describe('createNarrativeEuphonyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.euphonies.size).toBe(0);
      expect(state.layers.size).toBe(0);
    });
  });

  describe('addEuphony', () => {
    it('should add euphony', () => {
      const next = addEuphony(state, 'e1', 'liquid', 'melodious', 'rich', 'desc', 0.9, 0.85, 1);
      expect(next.euphonies.size).toBe(1);
      expect(next.totalEuphonies).toBe(1);
    });
  });

  describe('addEuphonyLayer', () => {
    it('should add layer', () => {
      let next = addEuphony(state, 'e1', 'liquid', 'melodious', 'rich', 'desc', 0.9, 0.85, 1);
      next = addEuphonyLayer(next, 'l1', ['e1']);
      expect(next.totalLayers).toBe(1);
    });
  });

  describe('getEuphoniesByType', () => {
    it('should filter by type', () => {
      let next = addEuphony(state, 'e1', 'liquid', 'melodious', 'rich', 'desc', 0.9, 0.85, 1);
      next = addEuphony(next, 'e2', 'sibilant', 'melodious', 'rich', 'desc', 0.9, 0.85, 1);
      const liquid = getEuphoniesByType(next, 'liquid');
      expect(liquid.length).toBe(1);
    });
  });

  describe('getEuphonyReport', () => {
    it('should return comprehensive report', () => {
      const report = getEuphonyReport(state);
      expect(report.totalEuphonies).toBe(0);
      expect(typeof report.euphonyMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getEuphonyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeEuphonyEngineState', () => {
    it('should reset all state', () => {
      let next = addEuphony(state, 'e1', 'liquid', 'melodious', 'rich', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeEuphonyEngineState();
      expect(next.euphonies.size).toBe(0);
      expect(next.totalEuphonies).toBe(0);
    });
  });
});