/**
 * V903 WorldEpistemologyEngine Tests — Direction C Iter 14/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWorldEpistemologyEngineState,
  addKnowledge,
  createBeliefSystem,
  getKnowledgeByType,
  getEpistemologyReport,
  resetWorldEpistemologyEngineState,
  type WorldEpistemologyEngineState,
} from './WorldEpistemologyEngine';

describe('WorldEpistemologyEngine', () => {
  let state: WorldEpistemologyEngineState;

  beforeEach(() => { state = createWorldEpistemologyEngineState(); });

  describe('createWorldEpistemologyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.knowledge.size).toBe(0);
      expect(state.systems.size).toBe(0);
    });
  });

  describe('addKnowledge', () => {
    it('should add knowledge', () => {
      const next = addKnowledge(state, 'k1', 'Dragons exist', 'factual', 'certain', 'verified', 'desc', 1);
      expect(next.knowledge.size).toBe(1);
      expect(next.verifiedKnowledge).toBe(1);
    });
  });

  describe('createBeliefSystem', () => {
    it('should create system', () => {
      const next = createBeliefSystem(state, 's1', 'Church of Light', ['k1'], 0.8, 1000, true);
      expect(next.totalSystems).toBe(1);
    });
  });

  describe('getKnowledgeByType', () => {
    it('should filter by type', () => {
      let next = addKnowledge(state, 'k1', 'K1', 'factual', 'certain', 'verified', 'desc', 1);
      next = addKnowledge(next, 'k2', 'K2', 'mythical', 'mythical', 'disputed', 'desc', 1);
      const factual = getKnowledgeByType(next, 'factual');
      expect(factual.length).toBe(1);
    });
  });

  describe('getEpistemologyReport', () => {
    it('should return comprehensive report', () => {
      const report = getEpistemologyReport(state);
      expect(report.totalKnowledge).toBe(0);
      expect(typeof report.epistemologicalHealth).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getEpistemologyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetWorldEpistemologyEngineState', () => {
    it('should reset all state', () => {
      let next = addKnowledge(state, 'k1', 'K1', 'factual', 'certain', 'verified', 'desc', 1);
      next = resetWorldEpistemologyEngineState();
      expect(next.knowledge.size).toBe(0);
      expect(next.totalKnowledge).toBe(0);
    });
  });
});