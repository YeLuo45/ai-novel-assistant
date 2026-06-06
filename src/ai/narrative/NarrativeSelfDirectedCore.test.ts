/**
 * V985 NarrativeSelfDirectedCore Tests — Direction A Iter 10/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeSelfDirectedCoreState,
  addExplorationStep,
  addKnowledgeItemSD,
  applyKnowledgeSD,
  getStepsByStrategy,
  getSelfDirectedReport,
  resetNarrativeSelfDirectedCoreState,
  type NarrativeSelfDirectedCoreState,
} from './NarrativeSelfDirectedCore';

describe('NarrativeSelfDirectedCore', () => {
  let state: NarrativeSelfDirectedCoreState;

  beforeEach(() => { state = createNarrativeSelfDirectedCoreState(); });

  describe('createNarrativeSelfDirectedCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.steps.size).toBe(0);
      expect(state.knowledge.size).toBe(0);
    });
  });

  describe('addExplorationStep', () => {
    it('should add step', () => {
      const next = addExplorationStep(state, 's1', 'epsilon_greedy', 'self', 'high', 's', 'a', 'o', 0.7, 0.8, 1);
      expect(next.steps.size).toBe(1);
      expect(next.totalSteps).toBe(1);
    });
  });

  describe('addKnowledgeItemSD', () => {
    it('should add knowledge', () => {
      const next = addKnowledgeItemSD(state, 'k1', 'insight', 0.7, 0.8);
      expect(next.totalKnowledge).toBe(1);
    });
  });

  describe('applyKnowledgeSD', () => {
    it('should apply', () => {
      let next = addKnowledgeItemSD(state, 'k1', 'insight', 0.7, 0.8);
      next = applyKnowledgeSD(next, 'k1');
      expect(next.knowledge.get('k1')?.applications).toBe(1);
    });
  });

  describe('getStepsByStrategy', () => {
    it('should filter by strategy', () => {
      let next = addExplorationStep(state, 's1', 'epsilon_greedy', 'self', 'high', 's', 'a', 'o', 0.7, 0.8, 1);
      next = addExplorationStep(next, 's2', 'ucb', 'self', 'high', 's', 'a', 'o', 0.7, 0.8, 1);
      const eps = getStepsByStrategy(next, 'epsilon_greedy');
      expect(eps.length).toBe(1);
    });
  });

  describe('getSelfDirectedReport', () => {
    it('should return comprehensive report', () => {
      const report = getSelfDirectedReport(state);
      expect(report.totalSteps).toBe(0);
      expect(typeof report.selfDirectedMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getSelfDirectedReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeSelfDirectedCoreState', () => {
    it('should reset all state', () => {
      let next = addExplorationStep(state, 's1', 'epsilon_greedy', 'self', 'high', 's', 'a', 'o', 0.7, 0.8, 1);
      next = resetNarrativeSelfDirectedCoreState();
      expect(next.steps.size).toBe(0);
      expect(next.totalSteps).toBe(0);
    });
  });
});