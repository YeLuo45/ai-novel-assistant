/**
 * V1013 NarrativeSceneBreakEngine Tests — Direction B Iter 9/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeSceneBreakEngineState,
  addSceneBreak,
  addSceneTransition,
  getSceneBreaksByType,
  getSceneBreakReport,
  resetNarrativeSceneBreakEngineState,
  type NarrativeSceneBreakEngineState,
} from './NarrativeSceneBreakEngine';

describe('NarrativeSceneBreakEngine', () => {
  let state: NarrativeSceneBreakEngineState;

  beforeEach(() => { state = createNarrativeSceneBreakEngineState(); });

  describe('createNarrativeSceneBreakEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.breaks.size).toBe(0);
      expect(state.transitions.size).toBe(0);
    });
  });

  describe('addSceneBreak', () => {
    it('should add break', () => {
      const next = addSceneBreak(state, 'b1', 'hard_break', 'clear', 'pacing', 'desc', 0.7, 0.8, 1);
      expect(next.breaks.size).toBe(1);
      expect(next.totalBreaks).toBe(1);
    });
  });

  describe('addSceneTransition', () => {
    it('should add transition', () => {
      let next = addSceneBreak(state, 'b1', 'hard_break', 'clear', 'pacing', 'desc', 0.7, 0.8, 1);
      next = addSceneBreak(next, 'b2', 'soft_break', 'subtle', 'pacing', 'desc', 0.7, 0.8, 1);
      next = addSceneTransition(next, 't1', 'b1', 'b2', 0.8, 0.7);
      expect(next.totalTransitions).toBe(1);
    });
  });

  describe('getSceneBreaksByType', () => {
    it('should filter by type', () => {
      let next = addSceneBreak(state, 'b1', 'hard_break', 'clear', 'pacing', 'desc', 0.7, 0.8, 1);
      next = addSceneBreak(next, 'b2', 'soft_break', 'subtle', 'pacing', 'desc', 0.7, 0.8, 1);
      const hard = getSceneBreaksByType(next, 'hard_break');
      expect(hard.length).toBe(1);
    });
  });

  describe('getSceneBreakReport', () => {
    it('should return comprehensive report', () => {
      const report = getSceneBreakReport(state);
      expect(report.totalBreaks).toBe(0);
      expect(typeof report.sceneBreakMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getSceneBreakReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeSceneBreakEngineState', () => {
    it('should reset all state', () => {
      let next = addSceneBreak(state, 'b1', 'hard_break', 'clear', 'pacing', 'desc', 0.7, 0.8, 1);
      next = resetNarrativeSceneBreakEngineState();
      expect(next.breaks.size).toBe(0);
      expect(next.totalBreaks).toBe(0);
    });
  });
});