/**
 * V1199 NarrativeTimeLoopEngine Tests — Direction G Iter 7/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTimeLoopEngineState,
  addTimeLoop,
  addTimeLoopCycle,
  getTimeLoopsByType,
  getTimeLoopReport,
  resetNarrativeTimeLoopEngineState,
  type NarrativeTimeLoopEngineState,
} from './NarrativeTimeLoopEngine';

describe('NarrativeTimeLoopEngine', () => {
  let state: NarrativeTimeLoopEngineState;

  beforeEach(() => { state = createNarrativeTimeLoopEngineState(); });

  describe('createNarrativeTimeLoopEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.loops.size).toBe(0);
      expect(state.cycles.size).toBe(0);
    });
  });

  describe('addTimeLoop', () => {
    it('should add loop', () => {
      const next = addTimeLoop(state, 'l1', 'ouroboros', 'infinite', 'transcendent', 'desc', 0.9, 0.85, 1);
      expect(next.loops.size).toBe(1);
      expect(next.totalLoops).toBe(1);
    });
  });

  describe('addTimeLoopCycle', () => {
    it('should add cycle', () => {
      let next = addTimeLoop(state, 'l1', 'ouroboros', 'infinite', 'transcendent', 'desc', 0.9, 0.85, 1);
      next = addTimeLoopCycle(next, 'c1', ['l1']);
      expect(next.totalCycles).toBe(1);
    });
  });

  describe('getTimeLoopsByType', () => {
    it('should filter by type', () => {
      let next = addTimeLoop(state, 'l1', 'ouroboros', 'infinite', 'transcendent', 'desc', 0.9, 0.85, 1);
      next = addTimeLoop(next, 'l2', 'groundhog', 'infinite', 'transcendent', 'desc', 0.9, 0.85, 1);
      const ouroboros = getTimeLoopsByType(next, 'ouroboros');
      expect(ouroboros.length).toBe(1);
    });
  });

  describe('getTimeLoopReport', () => {
    it('should return comprehensive report', () => {
      const report = getTimeLoopReport(state);
      expect(report.totalLoops).toBe(0);
      expect(typeof report.timeLoopMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTimeLoopReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTimeLoopEngineState', () => {
    it('should reset all state', () => {
      let next = addTimeLoop(state, 'l1', 'ouroboros', 'infinite', 'transcendent', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeTimeLoopEngineState();
      expect(next.loops.size).toBe(0);
      expect(next.totalLoops).toBe(0);
    });
  });
});