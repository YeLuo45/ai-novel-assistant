/**
 * V761 CharacterPsychologyEngine Tests — Direction B Iter 3/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCharacterPsychologyEngineState,
  createPsychologyCharacter,
  addDefenseMechanism,
  addPsychologicalElement,
  addPsychologyInsight,
  updatePsychologicalState,
  getInsightsByCategory,
  getPsychologyReport,
  resetCharacterPsychologyEngineState,
  type CharacterPsychologyEngineState,
} from './CharacterPsychologyEngine';

describe('CharacterPsychologyEngine', () => {
  let state: CharacterPsychologyEngineState;

  beforeEach(() => { state = createCharacterPsychologyEngineState(); });

  describe('createCharacterPsychologyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.characters.size).toBe(0);
      expect(state.psychologicalHealth).toBe(0.7);
    });
  });

  describe('createPsychologyCharacter', () => {
    it('should create character', () => {
      const next = createPsychologyCharacter(state, 'c1', 'Alice', { openness: 0.8 }, ['truth']);
      expect(next.characters.size).toBe(1);
      expect(next.totalCharacters).toBe(1);
    });

    it('should fill missing traits', () => {
      const next = createPsychologyCharacter(state, 'c1', 'Alice', { openness: 0.8 });
      expect(next.characters.get('c1')?.traits.get('conscientiousness')).toBe(0.5);
    });
  });

  describe('addDefenseMechanism', () => {
    it('should add defense', () => {
      let next = createPsychologyCharacter(state, 'c1', 'Alice');
      next = addDefenseMechanism(next, 'c1', 'humor', 0.8);
      expect(next.characters.get('c1')?.defenses.get('humor')).toBe(0.8);
    });

    it('should return state for unknown character', () => {
      const next = addDefenseMechanism(state, 'unknown', 'humor', 0.5);
      expect(next.totalCharacters).toBe(0);
    });
  });

  describe('addPsychologicalElement', () => {
    it('should add shadow', () => {
      let next = createPsychologyCharacter(state, 'c1', 'Alice');
      next = addPsychologicalElement(next, 'c1', 'shadow', 'fear of abandonment');
      expect(next.characters.get('c1')?.shadow.length).toBe(1);
    });
  });

  describe('addPsychologyInsight', () => {
    it('should add insight', () => {
      let next = createPsychologyCharacter(state, 'c1', 'Alice');
      next = addPsychologyInsight(next, 'i1', 'c1', 'Alice fears being alone', 'fear', 0.8);
      expect(next.totalInsights).toBe(1);
    });
  });

  describe('updatePsychologicalState', () => {
    it('should update state', () => {
      let next = createPsychologyCharacter(state, 'c1', 'Alice');
      next = updatePsychologicalState(next, 'c1', 'transforming');
      expect(next.characters.get('c1')?.state).toBe('transforming');
    });
  });

  describe('getInsightsByCategory', () => {
    it('should filter by category', () => {
      let next = createPsychologyCharacter(state, 'c1', 'Alice');
      next = addPsychologyInsight(next, 'i1', 'c1', 'desc1', 'fear', 0.8);
      next = addPsychologyInsight(next, 'i2', 'c1', 'desc2', 'desire', 0.6);
      const fears = getInsightsByCategory(next, 'fear');
      expect(fears.length).toBe(1);
    });
  });

  describe('getPsychologyReport', () => {
    it('should return comprehensive report', () => {
      const report = getPsychologyReport(state);
      expect(report.totalCharacters).toBe(0);
      expect(typeof report.psychologicalHealth).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getPsychologyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetCharacterPsychologyEngineState', () => {
    it('should reset all state', () => {
      let next = createPsychologyCharacter(state, 'c1', 'Alice');
      next = resetCharacterPsychologyEngineState();
      expect(next.characters.size).toBe(0);
      expect(next.totalCharacters).toBe(0);
    });
  });
});