/**
 * V1141 NarrativeRecommendationEngine Tests — Direction E Iter 18/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeRecommendationEngineState,
  addRecommendation,
  addRecommendationFlow,
  getRecommendationsByType,
  getRecommendationReport,
  resetNarrativeRecommendationEngineState,
  type NarrativeRecommendationEngineState,
} from './NarrativeRecommendationEngine';

describe('NarrativeRecommendationEngine', () => {
  let state: NarrativeRecommendationEngineState;

  beforeEach(() => { state = createNarrativeRecommendationEngineState(); });

  describe('createNarrativeRecommendationEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.recommendations.size).toBe(0);
      expect(state.flows.size).toBe(0);
    });
  });

  describe('addRecommendation', () => {
    it('should add recommendation', () => {
      const next = addRecommendation(state, 'r1', 'similar', 'compelling', 'curated', 'desc', 0.9, 0.7, 1);
      expect(next.recommendations.size).toBe(1);
      expect(next.totalRecommendations).toBe(1);
    });
  });

  describe('addRecommendationFlow', () => {
    it('should add flow', () => {
      let next = addRecommendation(state, 'r1', 'similar', 'compelling', 'curated', 'desc', 0.9, 0.7, 1);
      next = addRecommendationFlow(next, 'f1', ['r1']);
      expect(next.totalFlows).toBe(1);
    });
  });

  describe('getRecommendationsByType', () => {
    it('should filter by type', () => {
      let next = addRecommendation(state, 'r1', 'similar', 'compelling', 'curated', 'desc', 0.9, 0.7, 1);
      next = addRecommendation(next, 'r2', 'complementary', 'compelling', 'curated', 'desc', 0.9, 0.7, 1);
      const similar = getRecommendationsByType(next, 'similar');
      expect(similar.length).toBe(1);
    });
  });

  describe('getRecommendationReport', () => {
    it('should return comprehensive report', () => {
      const report = getRecommendationReport(state);
      expect(report.totalRecommendations).toBe(0);
      expect(typeof report.recommendationMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getRecommendationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeRecommendationEngineState', () => {
    it('should reset all state', () => {
      let next = addRecommendation(state, 'r1', 'similar', 'compelling', 'curated', 'desc', 0.9, 0.7, 1);
      next = resetNarrativeRecommendationEngineState();
      expect(next.recommendations.size).toBe(0);
      expect(next.totalRecommendations).toBe(0);
    });
  });
});