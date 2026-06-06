/**
 * V1109 NarrativeImmersionFieldEngine Tests — Direction E Iter 2/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeImmersionFieldEngineState,
  addImmersionField,
  addImmersionLayer,
  getImmersionFieldsByMode,
  getImmersionFieldReport,
  resetNarrativeImmersionFieldEngineState,
  type NarrativeImmersionFieldEngineState,
} from './NarrativeImmersionFieldEngine';

describe('NarrativeImmersionFieldEngine', () => {
  let state: NarrativeImmersionFieldEngineState;

  beforeEach(() => { state = createNarrativeImmersionFieldEngineState(); });

  describe('createNarrativeImmersionFieldEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.fields.size).toBe(0);
      expect(state.layers.size).toBe(0);
    });
  });

  describe('addImmersionField', () => {
    it('should add field', () => {
      const next = addImmersionField(state, 'f1', 'sensory', 'deep', 'seamless', 'desc', 0.9, 0.8, 1);
      expect(next.fields.size).toBe(1);
      expect(next.totalFields).toBe(1);
    });
  });

  describe('addImmersionLayer', () => {
    it('should add layer', () => {
      let next = addImmersionField(state, 'f1', 'sensory', 'deep', 'seamless', 'desc', 0.9, 0.8, 1);
      next = addImmersionLayer(next, 'l1', ['f1']);
      expect(next.totalLayers).toBe(1);
    });
  });

  describe('getImmersionFieldsByMode', () => {
    it('should filter by mode', () => {
      let next = addImmersionField(state, 'f1', 'sensory', 'deep', 'seamless', 'desc', 0.9, 0.8, 1);
      next = addImmersionField(next, 'f2', 'emotional', 'deep', 'seamless', 'desc', 0.9, 0.8, 1);
      const sens = getImmersionFieldsByMode(next, 'sensory');
      expect(sens.length).toBe(1);
    });
  });

  describe('getImmersionFieldReport', () => {
    it('should return comprehensive report', () => {
      const report = getImmersionFieldReport(state);
      expect(report.totalFields).toBe(0);
      expect(typeof report.immersionMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getImmersionFieldReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeImmersionFieldEngineState', () => {
    it('should reset all state', () => {
      let next = addImmersionField(state, 'f1', 'sensory', 'deep', 'seamless', 'desc', 0.9, 0.8, 1);
      next = resetNarrativeImmersionFieldEngineState();
      expect(next.fields.size).toBe(0);
      expect(next.totalFields).toBe(0);
    });
  });
});