/**
 * V1233 NarrativeAudienceRetentionEngine Tests — Direction H Iter 4/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAudienceRetentionEngineState,
  addAudienceRetention,
  addAudienceRetentionWave,
  getAudienceRetentionsByType,
  getAudienceRetentionReport,
  resetNarrativeAudienceRetentionEngineState,
  type NarrativeAudienceRetentionEngineState,
} from './NarrativeAudienceRetentionEngine';

describe('NarrativeAudienceRetentionEngine', () => {
  let state: NarrativeAudienceRetentionEngineState;

  beforeEach(() => { state = createNarrativeAudienceRetentionEngineState(); });

  describe('createNarrativeAudienceRetentionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.retentions.size).toBe(0);
      expect(state.waves.size).toBe(0);
    });
  });

  describe('addAudienceRetention', () => {
    it('should add retention', () => {
      const next = addAudienceRetention(state, 'r1', 'generational', 'unbreakable', 'connection', 'desc', 0.95, 0.9, 1);
      expect(next.retentions.size).toBe(1);
      expect(next.totalRetentions).toBe(1);
    });
  });

  describe('addAudienceRetentionWave', () => {
    it('should add wave', () => {
      let next = addAudienceRetention(state, 'r1', 'generational', 'unbreakable', 'connection', 'desc', 0.95, 0.9, 1);
      next = addAudienceRetentionWave(next, 'w1', ['r1']);
      expect(next.totalWaves).toBe(1);
    });
  });

  describe('getAudienceRetentionsByType', () => {
    it('should filter by type', () => {
      let next = addAudienceRetention(state, 'r1', 'generational', 'unbreakable', 'connection', 'desc', 0.95, 0.9, 1);
      next = addAudienceRetention(next, 'r2', 'initial', 'unbreakable', 'connection', 'desc', 0.95, 0.9, 1);
      const gen = getAudienceRetentionsByType(next, 'generational');
      expect(gen.length).toBe(1);
    });
  });

  describe('getAudienceRetentionReport', () => {
    it('should return comprehensive report', () => {
      const report = getAudienceRetentionReport(state);
      expect(report.totalRetentions).toBe(0);
      expect(typeof report.audienceRetentionMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAudienceRetentionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAudienceRetentionEngineState', () => {
    it('should reset all state', () => {
      let next = addAudienceRetention(state, 'r1', 'generational', 'unbreakable', 'connection', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeAudienceRetentionEngineState();
      expect(next.retentions.size).toBe(0);
      expect(next.totalRetentions).toBe(0);
    });
  });
});