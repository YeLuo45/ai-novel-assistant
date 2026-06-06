/**
 * V889 CharacterPsychologyModelEngine Tests — Direction C Iter 7/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCharacterPsychologyModelEngineState,
  createPersonalityProfile,
  addPsychologicalEvent,
  addDefenseMechanism,
  getProfilesByCharacter,
  getPsychologyModelReport,
  resetCharacterPsychologyModelEngineState,
  type CharacterPsychologyModelEngineState,
} from './CharacterPsychologyModelEngine';

describe('CharacterPsychologyModelEngine', () => {
  let state: CharacterPsychologyModelEngineState;

  beforeEach(() => { state = createCharacterPsychologyModelEngineState(); });

  describe('createCharacterPsychologyModelEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.profiles.size).toBe(0);
      expect(state.events.size).toBe(0);
    });
  });

  describe('createPersonalityProfile', () => {
    it('should create profile', () => {
      const traits = new Map();
      traits.set('openness', 0.8);
      const next = createPersonalityProfile(state, 'p1', 'c1', traits, 'adult', 0.7, 0.8, ['humor']);
      expect(next.profiles.size).toBe(1);
      expect(next.totalProfiles).toBe(1);
    });

    it('should clamp selfEsteem', () => {
      const traits = new Map();
      traits.set('openness', 0.8);
      const next = createPersonalityProfile(state, 'p1', 'c1', traits, 'adult', 1.5);
      expect(next.profiles.get('p1')?.selfEsteem).toBe(1);
    });
  });

  describe('addPsychologicalEvent', () => {
    it('should add event', () => {
      const next = addPsychologicalEvent(state, 'e1', 'c1', 'desc', 0.7, 'humor', 'anxious', 5);
      expect(next.totalEvents).toBe(1);
    });
  });

  describe('addDefenseMechanism', () => {
    it('should add defense', () => {
      const traits = new Map();
      traits.set('openness', 0.8);
      let next = createPersonalityProfile(state, 'p1', 'c1', traits, 'adult');
      next = addDefenseMechanism(next, 'p1', 'sublimation');
      expect(next.profiles.get('p1')?.defenseMechanisms.length).toBe(1);
    });
  });

  describe('getProfilesByCharacter', () => {
    it('should filter by character', () => {
      const traits = new Map();
      traits.set('openness', 0.8);
      let next = createPersonalityProfile(state, 'p1', 'c1', traits, 'adult');
      next = createPersonalityProfile(next, 'p2', 'c2', traits, 'adult');
      const c1 = getProfilesByCharacter(next, 'c1');
      expect(c1.length).toBe(1);
    });
  });

  describe('getPsychologyModelReport', () => {
    it('should return comprehensive report', () => {
      const report = getPsychologyModelReport(state);
      expect(report.totalProfiles).toBe(0);
      expect(typeof report.characterInsight).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getPsychologyModelReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetCharacterPsychologyModelEngineState', () => {
    it('should reset all state', () => {
      const traits = new Map();
      traits.set('openness', 0.8);
      let next = createPersonalityProfile(state, 'p1', 'c1', traits, 'adult');
      next = resetCharacterPsychologyModelEngineState();
      expect(next.profiles.size).toBe(0);
      expect(next.totalProfiles).toBe(0);
    });
  });
});