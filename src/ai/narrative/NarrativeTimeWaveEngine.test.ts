/**
 * V1207 NarrativeTimeWaveEngine Tests — Direction G Iter 11/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTimeWaveEngineState,
  addTimeWave,
  addTimeWavePattern,
  getTimeWavesByType,
  getTimeWaveReport,
  resetNarrativeTimeWaveEngineState,
  type NarrativeTimeWaveEngineState,
} from './NarrativeTimeWaveEngine';

describe('NarrativeTimeWaveEngine', () => {
  let state: NarrativeTimeWaveEngineState;

  beforeEach(() => { state = createNarrativeTimeWaveEngineState(); });

  describe('createNarrativeTimeWaveEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.waves.size).toBe(0);
      expect(state.patterns.size).toBe(0);
    });
  });

  describe('addTimeWave', () => {
    it('should add wave', () => {
      const next = addTimeWave(state, 'w1', 'sine', 'dramatic', 'continuous', 'desc', 0.9, 0.85, 1);
      expect(next.waves.size).toBe(1);
      expect(next.totalWaves).toBe(1);
    });
  });

  describe('addTimeWavePattern', () => {
    it('should add pattern', () => {
      let next = addTimeWave(state, 'w1', 'sine', 'dramatic', 'continuous', 'desc', 0.9, 0.85, 1);
      next = addTimeWavePattern(next, 'p1', ['w1']);
      expect(next.totalPatterns).toBe(1);
    });
  });

  describe('getTimeWavesByType', () => {
    it('should filter by type', () => {
      let next = addTimeWave(state, 'w1', 'sine', 'dramatic', 'continuous', 'desc', 0.9, 0.85, 1);
      next = addTimeWave(next, 'w2', 'square', 'dramatic', 'continuous', 'desc', 0.9, 0.85, 1);
      const sine = getTimeWavesByType(next, 'sine');
      expect(sine.length).toBe(1);
    });
  });

  describe('getTimeWaveReport', () => {
    it('should return comprehensive report', () => {
      const report = getTimeWaveReport(state);
      expect(report.totalWaves).toBe(0);
      expect(typeof report.timeWaveMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTimeWaveReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTimeWaveEngineState', () => {
    it('should reset all state', () => {
      let next = addTimeWave(state, 'w1', 'sine', 'dramatic', 'continuous', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeTimeWaveEngineState();
      expect(next.waves.size).toBe(0);
      expect(next.totalWaves).toBe(0);
    });
  });
});