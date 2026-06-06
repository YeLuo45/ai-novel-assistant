/**
 * V1115 NarrativeTensionReleaseEngine Tests — Direction E Iter 5/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTensionReleaseEngineState,
  addTensionRelease,
  addTensionWave,
  getTensionReleasesByType,
  getTensionReleaseReport,
  resetNarrativeTensionReleaseEngineState,
  type NarrativeTensionReleaseEngineState,
} from './NarrativeTensionReleaseEngine';

describe('NarrativeTensionReleaseEngine', () => {
  let state: NarrativeTensionReleaseEngineState;

  beforeEach(() => { state = createNarrativeTensionReleaseEngineState(); });

  describe('createNarrativeTensionReleaseEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.releases.size).toBe(0);
      expect(state.waves.size).toBe(0);
    });
  });

  describe('addTensionRelease', () => {
    it('should add release', () => {
      const next = addTensionRelease(state, 'r1', 'climax', 'gradual', 'cathartic', 'desc', 0.9, 0.8, 1);
      expect(next.releases.size).toBe(1);
      expect(next.totalReleases).toBe(1);
    });
  });

  describe('addTensionWave', () => {
    it('should add wave', () => {
      let next = addTensionRelease(state, 'r1', 'climax', 'gradual', 'cathartic', 'desc', 0.9, 0.8, 1);
      next = addTensionWave(next, 'w1', ['r1']);
      expect(next.totalWaves).toBe(1);
    });
  });

  describe('getTensionReleasesByType', () => {
    it('should filter by type', () => {
      let next = addTensionRelease(state, 'r1', 'climax', 'gradual', 'cathartic', 'desc', 0.9, 0.8, 1);
      next = addTensionRelease(next, 'r2', 'relief', 'gradual', 'cathartic', 'desc', 0.9, 0.8, 1);
      const cath = getTensionReleasesByType(next, 'climax');
      expect(cath.length).toBe(1);
    });
  });

  describe('getTensionReleaseReport', () => {
    it('should return comprehensive report', () => {
      const report = getTensionReleaseReport(state);
      expect(report.totalReleases).toBe(0);
      expect(typeof report.tensionReleaseMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTensionReleaseReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTensionReleaseEngineState', () => {
    it('should reset all state', () => {
      let next = addTensionRelease(state, 'r1', 'climax', 'gradual', 'cathartic', 'desc', 0.9, 0.8, 1);
      next = resetNarrativeTensionReleaseEngineState();
      expect(next.releases.size).toBe(0);
      expect(next.totalReleases).toBe(0);
    });
  });
});