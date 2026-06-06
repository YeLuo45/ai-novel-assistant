/**
 * V1181 NarrativeVoiceProfileEngine Tests — Direction F Iter 18/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeVoiceProfileEngineState,
  addVoiceProfile,
  addVoiceProfileLayer,
  getVoiceProfilesByAxis,
  getVoiceProfileReport,
  resetNarrativeVoiceProfileEngineState,
  type NarrativeVoiceProfileEngineState,
} from './NarrativeVoiceProfileEngine';

describe('NarrativeVoiceProfileEngine', () => {
  let state: NarrativeVoiceProfileEngineState;

  beforeEach(() => { state = createNarrativeVoiceProfileEngineState(); });

  describe('createNarrativeVoiceProfileEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.profiles.size).toBe(0);
      expect(state.layers.size).toBe(0);
    });
  });

  describe('addVoiceProfile', () => {
    it('should add profile', () => {
      const next = addVoiceProfile(state, 'p1', 'lyric_prosaic', 'unmistakable', 'consistent', 'desc', 0.7, 0.9, 1);
      expect(next.profiles.size).toBe(1);
      expect(next.totalProfiles).toBe(1);
    });
  });

  describe('addVoiceProfileLayer', () => {
    it('should add layer', () => {
      let next = addVoiceProfile(state, 'p1', 'lyric_prosaic', 'unmistakable', 'consistent', 'desc', 0.7, 0.9, 1);
      next = addVoiceProfileLayer(next, 'l1', ['p1']);
      expect(next.totalLayers).toBe(1);
    });
  });

  describe('getVoiceProfilesByAxis', () => {
    it('should filter by axis', () => {
      let next = addVoiceProfile(state, 'p1', 'lyric_prosaic', 'unmistakable', 'consistent', 'desc', 0.7, 0.9, 1);
      next = addVoiceProfile(next, 'p2', 'hot_cold', 'unmistakable', 'consistent', 'desc', 0.7, 0.9, 1);
      const lyric = getVoiceProfilesByAxis(next, 'lyric_prosaic');
      expect(lyric.length).toBe(1);
    });
  });

  describe('getVoiceProfileReport', () => {
    it('should return comprehensive report', () => {
      const report = getVoiceProfileReport(state);
      expect(report.totalProfiles).toBe(0);
      expect(typeof report.voiceProfileMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getVoiceProfileReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeVoiceProfileEngineState', () => {
    it('should reset all state', () => {
      let next = addVoiceProfile(state, 'p1', 'lyric_prosaic', 'unmistakable', 'consistent', 'desc', 0.7, 0.9, 1);
      next = resetNarrativeVoiceProfileEngineState();
      expect(next.profiles.size).toBe(0);
      expect(next.totalProfiles).toBe(0);
    });
  });
});