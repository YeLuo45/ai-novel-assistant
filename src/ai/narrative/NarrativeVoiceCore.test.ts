/**
 * V857 NarrativeVoiceCore Tests — Direction B Iter 6/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeVoiceCoreState,
  createVoiceProfile,
  addVoiceSample,
  addVoiceMarker,
  getVoiceProfilesByCharacter,
  getVoiceCoreReport,
  resetNarrativeVoiceCoreState,
  type NarrativeVoiceCoreState,
} from './NarrativeVoiceCore';

describe('NarrativeVoiceCore', () => {
  let state: NarrativeVoiceCoreState;

  beforeEach(() => { state = createNarrativeVoiceCoreState(); });

  describe('createNarrativeVoiceCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.profiles.size).toBe(0);
      expect(state.samples.size).toBe(0);
    });
  });

  describe('createVoiceProfile', () => {
    it('should create profile', () => {
      const next = createVoiceProfile(state, 'p1', 'c1', 'diction', 'strong', 'consistent');
      expect(next.profiles.size).toBe(1);
      expect(next.totalProfiles).toBe(1);
    });
  });

  describe('addVoiceSample', () => {
    it('should add sample', () => {
      const scores = new Map();
      scores.set('diction', 0.8);
      const next = addVoiceSample(state, 's1', 'c1', 'text', scores);
      expect(next.totalSamples).toBe(1);
    });
  });

  describe('addVoiceMarker', () => {
    it('should add marker', () => {
      let next = createVoiceProfile(state, 'p1', 'c1', 'diction');
      next = addVoiceMarker(next, 'p1', 'archaic terms', 'example');
      expect(next.profiles.get('p1')?.markers.length).toBe(1);
      expect(next.profiles.get('p1')?.examples.length).toBe(1);
    });
  });

  describe('getVoiceProfilesByCharacter', () => {
    it('should filter by character', () => {
      let next = createVoiceProfile(state, 'p1', 'c1', 'diction');
      next = createVoiceProfile(next, 'p2', 'c2', 'diction');
      const c1Profiles = getVoiceProfilesByCharacter(next, 'c1');
      expect(c1Profiles.length).toBe(1);
    });
  });

  describe('getVoiceCoreReport', () => {
    it('should return comprehensive report', () => {
      const report = getVoiceCoreReport(state);
      expect(report.totalProfiles).toBe(0);
      expect(typeof report.voiceMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getVoiceCoreReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeVoiceCoreState', () => {
    it('should reset all state', () => {
      let next = createVoiceProfile(state, 'p1', 'c1', 'diction');
      next = resetNarrativeVoiceCoreState();
      expect(next.profiles.size).toBe(0);
      expect(next.totalProfiles).toBe(0);
    });
  });
});