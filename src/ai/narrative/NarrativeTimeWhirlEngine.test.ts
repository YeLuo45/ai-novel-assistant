/**
 * V1201 NarrativeTimeWhirlEngine Tests — Direction G Iter 8/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTimeWhirlEngineState,
  addTimeWhirl,
  addTimeWhirlDance,
  getTimeWhirlsByType,
  getTimeWhirlReport,
  resetNarrativeTimeWhirlEngineState,
  type NarrativeTimeWhirlEngineState,
} from './NarrativeTimeWhirlEngine';

describe('NarrativeTimeWhirlEngine', () => {
  let state: NarrativeTimeWhirlEngineState;

  beforeEach(() => { state = createNarrativeTimeWhirlEngineState(); });

  describe('createNarrativeTimeWhirlEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.whirls.size).toBe(0);
      expect(state.dances.size).toBe(0);
    });
  });

  describe('addTimeWhirl', () => {
    it('should add whirl', () => {
      const next = addTimeWhirl(state, 'w1', 'spiraling', 'furious', 'paradoxical', 'desc', 0.9, 0.85, 1);
      expect(next.whirls.size).toBe(1);
      expect(next.totalWhirls).toBe(1);
    });
  });

  describe('addTimeWhirlDance', () => {
    it('should add dance', () => {
      let next = addTimeWhirl(state, 'w1', 'spiraling', 'furious', 'paradoxical', 'desc', 0.9, 0.85, 1);
      next = addTimeWhirlDance(next, 'd1', ['w1']);
      expect(next.totalDances).toBe(1);
    });
  });

  describe('getTimeWhirlsByType', () => {
    it('should filter by type', () => {
      let next = addTimeWhirl(state, 'w1', 'spiraling', 'furious', 'paradoxical', 'desc', 0.9, 0.85, 1);
      next = addTimeWhirl(next, 'w2', 'spinning', 'furious', 'paradoxical', 'desc', 0.9, 0.85, 1);
      const spiraling = getTimeWhirlsByType(next, 'spiraling');
      expect(spiraling.length).toBe(1);
    });
  });

  describe('getTimeWhirlReport', () => {
    it('should return comprehensive report', () => {
      const report = getTimeWhirlReport(state);
      expect(report.totalWhirls).toBe(0);
      expect(typeof report.timeWhirlMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTimeWhirlReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTimeWhirlEngineState', () => {
    it('should reset all state', () => {
      let next = addTimeWhirl(state, 'w1', 'spiraling', 'furious', 'paradoxical', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeTimeWhirlEngineState();
      expect(next.whirls.size).toBe(0);
      expect(next.totalWhirls).toBe(0);
    });
  });
});