/**
 * V1019 NarrativeClosingEngine Tests — Direction B Iter 12/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeClosingEngineState,
  addClosing,
  addClosingProfile,
  getClosingsByType,
  getClosingReport,
  resetNarrativeClosingEngineState,
  type NarrativeClosingEngineState,
} from './NarrativeClosingEngine';

describe('NarrativeClosingEngine', () => {
  let state: NarrativeClosingEngineState;

  beforeEach(() => { state = createNarrativeClosingEngineState(); });

  describe('createNarrativeClosingEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.closings.size).toBe(0);
      expect(state.profiles.size).toBe(0);
    });
  });

  describe('addClosing', () => {
    it('should add closing', () => {
      const next = addClosing(state, 'c1', 'resolution', 'resonant', 'enduring', 'desc', 0.9, 0.95, 1);
      expect(next.closings.size).toBe(1);
      expect(next.totalClosings).toBe(1);
    });
  });

  describe('addClosingProfile', () => {
    it('should add profile', () => {
      let next = addClosing(state, 'c1', 'resolution', 'resonant', 'enduring', 'desc', 0.9, 0.95, 1);
      next = addClosingProfile(next, 'p1', ['c1']);
      expect(next.totalProfiles).toBe(1);
    });
  });

  describe('getClosingsByType', () => {
    it('should filter by type', () => {
      let next = addClosing(state, 'c1', 'resolution', 'resonant', 'enduring', 'desc', 0.9, 0.95, 1);
      next = addClosing(next, 'c2', 'epilogue', 'resonant', 'enduring', 'desc', 0.9, 0.95, 1);
      const resolution = getClosingsByType(next, 'resolution');
      expect(resolution.length).toBe(1);
    });
  });

  describe('getClosingReport', () => {
    it('should return comprehensive report', () => {
      const report = getClosingReport(state);
      expect(report.totalClosings).toBe(0);
      expect(typeof report.closingMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getClosingReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeClosingEngineState', () => {
    it('should reset all state', () => {
      let next = addClosing(state, 'c1', 'resolution', 'resonant', 'enduring', 'desc', 0.9, 0.95, 1);
      next = resetNarrativeClosingEngineState();
      expect(next.closings.size).toBe(0);
      expect(next.totalClosings).toBe(0);
    });
  });
});