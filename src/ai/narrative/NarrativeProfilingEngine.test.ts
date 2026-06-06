/**
 * V1069 NarrativeProfilingEngine Tests — Direction D Iter 2/20 (Round 6)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeProfilingEngineState,
  addProfile,
  takeProfileSnapshot,
  getProfilesByType,
  getProfilingReport,
  resetNarrativeProfilingEngineState,
  type NarrativeProfilingEngineState,
} from './NarrativeProfilingEngine';

describe('NarrativeProfilingEngine', () => {
  let state: NarrativeProfilingEngineState;

  beforeEach(() => { state = createNarrativeProfilingEngineState(); });

  describe('createNarrativeProfilingEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.profiles.size).toBe(0);
      expect(state.snapshots.size).toBe(0);
    });
  });

  describe('addProfile', () => {
    it('should add profile', () => {
      const next = addProfile(state, 'p1', 'character', 'deep', 'precise', 'Profile 1', 'desc', 0.8, 0.7);
      expect(next.profiles.size).toBe(1);
      expect(next.totalProfiles).toBe(1);
    });
  });

  describe('takeProfileSnapshot', () => {
    it('should take snapshot', () => {
      let next = addProfile(state, 'p1', 'character', 'deep', 'precise', 'Profile 1', 'desc', 0.8, 0.7);
      next = takeProfileSnapshot(next, 's1', 'p1', 1, 0.1);
      expect(next.totalSnapshots).toBe(1);
    });
  });

  describe('getProfilesByType', () => {
    it('should filter by type', () => {
      let next = addProfile(state, 'p1', 'character', 'deep', 'precise', 'Profile 1', 'desc', 0.8, 0.7);
      next = addProfile(next, 'p2', 'reader', 'deep', 'precise', 'Profile 2', 'desc', 0.8, 0.7);
      const character = getProfilesByType(next, 'character');
      expect(character.length).toBe(1);
    });
  });

  describe('getProfilingReport', () => {
    it('should return comprehensive report', () => {
      const report = getProfilingReport(state);
      expect(report.totalProfiles).toBe(0);
      expect(typeof report.profilingMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getProfilingReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeProfilingEngineState', () => {
    it('should reset all state', () => {
      let next = addProfile(state, 'p1', 'character', 'deep', 'precise', 'Profile 1', 'desc', 0.8, 0.7);
      next = resetNarrativeProfilingEngineState();
      expect(next.profiles.size).toBe(0);
      expect(next.totalProfiles).toBe(0);
    });
  });
});