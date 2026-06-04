/**
 * V679 NarrativeVoiceEngine Tests — Direction C Iter 7/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeVoiceState,
  createVoiceProfile,
  trackVoiceUsage,
  setActiveProfile,
  getProfileById,
  getProfilesByTone,
  getSceneUsage,
  computeVoiceConsistency,
  getVoiceReport,
  resetNarrativeVoiceState,
  type NarrativeVoiceState,
} from './NarrativeVoiceEngine';

describe('NarrativeVoiceEngine', () => {
  let state: NarrativeVoiceState;

  beforeEach(() => { state = createNarrativeVoiceState(); });

  describe('createNarrativeVoiceState', () => {
    it('should initialize with defaults', () => {
      expect(state.profiles.size).toBe(0);
      expect(state.usages.size).toBe(0);
      expect(state.activeProfile).toBeNull();
    });

    it('should have default consistency', () => {
      expect(state.averageConsistency).toBe(0.8);
    });
  });

  describe('createVoiceProfile', () => {
    it('should create profile', () => {
      const next = createVoiceProfile(state, 'p1', 'Narrator', 'third_limited', 'formal');
      expect(next.profiles.size).toBe(1);
      expect(next.totalProfiles).toBe(1);
    });

    it('should set profile properties', () => {
      const next = createVoiceProfile(state, 'p1', 'Hero', 'first', 'casual', 'concise', 0.8, 0.6, 0.4);
      const profile = next.profiles.get('p1');
      expect(profile?.pov).toBe('first');
      expect(profile?.lexicalDiversity).toBe(0.8);
    });
  });

  describe('trackVoiceUsage', () => {
    it('should track usage', () => {
      let next = createVoiceProfile(state, 'p1', 'Narrator', 'third_limited', 'formal');
      next = trackVoiceUsage(next, 'scene1', 'p1', 0.9, ['minor deviation']);
      expect(next.usages.size).toBe(1);
    });
  });

  describe('setActiveProfile', () => {
    it('should set active profile', () => {
      const next = setActiveProfile(state, 'p1');
      expect(next.activeProfile).toBe('p1');
    });
  });

  describe('getProfileById', () => {
    it('should return profile', () => {
      let next = createVoiceProfile(state, 'p1', 'Narrator', 'third_limited', 'formal');
      const profile = getProfileById(next, 'p1');
      expect(profile?.name).toBe('Narrator');
    });

    it('should return null for unknown', () => {
      const profile = getProfileById(state, 'unknown');
      expect(profile).toBeNull();
    });
  });

  describe('getProfilesByTone', () => {
    it('should filter by tone', () => {
      let next = createVoiceProfile(state, 'p1', 'P1', 'third_limited', 'formal');
      next = createVoiceProfile(next, 'p2', 'P2', 'third_limited', 'casual');
      const formalProfiles = getProfilesByTone(next, 'formal');
      expect(formalProfiles.length).toBe(1);
    });
  });

  describe('getSceneUsage', () => {
    it('should return usage', () => {
      let next = createVoiceProfile(state, 'p1', 'Narrator', 'third_limited', 'formal');
      next = trackVoiceUsage(next, 'scene1', 'p1', 0.9);
      const usage = getSceneUsage(next, 'scene1');
      expect(usage?.consistency).toBe(0.9);
    });

    it('should return null for unknown scene', () => {
      const usage = getSceneUsage(state, 'unknown');
      expect(usage).toBeNull();
    });
  });

  describe('computeVoiceConsistency', () => {
    it('should return default for no usages', () => {
      expect(computeVoiceConsistency(state)).toBe(0.8);
    });

    it('should average usage consistency', () => {
      let next = createVoiceProfile(state, 'p1', 'P1', 'third_limited', 'formal');
      next = trackVoiceUsage(next, 'scene1', 'p1', 0.8);
      next = trackVoiceUsage(next, 'scene2', 'p1', 0.9);
      expect(computeVoiceConsistency(next)).toBeCloseTo(0.85, 5);
    });
  });

  describe('getVoiceReport', () => {
    it('should return comprehensive report', () => {
      const report = getVoiceReport(state);
      expect(typeof report.averageConsistency).toBe('number');
      expect(typeof report.voiceDiversity).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getVoiceReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeVoiceState', () => {
    it('should reset all state', () => {
      let next = createVoiceProfile(state, 'p1', 'Narrator', 'third_limited', 'formal');
      next = setActiveProfile(next, 'p1');
      next = resetNarrativeVoiceState();
      expect(next.profiles.size).toBe(0);
      expect(next.activeProfile).toBeNull();
    });
  });
});