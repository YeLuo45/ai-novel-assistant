/**
 * V767 AtmosphereEngine Tests — Direction B Iter 6/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAtmosphereEngineState,
  addSensoryDetail,
  createMoodBeat,
  linkSensoryToBeat,
  getSensoryByType,
  getMoodBeatsByMood,
  getAtmosphereReport,
  resetAtmosphereEngineState,
  type AtmosphereEngineState,
} from './AtmosphereEngine';

describe('AtmosphereEngine', () => {
  let state: AtmosphereEngineState;

  beforeEach(() => { state = createAtmosphereEngineState(); });

  describe('createAtmosphereEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.sensoryDetails.size).toBe(0);
      expect(state.moodBeats.size).toBe(0);
    });
  });

  describe('addSensoryDetail', () => {
    it('should add detail', () => {
      const next = addSensoryDetail(state, 'd1', 'visual', 'golden sunset', 1, 0.8);
      expect(next.sensoryDetails.size).toBe(1);
      expect(next.totalSensoryDetails).toBe(1);
    });

    it('should clamp weight', () => {
      const next = addSensoryDetail(state, 'd1', 'visual', 'desc', 1, 1.5);
      expect(next.sensoryDetails.get('d1')?.weight).toBe(1);
    });
  });

  describe('createMoodBeat', () => {
    it('should create mood beat', () => {
      const next = createMoodBeat(state, 'b1', 'mysterious', 1, 5, 'enigmatic atmosphere');
      expect(next.moodBeats.size).toBe(1);
      expect(next.totalMoodBeats).toBe(1);
    });
  });

  describe('linkSensoryToBeat', () => {
    it('should link', () => {
      let next = addSensoryDetail(state, 'd1', 'visual', 'desc', 1);
      next = createMoodBeat(next, 'b1', 'mysterious', 1, 5);
      next = linkSensoryToBeat(next, 'b1', 'd1');
      expect(next.moodBeats.get('b1')?.sensoryDetailIds.length).toBe(1);
    });

    it('should return state for unknown beat', () => {
      const next = linkSensoryToBeat(state, 'unknown', 'd1');
      expect(next.totalMoodBeats).toBe(0);
    });
  });

  describe('getSensoryByType', () => {
    it('should filter by type', () => {
      let next = addSensoryDetail(state, 'd1', 'visual', 'desc', 1);
      next = addSensoryDetail(next, 'd2', 'auditory', 'desc', 1);
      const visuals = getSensoryByType(next, 'visual');
      expect(visuals.length).toBe(1);
    });
  });

  describe('getMoodBeatsByMood', () => {
    it('should filter by mood', () => {
      let next = createMoodBeat(state, 'b1', 'dark', 1, 5);
      next = createMoodBeat(next, 'b2', 'cheerful', 1, 5);
      const dark = getMoodBeatsByMood(next, 'dark');
      expect(dark.length).toBe(1);
    });
  });

  describe('getAtmosphereReport', () => {
    it('should return comprehensive report', () => {
      const report = getAtmosphereReport(state);
      expect(report.totalSensoryDetails).toBe(0);
      expect(typeof report.sensoryBalance).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAtmosphereReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetAtmosphereEngineState', () => {
    it('should reset all state', () => {
      let next = addSensoryDetail(state, 'd1', 'visual', 'desc', 1);
      next = resetAtmosphereEngineState();
      expect(next.sensoryDetails.size).toBe(0);
      expect(next.totalSensoryDetails).toBe(0);
    });
  });
});