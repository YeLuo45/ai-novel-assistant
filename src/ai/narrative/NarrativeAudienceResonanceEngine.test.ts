/**
 * V1253 NarrativeAudienceResonanceEngine Tests — Direction H Iter 14/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAudienceResonanceEngineState,
  addAudienceResonance,
  addAudienceResonanceField,
  getAudienceResonancesByType,
  getAudienceResonanceReport,
  resetNarrativeAudienceResonanceEngineState,
  type NarrativeAudienceResonanceEngineState,
} from './NarrativeAudienceResonanceEngine';

describe('NarrativeAudienceResonanceEngine', () => {
  let state: NarrativeAudienceResonanceEngineState;

  beforeEach(() => { state = createNarrativeAudienceResonanceEngineState(); });

  describe('createNarrativeAudienceResonanceEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.resonances.size).toBe(0);
      expect(state.fields.size).toBe(0);
    });
  });

  describe('addAudienceResonance', () => {
    it('should add resonance', () => {
      const next = addAudienceResonance(state, 'r1', 'spiritual', 'perfect', 'ultrasonic', 'desc', 0.95, 0.9, 1);
      expect(next.resonances.size).toBe(1);
      expect(next.totalResonances).toBe(1);
    });
  });

  describe('addAudienceResonanceField', () => {
    it('should add field', () => {
      let next = addAudienceResonance(state, 'r1', 'spiritual', 'perfect', 'ultrasonic', 'desc', 0.95, 0.9, 1);
      next = addAudienceResonanceField(next, 'f1', ['r1']);
      expect(next.totalFields).toBe(1);
    });
  });

  describe('getAudienceResonancesByType', () => {
    it('should filter by type', () => {
      let next = addAudienceResonance(state, 'r1', 'spiritual', 'perfect', 'ultrasonic', 'desc', 0.95, 0.9, 1);
      next = addAudienceResonance(next, 'r2', 'emotional', 'perfect', 'ultrasonic', 'desc', 0.95, 0.9, 1);
      const spiritual = getAudienceResonancesByType(next, 'spiritual');
      expect(spiritual.length).toBe(1);
    });
  });

  describe('getAudienceResonanceReport', () => {
    it('should return comprehensive report', () => {
      const report = getAudienceResonanceReport(state);
      expect(report.totalResonances).toBe(0);
      expect(typeof report.audienceResonanceMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAudienceResonanceReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAudienceResonanceEngineState', () => {
    it('should reset all state', () => {
      let next = addAudienceResonance(state, 'r1', 'spiritual', 'perfect', 'ultrasonic', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeAudienceResonanceEngineState();
      expect(next.resonances.size).toBe(0);
      expect(next.totalResonances).toBe(0);
    });
  });
});