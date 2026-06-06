/**
 * V1291 NarrativeStoryLoopEngine Tests — Direction I Iter 13/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStoryLoopEngineState,
  addStoryLoopNode,
  addStoryLoopCycle,
  getStoryLoopNodesByType,
  getStoryLoopReport,
  resetNarrativeStoryLoopEngineState,
  type NarrativeStoryLoopEngineState,
} from './NarrativeStoryLoopEngine';

describe('NarrativeStoryLoopEngine', () => {
  let state: NarrativeStoryLoopEngineState;

  beforeEach(() => { state = createNarrativeStoryLoopEngineState(); });

  describe('createNarrativeStoryLoopEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.loops.size).toBe(0);
      expect(state.cycles.size).toBe(0);
    });
  });

  describe('addStoryLoopNode', () => {
    it('should add loop', () => {
      const next = addStoryLoopNode(state, 'l1', 'narrative', 'transcendent', 'infinite', 'desc', 0.95, 0.9, 1);
      expect(next.loops.size).toBe(1);
      expect(next.totalLoops).toBe(1);
    });
  });

  describe('addStoryLoopCycle', () => {
    it('should add cycle', () => {
      let next = addStoryLoopNode(state, 'l1', 'narrative', 'transcendent', 'infinite', 'desc', 0.95, 0.9, 1);
      next = addStoryLoopCycle(next, 'c1', ['l1']);
      expect(next.totalCycles).toBe(1);
    });
  });

  describe('getStoryLoopNodesByType', () => {
    it('should filter by type', () => {
      let next = addStoryLoopNode(state, 'l1', 'narrative', 'transcendent', 'infinite', 'desc', 0.95, 0.9, 1);
      next = addStoryLoopNode(next, 'l2', 'causal', 'transcendent', 'infinite', 'desc', 0.95, 0.9, 1);
      const narrative = getStoryLoopNodesByType(next, 'narrative');
      expect(narrative.length).toBe(1);
    });
  });

  describe('getStoryLoopReport', () => {
    it('should return comprehensive report', () => {
      const report = getStoryLoopReport(state);
      expect(report.totalLoops).toBe(0);
      expect(typeof report.storyLoopMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStoryLoopReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStoryLoopEngineState', () => {
    it('should reset all state', () => {
      let next = addStoryLoopNode(state, 'l1', 'narrative', 'transcendent', 'infinite', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeStoryLoopEngineState();
      expect(next.loops.size).toBe(0);
      expect(next.totalLoops).toBe(0);
    });
  });
});