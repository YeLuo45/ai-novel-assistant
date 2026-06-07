/**
 * V1323 NarrativeWorldTopographyEngine Tests — Direction J Iter 9/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWorldTopographyEngineState,
  addWorldTopographyEntry,
  addWorldTopographyProfile,
  getWorldTopographyEntriesByFeature,
  getWorldTopographyReport,
  resetNarrativeWorldTopographyEngineState,
  type NarrativeWorldTopographyEngineState,
} from './NarrativeWorldTopographyEngine';

describe('NarrativeWorldTopographyEngine', () => {
  let state: NarrativeWorldTopographyEngineState;

  beforeEach(() => { state = createNarrativeWorldTopographyEngineState(); });

  describe('createNarrativeWorldTopographyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.profiles.size).toBe(0);
    });
  });

  describe('addWorldTopographyEntry', () => {
    it('should add entry', () => {
      const next = addWorldTopographyEntry(state, 'e1', 'transcendent', 'celestial', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addWorldTopographyProfile', () => {
    it('should add profile', () => {
      let next = addWorldTopographyEntry(state, 'e1', 'transcendent', 'celestial', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldTopographyProfile(next, 'p1', ['e1']);
      expect(next.totalProfiles).toBe(1);
    });
  });

  describe('getWorldTopographyEntriesByFeature', () => {
    it('should filter by feature', () => {
      let next = addWorldTopographyEntry(state, 'e1', 'transcendent', 'celestial', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldTopographyEntry(next, 'e2', 'peak', 'celestial', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getWorldTopographyEntriesByFeature(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getWorldTopographyReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldTopographyReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.worldTopographyMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldTopographyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeWorldTopographyEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldTopographyEntry(state, 'e1', 'transcendent', 'celestial', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeWorldTopographyEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});