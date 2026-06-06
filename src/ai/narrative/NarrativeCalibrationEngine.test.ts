/**
 * V1067 NarrativeCalibrationEngine Tests — Direction D Iter 1/20 (Round 6)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCalibrationEngineState,
  addCalibrationEvent,
  addCalibrationProfile,
  getEventsByTarget,
  getCalibrationReport,
  resetNarrativeCalibrationEngineState,
  type NarrativeCalibrationEngineState,
} from './NarrativeCalibrationEngine';

describe('NarrativeCalibrationEngine', () => {
  let state: NarrativeCalibrationEngineState;

  beforeEach(() => { state = createNarrativeCalibrationEngineState(); });

  describe('createNarrativeCalibrationEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.events.size).toBe(0);
      expect(state.profiles.size).toBe(0);
    });
  });

  describe('addCalibrationEvent', () => {
    it('should add event', () => {
      const next = addCalibrationEvent(state, 'e1', 'pacing', 'precise', 'optimal', 'desc', 0.3, 0.7);
      expect(next.events.size).toBe(1);
      expect(next.totalEvents).toBe(1);
    });
  });

  describe('addCalibrationProfile', () => {
    it('should add profile', () => {
      let next = addCalibrationEvent(state, 'e1', 'pacing', 'precise', 'optimal', 'desc', 0.3, 0.7);
      next = addCalibrationProfile(next, 'p1', 'main', ['e1']);
      expect(next.totalProfiles).toBe(1);
    });
  });

  describe('getEventsByTarget', () => {
    it('should filter by target', () => {
      let next = addCalibrationEvent(state, 'e1', 'pacing', 'precise', 'optimal', 'desc', 0.3, 0.7);
      next = addCalibrationEvent(next, 'e2', 'tone', 'precise', 'optimal', 'desc', 0.3, 0.7);
      const pacing = getEventsByTarget(next, 'pacing');
      expect(pacing.length).toBe(1);
    });
  });

  describe('getCalibrationReport', () => {
    it('should return comprehensive report', () => {
      const report = getCalibrationReport(state);
      expect(report.totalEvents).toBe(0);
      expect(typeof report.calibrationMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCalibrationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeCalibrationEngineState', () => {
    it('should reset all state', () => {
      let next = addCalibrationEvent(state, 'e1', 'pacing', 'precise', 'optimal', 'desc', 0.3, 0.7);
      next = resetNarrativeCalibrationEngineState();
      expect(next.events.size).toBe(0);
      expect(next.totalEvents).toBe(0);
    });
  });
});