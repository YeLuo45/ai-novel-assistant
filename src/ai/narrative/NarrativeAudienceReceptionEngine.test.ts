/**
 * V1235 NarrativeAudienceReceptionEngine Tests — Direction H Iter 5/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAudienceReceptionEngineState,
  addAudienceReception,
  addAudienceReceptionField,
  getAudienceReceptionsByType,
  getAudienceReceptionReport,
  resetNarrativeAudienceReceptionEngineState,
  type NarrativeAudienceReceptionEngineState,
} from './NarrativeAudienceReceptionEngine';

describe('NarrativeAudienceReceptionEngine', () => {
  let state: NarrativeAudienceReceptionEngineState;

  beforeEach(() => { state = createNarrativeAudienceReceptionEngineState(); });

  describe('createNarrativeAudienceReceptionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.receptions.size).toBe(0);
      expect(state.fields.size).toBe(0);
    });
  });

  describe('addAudienceReception', () => {
    it('should add reception', () => {
      const next = addAudienceReception(state, 'r1', 'cultural', 'ecstatic', 'universal', 'desc', 0.95, 0.9, 1);
      expect(next.receptions.size).toBe(1);
      expect(next.totalReceptions).toBe(1);
    });
  });

  describe('addAudienceReceptionField', () => {
    it('should add field', () => {
      let next = addAudienceReception(state, 'r1', 'cultural', 'ecstatic', 'universal', 'desc', 0.95, 0.9, 1);
      next = addAudienceReceptionField(next, 'f1', ['r1']);
      expect(next.totalFields).toBe(1);
    });
  });

  describe('getAudienceReceptionsByType', () => {
    it('should filter by type', () => {
      let next = addAudienceReception(state, 'r1', 'cultural', 'ecstatic', 'universal', 'desc', 0.95, 0.9, 1);
      next = addAudienceReception(next, 'r2', 'initial', 'ecstatic', 'universal', 'desc', 0.95, 0.9, 1);
      const cultural = getAudienceReceptionsByType(next, 'cultural');
      expect(cultural.length).toBe(1);
    });
  });

  describe('getAudienceReceptionReport', () => {
    it('should return comprehensive report', () => {
      const report = getAudienceReceptionReport(state);
      expect(report.totalReceptions).toBe(0);
      expect(typeof report.audienceReceptionMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAudienceReceptionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAudienceReceptionEngineState', () => {
    it('should reset all state', () => {
      let next = addAudienceReception(state, 'r1', 'cultural', 'ecstatic', 'universal', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeAudienceReceptionEngineState();
      expect(next.receptions.size).toBe(0);
      expect(next.totalReceptions).toBe(0);
    });
  });
});