/**
 * V1161 NarrativeImageryEngine Tests — Direction F Iter 8/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeImageryEngineState,
  addImagery,
  addImageryPalette,
  getImageriesByType,
  getImageryReport,
  resetNarrativeImageryEngineState,
  type NarrativeImageryEngineState,
} from './NarrativeImageryEngine';

describe('NarrativeImageryEngine', () => {
  let state: NarrativeImageryEngineState;

  beforeEach(() => { state = createNarrativeImageryEngineState(); });

  describe('createNarrativeImageryEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.imageries.size).toBe(0);
      expect(state.palettes.size).toBe(0);
    });
  });

  describe('addImagery', () => {
    it('should add imagery', () => {
      const next = addImagery(state, 'i1', 'visual', 'incandescent', 'visionary', 'desc', 0.9, 0.85, 1);
      expect(next.imageries.size).toBe(1);
      expect(next.totalImageries).toBe(1);
    });
  });

  describe('addImageryPalette', () => {
    it('should add palette', () => {
      let next = addImagery(state, 'i1', 'visual', 'incandescent', 'visionary', 'desc', 0.9, 0.85, 1);
      next = addImageryPalette(next, 'p1', ['i1']);
      expect(next.totalPalettes).toBe(1);
    });
  });

  describe('getImageriesByType', () => {
    it('should filter by type', () => {
      let next = addImagery(state, 'i1', 'visual', 'incandescent', 'visionary', 'desc', 0.9, 0.85, 1);
      next = addImagery(next, 'i2', 'auditory', 'incandescent', 'visionary', 'desc', 0.9, 0.85, 1);
      const visual = getImageriesByType(next, 'visual');
      expect(visual.length).toBe(1);
    });
  });

  describe('getImageryReport', () => {
    it('should return comprehensive report', () => {
      const report = getImageryReport(state);
      expect(report.totalImageries).toBe(0);
      expect(typeof report.imageryMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getImageryReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeImageryEngineState', () => {
    it('should reset all state', () => {
      let next = addImagery(state, 'i1', 'visual', 'incandescent', 'visionary', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeImageryEngineState();
      expect(next.imageries.size).toBe(0);
      expect(next.totalImageries).toBe(0);
    });
  });
});