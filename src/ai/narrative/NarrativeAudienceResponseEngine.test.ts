/**
 * V1237 NarrativeAudienceResponseEngine Tests — Direction H Iter 6/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAudienceResponseEngineState,
  addAudienceResponse,
  addAudienceResponseWave,
  getAudienceResponsesByType,
  getAudienceResponseReport,
  resetNarrativeAudienceResponseEngineState,
  type NarrativeAudienceResponseEngineState,
} from './NarrativeAudienceResponseEngine';

describe('NarrativeAudienceResponseEngine', () => {
  let state: NarrativeAudienceResponseEngineState;

  beforeEach(() => { state = createNarrativeAudienceResponseEngineState(); });

  describe('createNarrativeAudienceResponseEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.responses.size).toBe(0);
      expect(state.waves.size).toBe(0);
    });
  });

  describe('addAudienceResponse', () => {
    it('should add response', () => {
      const next = addAudienceResponse(state, 'r1', 'transformative', 'overwhelming', 'social', 'desc', 0.95, 0.9, 1);
      expect(next.responses.size).toBe(1);
      expect(next.totalResponses).toBe(1);
    });
  });

  describe('addAudienceResponseWave', () => {
    it('should add wave', () => {
      let next = addAudienceResponse(state, 'r1', 'transformative', 'overwhelming', 'social', 'desc', 0.95, 0.9, 1);
      next = addAudienceResponseWave(next, 'w1', ['r1']);
      expect(next.totalWaves).toBe(1);
    });
  });

  describe('getAudienceResponsesByType', () => {
    it('should filter by type', () => {
      let next = addAudienceResponse(state, 'r1', 'transformative', 'overwhelming', 'social', 'desc', 0.95, 0.9, 1);
      next = addAudienceResponse(next, 'r2', 'reactive', 'overwhelming', 'social', 'desc', 0.95, 0.9, 1);
      const transformative = getAudienceResponsesByType(next, 'transformative');
      expect(transformative.length).toBe(1);
    });
  });

  describe('getAudienceResponseReport', () => {
    it('should return comprehensive report', () => {
      const report = getAudienceResponseReport(state);
      expect(report.totalResponses).toBe(0);
      expect(typeof report.audienceResponseMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAudienceResponseReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAudienceResponseEngineState', () => {
    it('should reset all state', () => {
      let next = addAudienceResponse(state, 'r1', 'transformative', 'overwhelming', 'social', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeAudienceResponseEngineState();
      expect(next.responses.size).toBe(0);
      expect(next.totalResponses).toBe(0);
    });
  });
});