/**
 * V1037 CharacterPhenomenologyEngine Tests — Direction C Iter 6/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCharacterPhenomenologyEngineState,
  addPhenomenon,
  addPhenomenologicalLayer,
  getPhenomenaByMode,
  getPhenomenologyReport,
  resetCharacterPhenomenologyEngineState,
  type CharacterPhenomenologyEngineState,
} from './CharacterPhenomenologyEngine';

describe('CharacterPhenomenologyEngine', () => {
  let state: CharacterPhenomenologyEngineState;

  beforeEach(() => { state = createCharacterPhenomenologyEngineState(); });

  describe('createCharacterPhenomenologyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.phenomena.size).toBe(0);
      expect(state.layers.size).toBe(0);
    });
  });

  describe('addPhenomenon', () => {
    it('should add phenomenon', () => {
      const next = addPhenomenon(state, 'p1', 'perception', 'deep', 'reveal', 'c1', 'desc', 0.8, 0.9, 1);
      expect(next.phenomena.size).toBe(1);
      expect(next.totalPhenomena).toBe(1);
    });
  });

  describe('addPhenomenologicalLayer', () => {
    it('should add layer', () => {
      let next = addPhenomenon(state, 'p1', 'perception', 'deep', 'reveal', 'c1', 'desc', 0.8, 0.9, 1);
      next = addPhenomenologicalLayer(next, 'l1', ['p1']);
      expect(next.totalLayers).toBe(1);
    });
  });

  describe('getPhenomenaByMode', () => {
    it('should filter by mode', () => {
      let next = addPhenomenon(state, 'p1', 'perception', 'deep', 'reveal', 'c1', 'desc', 0.8, 0.9, 1);
      next = addPhenomenon(next, 'p2', 'emotion', 'deep', 'reveal', 'c1', 'desc', 0.8, 0.9, 1);
      const perc = getPhenomenaByMode(next, 'perception');
      expect(perc.length).toBe(1);
    });
  });

  describe('getPhenomenologyReport', () => {
    it('should return comprehensive report', () => {
      const report = getPhenomenologyReport(state);
      expect(report.totalPhenomena).toBe(0);
      expect(typeof report.phenomenologyMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getPhenomenologyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetCharacterPhenomenologyEngineState', () => {
    it('should reset all state', () => {
      let next = addPhenomenon(state, 'p1', 'perception', 'deep', 'reveal', 'c1', 'desc', 0.8, 0.9, 1);
      next = resetCharacterPhenomenologyEngineState();
      expect(next.phenomena.size).toBe(0);
      expect(next.totalPhenomena).toBe(0);
    });
  });
});