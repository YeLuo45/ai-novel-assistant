/**
 * V671 CharacterMotivationEngine Tests — Direction C Iter 3/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCharacterMotivationState,
  addMotivation,
  activateMotivation,
  setMotivationState,
  detectMotivationConflicts,
  getCharacterMotivations,
  getStrongestMotivation,
  getMotivationReport,
  resetCharacterMotivationState,
  type CharacterMotivationState,
} from './CharacterMotivationEngine';

describe('CharacterMotivationEngine', () => {
  let state: CharacterMotivationState;

  beforeEach(() => { state = createCharacterMotivationState(); });

  describe('createCharacterMotivationState', () => {
    it('should initialize with defaults', () => {
      expect(state.motivations.size).toBe(0);
      expect(state.characters.size).toBe(0);
      expect(state.totalMotivations).toBe(0);
    });

    it('should have default average strength', () => {
      expect(state.averageStrength).toBe(0.5);
    });
  });

  describe('addMotivation', () => {
    it('should add motivation', () => {
      const next = addMotivation(state, 'm1', 'alice', 'goal', 'Save the kingdom', 'strong', 3);
      expect(next.motivations.size).toBe(1);
      expect(next.characters.size).toBe(1);
      expect(next.totalMotivations).toBe(1);
    });

    it('should use default values', () => {
      const next = addMotivation(state, 'm1', 'alice', 'goal', 'Default goal');
      expect(next.motivations.get('m1')?.strength).toBe('moderate');
      expect(next.motivations.get('m1')?.priority).toBe(1);
    });
  });

  describe('activateMotivation', () => {
    it('should activate motivation', () => {
      let next = addMotivation(state, 'm1', 'alice', 'goal', 'Find treasure', 'strong', 3);
      next = activateMotivation(next, 'm1', 'map discovery');
      expect(next.motivations.get('m1')?.state).toBe('active');
      expect(next.motivations.get('m1')?.triggeredBy).toContain('map discovery');
    });

    it('should return state for unknown motivation', () => {
      const next = activateMotivation(state, 'unknown', 'trigger');
      expect(next.activeMotivations).toBe(0);
    });
  });

  describe('setMotivationState', () => {
    it('should set state', () => {
      let next = addMotivation(state, 'm1', 'alice', 'goal', 'Goal', 'strong', 3);
      next = setMotivationState(next, 'm1', 'resolved', 'goal achieved');
      expect(next.motivations.get('m1')?.state).toBe('resolved');
      expect(next.motivations.get('m1')?.resolvedBy).toContain('goal achieved');
    });
  });

  describe('detectMotivationConflicts', () => {
    it('should detect goal-fear conflict', () => {
      let next = addMotivation(state, 'm1', 'alice', 'goal', 'Be brave', 'strong', 3);
      next = addMotivation(next, 'm2', 'alice', 'fear', 'Fear of death', 'strong', 3);
      next = activateMotivation(next, 'm1', 'challenge');
      next = activateMotivation(next, 'm2', 'danger');
      expect(next.conflicts).toBeGreaterThanOrEqual(1);
    });

    it('should not count inactive conflicts', () => {
      let next = addMotivation(state, 'm1', 'alice', 'goal', 'Be brave', 'strong', 3);
      next = addMotivation(next, 'm2', 'alice', 'fear', 'Fear of death', 'strong', 3);
      expect(next.conflicts).toBe(0);
    });
  });

  describe('getCharacterMotivations', () => {
    it('should return motivations for character', () => {
      let next = addMotivation(state, 'm1', 'alice', 'goal', 'Goal 1');
      next = addMotivation(next, 'm2', 'bob', 'goal', 'Goal 2');
      const aliceMotivations = getCharacterMotivations(next, 'alice');
      expect(aliceMotivations.length).toBe(1);
    });

    it('should return empty for unknown character', () => {
      const motivations = getCharacterMotivations(state, 'unknown');
      expect(motivations).toEqual([]);
    });
  });

  describe('getStrongestMotivation', () => {
    it('should return null for empty state', () => {
      const strongest = getStrongestMotivation(state);
      expect(strongest).toBeNull();
    });

    it('should return highest scoring motivation', () => {
      let next = addMotivation(state, 'm1', 'alice', 'goal', 'Weak goal', 'weak', 1);
      next = addMotivation(next, 'm2', 'alice', 'goal', 'Strong goal', 'overwhelming', 5);
      const strongest = getStrongestMotivation(next);
      expect(strongest?.motivationId).toBe('m2');
    });
  });

  describe('getMotivationReport', () => {
    it('should return comprehensive report', () => {
      const report = getMotivationReport(state);
      expect(report.totalMotivations).toBe(0);
      expect(typeof report.motivationComplexity).toBe('number');
    });

    it('should include recommendations', () => {
      const report = getMotivationReport(state);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('resetCharacterMotivationState', () => {
    it('should reset all state', () => {
      let next = addMotivation(state, 'm1', 'alice', 'goal', 'Goal', 'strong', 3);
      next = resetCharacterMotivationState();
      expect(next.motivations.size).toBe(0);
      expect(next.characters.size).toBe(0);
    });
  });
});