/**
 * V1223 NarrativeTimeCompressionEngine2 Tests — Direction G Iter 19/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTimeCompressionEngineState,
  addTimeCompression,
  addTimeCompressionLayer,
  getTimeCompressionsByType,
  getTimeCompressionReport,
  resetNarrativeTimeCompressionEngineState,
  type NarrativeTimeCompressionEngineState,
} from './NarrativeTimeCompressionEngine2';

describe('NarrativeTimeCompressionEngine2', () => {
  let state: NarrativeTimeCompressionEngineState;

  beforeEach(() => { state = createNarrativeTimeCompressionEngineState(); });

  describe('createNarrativeTimeCompressionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.compressions.size).toBe(0);
      expect(state.layers.size).toBe(0);
    });
  });

  describe('addTimeCompression', () => {
    it('should add compression', () => {
      const next = addTimeCompression(state, 'c1', 'condensation', 'extreme', 'revolutionary', 'desc', 0.9, 0.85, 1);
      expect(next.compressions.size).toBe(1);
      expect(next.totalCompressions).toBe(1);
    });
  });

  describe('addTimeCompressionLayer', () => {
    it('should add layer', () => {
      let next = addTimeCompression(state, 'c1', 'condensation', 'extreme', 'revolutionary', 'desc', 0.9, 0.85, 1);
      next = addTimeCompressionLayer(next, 'l1', ['c1']);
      expect(next.totalLayers).toBe(1);
    });
  });

  describe('getTimeCompressionsByType', () => {
    it('should filter by type', () => {
      let next = addTimeCompression(state, 'c1', 'condensation', 'extreme', 'revolutionary', 'desc', 0.9, 0.85, 1);
      next = addTimeCompression(next, 'c2', 'montage', 'extreme', 'revolutionary', 'desc', 0.9, 0.85, 1);
      const cond = getTimeCompressionsByType(next, 'condensation');
      expect(cond.length).toBe(1);
    });
  });

  describe('getTimeCompressionReport', () => {
    it('should return comprehensive report', () => {
      const report = getTimeCompressionReport(state);
      expect(report.totalCompressions).toBe(0);
      expect(typeof report.timeCompressionMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTimeCompressionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTimeCompressionEngineState', () => {
    it('should reset all state', () => {
      let next = addTimeCompression(state, 'c1', 'condensation', 'extreme', 'revolutionary', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeTimeCompressionEngineState();
      expect(next.compressions.size).toBe(0);
      expect(next.totalCompressions).toBe(0);
    });
  });
});