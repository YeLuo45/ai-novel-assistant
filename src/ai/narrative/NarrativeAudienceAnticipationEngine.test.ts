/**
 * V1241 NarrativeAudienceAnticipationEngine Tests — Direction H Iter 8/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAudienceAnticipationEngineState,
  addAudienceAnticipation,
  addAudienceAnticipationWave,
  getAudienceAnticipationsByType,
  getAudienceAnticipationReport,
  resetNarrativeAudienceAnticipationEngineState,
  type NarrativeAudienceAnticipationEngineState,
} from './NarrativeAudienceAnticipationEngine';

describe('NarrativeAudienceAnticipationEngine', () => {
  let state: NarrativeAudienceAnticipationEngineState;

  beforeEach(() => { state = createNarrativeAudienceAnticipationEngineState(); });

  describe('createNarrativeAudienceAnticipationEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.anticipations.size).toBe(0);
      expect(state.waves.size).toBe(0);
    });
  });

  describe('addAudienceAnticipation', () => {
    it('should add anticipation', () => {
      const next = addAudienceAnticipation(state, 'a1', 'plot', 'overwhelming', 'exceeded', 'desc', 0.95, 0.9, 1);
      expect(next.anticipations.size).toBe(1);
      expect(next.totalAnticipations).toBe(1);
    });
  });

  describe('addAudienceAnticipationWave', () => {
    it('should add wave', () => {
      let next = addAudienceAnticipation(state, 'a1', 'plot', 'overwhelming', 'exceeded', 'desc', 0.95, 0.9, 1);
      next = addAudienceAnticipationWave(next, 'w1', ['a1']);
      expect(next.totalWaves).toBe(1);
    });
  });

  describe('getAudienceAnticipationsByType', () => {
    it('should filter by type', () => {
      let next = addAudienceAnticipation(state, 'a1', 'plot', 'overwhelming', 'exceeded', 'desc', 0.95, 0.9, 1);
      next = addAudienceAnticipation(next, 'a2', 'character', 'overwhelming', 'exceeded', 'desc', 0.95, 0.9, 1);
      const plot = getAudienceAnticipationsByType(next, 'plot');
      expect(plot.length).toBe(1);
    });
  });

  describe('getAudienceAnticipationReport', () => {
    it('should return comprehensive report', () => {
      const report = getAudienceAnticipationReport(state);
      expect(report.totalAnticipations).toBe(0);
      expect(typeof report.audienceAnticipationMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAudienceAnticipationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAudienceAnticipationEngineState', () => {
    it('should reset all state', () => {
      let next = addAudienceAnticipation(state, 'a1', 'plot', 'overwhelming', 'exceeded', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeAudienceAnticipationEngineState();
      expect(next.anticipations.size).toBe(0);
      expect(next.totalAnticipations).toBe(0);
    });
  });
});