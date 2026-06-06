/**
 * V1133 NarrativeMemorabilityEngine Tests — Direction E Iter 14/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeMemorabilityEngineState,
  addMemorability,
  addMemorabilityTrace,
  getMemorabilitiesByType,
  getMemorabilityReport,
  resetNarrativeMemorabilityEngineState,
  type NarrativeMemorabilityEngineState,
} from './NarrativeMemorabilityEngine';

describe('NarrativeMemorabilityEngine', () => {
  let state: NarrativeMemorabilityEngineState;

  beforeEach(() => { state = createNarrativeMemorabilityEngineState(); });

  describe('createNarrativeMemorabilityEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.memorabilities.size).toBe(0);
      expect(state.traces.size).toBe(0);
    });
  });

  describe('addMemorability', () => {
    it('should add memorability', () => {
      const next = addMemorability(state, 'm1', 'image', 'unforgettable', 'distinctiveness', 'desc', 0.95, 0.9, 1);
      expect(next.memorabilities.size).toBe(1);
      expect(next.totalMemorabilities).toBe(1);
    });
  });

  describe('addMemorabilityTrace', () => {
    it('should add trace', () => {
      let next = addMemorability(state, 'm1', 'image', 'unforgettable', 'distinctiveness', 'desc', 0.95, 0.9, 1);
      next = addMemorabilityTrace(next, 't1', ['m1']);
      expect(next.totalTraces).toBe(1);
    });
  });

  describe('getMemorabilitiesByType', () => {
    it('should filter by type', () => {
      let next = addMemorability(state, 'm1', 'image', 'unforgettable', 'distinctiveness', 'desc', 0.95, 0.9, 1);
      next = addMemorability(next, 'm2', 'phrase', 'unforgettable', 'distinctiveness', 'desc', 0.95, 0.9, 1);
      const image = getMemorabilitiesByType(next, 'image');
      expect(image.length).toBe(1);
    });
  });

  describe('getMemorabilityReport', () => {
    it('should return comprehensive report', () => {
      const report = getMemorabilityReport(state);
      expect(report.totalMemorabilities).toBe(0);
      expect(typeof report.memorabilityMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getMemorabilityReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeMemorabilityEngineState', () => {
    it('should reset all state', () => {
      let next = addMemorability(state, 'm1', 'image', 'unforgettable', 'distinctiveness', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeMemorabilityEngineState();
      expect(next.memorabilities.size).toBe(0);
      expect(next.totalMemorabilities).toBe(0);
    });
  });
});