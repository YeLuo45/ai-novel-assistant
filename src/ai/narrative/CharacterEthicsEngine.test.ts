/**
 * V1045 CharacterEthicsEngine Tests — Direction C Iter 10/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCharacterEthicsEngineState,
  addCharacterEthics,
  addEthicalArc,
  getEthicsByFramework,
  getEthicsReport,
  resetCharacterEthicsEngineState,
  type CharacterEthicsEngineState,
} from './CharacterEthicsEngine';

describe('CharacterEthicsEngine', () => {
  let state: CharacterEthicsEngineState;

  beforeEach(() => { state = createCharacterEthicsEngineState(); });

  describe('createCharacterEthicsEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.ethics.size).toBe(0);
      expect(state.arcs.size).toBe(0);
    });
  });

  describe('addCharacterEthics', () => {
    it('should add ethics', () => {
      const next = addCharacterEthics(state, 'e1', 'virtue', 'truth_vs_loyalty', 'principled', 'c1', 'desc', 0.8, 0.7, 1);
      expect(next.ethics.size).toBe(1);
      expect(next.totalEthics).toBe(1);
    });
  });

  describe('addEthicalArc', () => {
    it('should add arc', () => {
      let next = addCharacterEthics(state, 'e1', 'virtue', 'truth_vs_loyalty', 'principled', 'c1', 'desc', 0.8, 0.7, 1);
      next = addEthicalArc(next, 'a1', 'c1', ['e1']);
      expect(next.totalArcs).toBe(1);
    });
  });

  describe('getEthicsByFramework', () => {
    it('should filter by framework', () => {
      let next = addCharacterEthics(state, 'e1', 'virtue', 'truth_vs_loyalty', 'principled', 'c1', 'desc', 0.8, 0.7, 1);
      next = addCharacterEthics(next, 'e2', 'deontological', 'truth_vs_loyalty', 'principled', 'c1', 'desc', 0.8, 0.7, 1);
      const virtue = getEthicsByFramework(next, 'virtue');
      expect(virtue.length).toBe(1);
    });
  });

  describe('getEthicsReport', () => {
    it('should return comprehensive report', () => {
      const report = getEthicsReport(state);
      expect(report.totalEthics).toBe(0);
      expect(typeof report.ethicsMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getEthicsReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetCharacterEthicsEngineState', () => {
    it('should reset all state', () => {
      let next = addCharacterEthics(state, 'e1', 'virtue', 'truth_vs_loyalty', 'principled', 'c1', 'desc', 0.8, 0.7, 1);
      next = resetCharacterEthicsEngineState();
      expect(next.ethics.size).toBe(0);
      expect(next.totalEthics).toBe(0);
    });
  });
});