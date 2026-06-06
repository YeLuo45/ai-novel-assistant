/**
 * V1107 NarrativeEngagementPulseEngine Tests — Direction E Iter 1/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeEngagementPulseEngineState,
  addEngagementPulse,
  addEngagementWave,
  getEngagementPulsesByType,
  getEngagementPulseReport,
  resetNarrativeEngagementPulseEngineState,
  type NarrativeEngagementPulseEngineState,
} from './NarrativeEngagementPulseEngine';

describe('NarrativeEngagementPulseEngine', () => {
  let state: NarrativeEngagementPulseEngineState;

  beforeEach(() => { state = createNarrativeEngagementPulseEngineState(); });

  describe('createNarrativeEngagementPulseEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.pulses.size).toBe(0);
      expect(state.waves.size).toBe(0);
    });
  });

  describe('addEngagementPulse', () => {
    it('should add pulse', () => {
      const next = addEngagementPulse(state, 'p1', 'peak', 'strong', 'chapter', 'desc', 0.8, 0.7, 1);
      expect(next.pulses.size).toBe(1);
      expect(next.totalPulses).toBe(1);
    });
  });

  describe('addEngagementWave', () => {
    it('should add wave', () => {
      let next = addEngagementPulse(state, 'p1', 'peak', 'strong', 'chapter', 'desc', 0.8, 0.7, 1);
      next = addEngagementWave(next, 'w1', ['p1']);
      expect(next.totalWaves).toBe(1);
    });
  });

  describe('getEngagementPulsesByType', () => {
    it('should filter by type', () => {
      let next = addEngagementPulse(state, 'p1', 'peak', 'strong', 'chapter', 'desc', 0.8, 0.7, 1);
      next = addEngagementPulse(next, 'p2', 'rising', 'strong', 'chapter', 'desc', 0.8, 0.7, 1);
      const peak = getEngagementPulsesByType(next, 'peak');
      expect(peak.length).toBe(1);
    });
  });

  describe('getEngagementPulseReport', () => {
    it('should return comprehensive report', () => {
      const report = getEngagementPulseReport(state);
      expect(report.totalPulses).toBe(0);
      expect(typeof report.engagementMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getEngagementPulseReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeEngagementPulseEngineState', () => {
    it('should reset all state', () => {
      let next = addEngagementPulse(state, 'p1', 'peak', 'strong', 'chapter', 'desc', 0.8, 0.7, 1);
      next = resetNarrativeEngagementPulseEngineState();
      expect(next.pulses.size).toBe(0);
      expect(next.totalPulses).toBe(0);
    });
  });
});