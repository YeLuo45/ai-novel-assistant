/**
 * V1135 NarrativeStickinessEngine Tests — Direction E Iter 15/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStickinessEngineState,
  addStickiness,
  addStickinessHook,
  getStickinessesByType,
  getStickinessReport,
  resetNarrativeStickinessEngineState,
  type NarrativeStickinessEngineState,
} from './NarrativeStickinessEngine';

describe('NarrativeStickinessEngine', () => {
  let state: NarrativeStickinessEngineState;

  beforeEach(() => { state = createNarrativeStickinessEngineState(); });

  describe('createNarrativeStickinessEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.stickinesses.size).toBe(0);
      expect(state.hooks.size).toBe(0);
    });
  });

  describe('addStickiness', () => {
    it('should add stickiness', () => {
      const next = addStickiness(state, 's1', 'image', 'compelling', 'novelty', 'desc', 0.9, 0.85, 1);
      expect(next.stickinesses.size).toBe(1);
      expect(next.totalStickinesses).toBe(1);
    });
  });

  describe('addStickinessHook', () => {
    it('should add hook', () => {
      let next = addStickiness(state, 's1', 'image', 'compelling', 'novelty', 'desc', 0.9, 0.85, 1);
      next = addStickinessHook(next, 'h1', ['s1']);
      expect(next.totalHooks).toBe(1);
    });
  });

  describe('getStickinessesByType', () => {
    it('should filter by type', () => {
      let next = addStickiness(state, 's1', 'image', 'compelling', 'novelty', 'desc', 0.9, 0.85, 1);
      next = addStickiness(next, 's2', 'sound', 'compelling', 'novelty', 'desc', 0.9, 0.85, 1);
      const image = getStickinessesByType(next, 'image');
      expect(image.length).toBe(1);
    });
  });

  describe('getStickinessReport', () => {
    it('should return comprehensive report', () => {
      const report = getStickinessReport(state);
      expect(report.totalStickinesses).toBe(0);
      expect(typeof report.stickinessMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStickinessReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStickinessEngineState', () => {
    it('should reset all state', () => {
      let next = addStickiness(state, 's1', 'image', 'compelling', 'novelty', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeStickinessEngineState();
      expect(next.stickinesses.size).toBe(0);
      expect(next.totalStickinesses).toBe(0);
    });
  });
});