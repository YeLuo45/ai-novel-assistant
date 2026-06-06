/**
 * V1061 CharacterSociologyEngine Tests — Direction C Iter 18/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCharacterSociologyEngineState,
  addCharacterSocial,
  addSocialPosition,
  getSocialsByClass,
  getSociologyReport,
  resetCharacterSociologyEngineState,
  type CharacterSociologyEngineState,
} from './CharacterSociologyEngine';

describe('CharacterSociologyEngine', () => {
  let state: CharacterSociologyEngineState;

  beforeEach(() => { state = createCharacterSociologyEngineState(); });

  describe('createCharacterSociologyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.socials.size).toBe(0);
      expect(state.positions.size).toBe(0);
    });
  });

  describe('addCharacterSocial', () => {
    it('should add social', () => {
      const next = addCharacterSocial(state, 's1', 'aristocracy', 'leader', 'kinship', 'c1', 'desc', 0.8, 0.5, 1);
      expect(next.socials.size).toBe(1);
      expect(next.totalSocials).toBe(1);
    });
  });

  describe('addSocialPosition', () => {
    it('should add position', () => {
      let next = addCharacterSocial(state, 's1', 'aristocracy', 'leader', 'kinship', 'c1', 'desc', 0.8, 0.5, 1);
      next = addSocialPosition(next, 'p1', 'c1', ['s1']);
      expect(next.totalPositions).toBe(1);
    });
  });

  describe('getSocialsByClass', () => {
    it('should filter by class', () => {
      let next = addCharacterSocial(state, 's1', 'aristocracy', 'leader', 'kinship', 'c1', 'desc', 0.8, 0.5, 1);
      next = addCharacterSocial(next, 's2', 'working', 'leader', 'kinship', 'c1', 'desc', 0.8, 0.5, 1);
      const aristo = getSocialsByClass(next, 'aristocracy');
      expect(aristo.length).toBe(1);
    });
  });

  describe('getSociologyReport', () => {
    it('should return comprehensive report', () => {
      const report = getSociologyReport(state);
      expect(report.totalSocials).toBe(0);
      expect(typeof report.sociologyMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getSociologyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetCharacterSociologyEngineState', () => {
    it('should reset all state', () => {
      let next = addCharacterSocial(state, 's1', 'aristocracy', 'leader', 'kinship', 'c1', 'desc', 0.8, 0.5, 1);
      next = resetCharacterSociologyEngineState();
      expect(next.socials.size).toBe(0);
      expect(next.totalSocials).toBe(0);
    });
  });
});