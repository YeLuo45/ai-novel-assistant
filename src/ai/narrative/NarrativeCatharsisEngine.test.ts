/**
 * V1121 NarrativeCatharsisEngine Tests — Direction E Iter 8/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCatharsisEngineState,
  addCatharsis,
  addCatharsisWave,
  getCatharsesByType,
  getCatharsisReport,
  resetNarrativeCatharsisEngineState,
  type NarrativeCatharsisEngineState,
} from './NarrativeCatharsisEngine';

describe('NarrativeCatharsisEngine', () => {
  let state: NarrativeCatharsisEngineState;

  beforeEach(() => { state = createNarrativeCatharsisEngineState(); });

  describe('createNarrativeCatharsisEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.catharses.size).toBe(0);
      expect(state.waves.size).toBe(0);
    });
  });

  describe('addCatharsis', () => {
    it('should add catharsis', () => {
      const next = addCatharsis(state, 'c1', 'grief', 'overwhelming', 'lingering', 'desc', 0.9, 0.8, 1);
      expect(next.catharses.size).toBe(1);
      expect(next.totalCatharses).toBe(1);
    });
  });

  describe('addCatharsisWave', () => {
    it('should add wave', () => {
      let next = addCatharsis(state, 'c1', 'grief', 'overwhelming', 'lingering', 'desc', 0.9, 0.8, 1);
      next = addCatharsisWave(next, 'w1', ['c1']);
      expect(next.totalWaves).toBe(1);
    });
  });

  describe('getCatharsesByType', () => {
    it('should filter by type', () => {
      let next = addCatharsis(state, 'c1', 'grief', 'overwhelming', 'lingering', 'desc', 0.9, 0.8, 1);
      next = addCatharsis(next, 'c2', 'joy', 'overwhelming', 'lingering', 'desc', 0.9, 0.8, 1);
      const grief = getCatharsesByType(next, 'grief');
      expect(grief.length).toBe(1);
    });
  });

  describe('getCatharsisReport', () => {
    it('should return comprehensive report', () => {
      const report = getCatharsisReport(state);
      expect(report.totalCatharses).toBe(0);
      expect(typeof report.catharsisMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCatharsisReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeCatharsisEngineState', () => {
    it('should reset all state', () => {
      let next = addCatharsis(state, 'c1', 'grief', 'overwhelming', 'lingering', 'desc', 0.9, 0.8, 1);
      next = resetNarrativeCatharsisEngineState();
      expect(next.catharses.size).toBe(0);
      expect(next.totalCatharses).toBe(0);
    });
  });
});