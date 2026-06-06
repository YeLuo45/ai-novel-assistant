/**
 * V1231 NarrativeAudienceSatisfactionEngine Tests — Direction H Iter 3/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAudienceSatisfactionEngineState,
  addAudienceSatisfaction,
  addAudienceSatisfactionLayer,
  getAudienceSatisfactionsByType,
  getAudienceSatisfactionReport,
  resetNarrativeAudienceSatisfactionEngineState,
  type NarrativeAudienceSatisfactionEngineState,
} from './NarrativeAudienceSatisfactionEngine';

describe('NarrativeAudienceSatisfactionEngine', () => {
  let state: NarrativeAudienceSatisfactionEngineState;

  beforeEach(() => { state = createNarrativeAudienceSatisfactionEngineState(); });

  describe('createNarrativeAudienceSatisfactionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.satisfactions.size).toBe(0);
      expect(state.layers.size).toBe(0);
    });
  });

  describe('addAudienceSatisfaction', () => {
    it('should add satisfaction', () => {
      const next = addAudienceSatisfaction(state, 's1', 'aesthetic', 'deep', 'permanent', 'desc', 0.9, 0.85, 1);
      expect(next.satisfactions.size).toBe(1);
      expect(next.totalSatisfactions).toBe(1);
    });
  });

  describe('addAudienceSatisfactionLayer', () => {
    it('should add layer', () => {
      let next = addAudienceSatisfaction(state, 's1', 'aesthetic', 'deep', 'permanent', 'desc', 0.9, 0.85, 1);
      next = addAudienceSatisfactionLayer(next, 'l1', ['s1']);
      expect(next.totalLayers).toBe(1);
    });
  });

  describe('getAudienceSatisfactionsByType', () => {
    it('should filter by type', () => {
      let next = addAudienceSatisfaction(state, 's1', 'aesthetic', 'deep', 'permanent', 'desc', 0.9, 0.85, 1);
      next = addAudienceSatisfaction(next, 's2', 'emotional', 'deep', 'permanent', 'desc', 0.9, 0.85, 1);
      const aesthetic = getAudienceSatisfactionsByType(next, 'aesthetic');
      expect(aesthetic.length).toBe(1);
    });
  });

  describe('getAudienceSatisfactionReport', () => {
    it('should return comprehensive report', () => {
      const report = getAudienceSatisfactionReport(state);
      expect(report.totalSatisfactions).toBe(0);
      expect(typeof report.audienceSatisfactionMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAudienceSatisfactionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAudienceSatisfactionEngineState', () => {
    it('should reset all state', () => {
      let next = addAudienceSatisfaction(state, 's1', 'aesthetic', 'deep', 'permanent', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeAudienceSatisfactionEngineState();
      expect(next.satisfactions.size).toBe(0);
      expect(next.totalSatisfactions).toBe(0);
    });
  });
});