/**
 * V1053 CharacterAestheticsEngine Tests — Direction C Iter 14/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCharacterAestheticsEngineState,
  addCharacterAesthetic,
  addAestheticPresence,
  getAestheticsByQuality,
  getCharacterAestheticsReport,
  resetCharacterAestheticsEngineState,
  type CharacterAestheticsEngineState,
} from './CharacterAestheticsEngine';

describe('CharacterAestheticsEngine', () => {
  let state: CharacterAestheticsEngineState;

  beforeEach(() => { state = createCharacterAestheticsEngineState(); });

  describe('createCharacterAestheticsEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.aesthetics.size).toBe(0);
      expect(state.presences.size).toBe(0);
    });
  });

  describe('addCharacterAesthetic', () => {
    it('should add aesthetic', () => {
      const next = addCharacterAesthetic(state, 'a1', 'charisma', 'commanding', 'deep', 'c1', 'desc', 0.9, 0.85, 1);
      expect(next.aesthetics.size).toBe(1);
      expect(next.totalAesthetics).toBe(1);
    });
  });

  describe('addAestheticPresence', () => {
    it('should add presence', () => {
      let next = addCharacterAesthetic(state, 'a1', 'charisma', 'commanding', 'deep', 'c1', 'desc', 0.9, 0.85, 1);
      next = addAestheticPresence(next, 'p1', 'c1', ['a1']);
      expect(next.totalPresences).toBe(1);
    });
  });

  describe('getAestheticsByQuality', () => {
    it('should filter by quality', () => {
      let next = addCharacterAesthetic(state, 'a1', 'charisma', 'commanding', 'deep', 'c1', 'desc', 0.9, 0.85, 1);
      next = addCharacterAesthetic(next, 'a2', 'grace', 'commanding', 'deep', 'c1', 'desc', 0.9, 0.85, 1);
      const charisma = getAestheticsByQuality(next, 'charisma');
      expect(charisma.length).toBe(1);
    });
  });

  describe('getCharacterAestheticsReport', () => {
    it('should return comprehensive report', () => {
      const report = getCharacterAestheticsReport(state);
      expect(report.totalAesthetics).toBe(0);
      expect(typeof report.characterAestheticsMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCharacterAestheticsReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetCharacterAestheticsEngineState', () => {
    it('should reset all state', () => {
      let next = addCharacterAesthetic(state, 'a1', 'charisma', 'commanding', 'deep', 'c1', 'desc', 0.9, 0.85, 1);
      next = resetCharacterAestheticsEngineState();
      expect(next.aesthetics.size).toBe(0);
      expect(next.totalAesthetics).toBe(0);
    });
  });
});