/**
 * V1127 NarrativeAbsorptionEngine Tests — Direction E Iter 11/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAbsorptionEngineState,
  addAbsorption,
  addAbsorptionWave,
  getAbsorptionsByType,
  getAbsorptionReport,
  resetNarrativeAbsorptionEngineState,
  type NarrativeAbsorptionEngineState,
} from './NarrativeAbsorptionEngine';

describe('NarrativeAbsorptionEngine', () => {
  let state: NarrativeAbsorptionEngineState;

  beforeEach(() => { state = createNarrativeAbsorptionEngineState(); });

  describe('createNarrativeAbsorptionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.absorptions.size).toBe(0);
      expect(state.waves.size).toBe(0);
    });
  });

  describe('addAbsorption', () => {
    it('should add absorption', () => {
      const next = addAbsorption(state, 'a1', 'attentional', 'deep', 'opening', 'desc', 0.9, 0.85, 1);
      expect(next.absorptions.size).toBe(1);
      expect(next.totalAbsorptions).toBe(1);
    });
  });

  describe('addAbsorptionWave', () => {
    it('should add wave', () => {
      let next = addAbsorption(state, 'a1', 'attentional', 'deep', 'opening', 'desc', 0.9, 0.85, 1);
      next = addAbsorptionWave(next, 'w1', ['a1']);
      expect(next.totalWaves).toBe(1);
    });
  });

  describe('getAbsorptionsByType', () => {
    it('should filter by type', () => {
      let next = addAbsorption(state, 'a1', 'attentional', 'deep', 'opening', 'desc', 0.9, 0.85, 1);
      next = addAbsorption(next, 'a2', 'imaginative', 'deep', 'opening', 'desc', 0.9, 0.85, 1);
      const att = getAbsorptionsByType(next, 'attentional');
      expect(att.length).toBe(1);
    });
  });

  describe('getAbsorptionReport', () => {
    it('should return comprehensive report', () => {
      const report = getAbsorptionReport(state);
      expect(report.totalAbsorptions).toBe(0);
      expect(typeof report.absorptionMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAbsorptionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAbsorptionEngineState', () => {
    it('should reset all state', () => {
      let next = addAbsorption(state, 'a1', 'attentional', 'deep', 'opening', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeAbsorptionEngineState();
      expect(next.absorptions.size).toBe(0);
      expect(next.totalAbsorptions).toBe(0);
    });
  });
});