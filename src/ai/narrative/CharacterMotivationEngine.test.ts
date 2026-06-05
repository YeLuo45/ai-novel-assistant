/**
 * V851 CharacterMotivationEngine Tests — Direction B Iter 3/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCharacterMotivationEngineState,
  addMotivation,
  activateMotivation,
  createMotivationConflict,
  resolveMotivationConflict,
  getMotivationsByCharacter,
  getMotivationReport,
  resetCharacterMotivationEngineState,
  type CharacterMotivationEngineState,
} from './CharacterMotivationEngine';

describe('CharacterMotivationEngine', () => {
  let state: CharacterMotivationEngineState;

  beforeEach(() => { state = createCharacterMotivationEngineState(); });

  describe('createCharacterMotivationEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.motivations.size).toBe(0);
      expect(state.conflicts.size).toBe(0);
    });
  });

  describe('addMotivation', () => {
    it('should add motivation', () => {
      const next = addMotivation(state, 'm1', 'c1', 'need', 'to find love', 'love', 5, 'strong', 0.7);
      expect(next.motivations.size).toBe(1);
      expect(next.totalMotivations).toBe(1);
    });

    it('should clamp intensity', () => {
      const next = addMotivation(state, 'm1', 'c1', 'need', 'desc', 'target', 5, 'strong', 1.5);
      expect(next.motivations.get('m1')?.intensity).toBe(1);
    });
  });

  describe('activateMotivation', () => {
    it('should activate', () => {
      let next = addMotivation(state, 'm1', 'c1', 'need', 'desc', 'target', 5);
      next = activateMotivation(next, 'm1');
      expect(next.motivations.get('m1')?.status).toBe('active');
    });
  });

  describe('createMotivationConflict', () => {
    it('should create conflict', () => {
      const next = createMotivationConflict(state, 'c1', 'm1', 'm2', 0.8);
      expect(next.totalConflicts).toBe(1);
    });
  });

  describe('resolveMotivationConflict', () => {
    it('should resolve', () => {
      let next = createMotivationConflict(state, 'c1', 'm1', 'm2', 0.8);
      next = resolveMotivationConflict(next, 'c1', 'resolved by growth');
      expect(next.conflicts.get('c1')?.resolved).toBe(true);
      expect(next.resolvedConflicts).toBe(1);
    });
  });

  describe('getMotivationsByCharacter', () => {
    it('should filter by character', () => {
      let next = addMotivation(state, 'm1', 'c1', 'need', 'desc', 'target', 5);
      next = addMotivation(next, 'm2', 'c2', 'need', 'desc', 'target', 5);
      const c1Motivations = getMotivationsByCharacter(next, 'c1');
      expect(c1Motivations.length).toBe(1);
    });
  });

  describe('getMotivationReport', () => {
    it('should return comprehensive report', () => {
      const report = getMotivationReport(state);
      expect(report.totalMotivations).toBe(0);
      expect(typeof report.characterDrive).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getMotivationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetCharacterMotivationEngineState', () => {
    it('should reset all state', () => {
      let next = addMotivation(state, 'm1', 'c1', 'need', 'desc', 'target', 5);
      next = resetCharacterMotivationEngineState();
      expect(next.motivations.size).toBe(0);
      expect(next.totalMotivations).toBe(0);
    });
  });
});