/**
 * V717 RefinementLoopEngine Tests — Direction D Iter 8/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createRefinementLoopEngineState,
  createLoop,
  runLoopIteration,
  pauseLoop,
  resumeLoop,
  getLoopsByStatus,
  getLoopIterations,
  getRefinementLoopReport,
  resetRefinementLoopEngineState,
  type RefinementLoopEngineState,
} from './RefinementLoopEngine';

describe('RefinementLoopEngine', () => {
  let state: RefinementLoopEngineState;

  beforeEach(() => { state = createRefinementLoopEngineState(); });

  describe('createRefinementLoopEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.loops.size).toBe(0);
      expect(state.totalLoops).toBe(0);
    });

    it('should have default convergence rate', () => {
      expect(state.convergenceRate).toBe(0.5);
    });
  });

  describe('createLoop', () => {
    it('should create loop', () => {
      const next = createLoop(state, 'l1', 'Quality Loop', 10);
      expect(next.loops.size).toBe(1);
      expect(next.totalLoops).toBe(1);
      expect(next.activeLoops).toBe(1);
    });

    it('should set initial status', () => {
      const next = createLoop(state, 'l1', 'Loop', 10);
      expect(next.loops.get('l1')?.status).toBe('active');
    });
  });

  describe('runLoopIteration', () => {
    it('should run iteration', () => {
      let next = createLoop(state, 'l1', 'Loop', 10);
      next = runLoopIteration(next, 'l1', 'i1', 'input', 'old text', 'new text', 0.1);
      expect(next.totalIterations).toBe(1);
      expect(next.loops.get('l1')?.currentIteration).toBe(1);
    });

    it('should detect convergence at max', () => {
      let next = createLoop(state, 'l1', 'Loop', 2);
      next = runLoopIteration(next, 'l1', 'i1', 'input', 'a', 'b', 0.1);
      next = runLoopIteration(next, 'l1', 'i2', 'input', 'a', 'b', 0.1);
      expect(next.loops.get('l1')?.status).toBe('converged');
    });

    it('should return state for unknown loop', () => {
      const next = runLoopIteration(state, 'unknown', 'i1', 'input', 'a', 'b', 0.1);
      expect(next.totalIterations).toBe(0);
    });
  });

  describe('pauseLoop', () => {
    it('should pause loop', () => {
      let next = createLoop(state, 'l1', 'Loop', 10);
      next = pauseLoop(next, 'l1');
      expect(next.loops.get('l1')?.status).toBe('paused');
    });
  });

  describe('resumeLoop', () => {
    it('should resume loop', () => {
      let next = createLoop(state, 'l1', 'Loop', 10);
      next = pauseLoop(next, 'l1');
      next = resumeLoop(next, 'l1');
      expect(next.loops.get('l1')?.status).toBe('active');
    });
  });

  describe('getLoopsByStatus', () => {
    it('should filter by status', () => {
      let next = createLoop(state, 'l1', 'Loop 1', 10);
      next = createLoop(next, 'l2', 'Loop 2', 10);
      next = pauseLoop(next, 'l1');
      const paused = getLoopsByStatus(next, 'paused');
      expect(paused.length).toBe(1);
    });
  });

  describe('getLoopIterations', () => {
    it('should return iterations', () => {
      let next = createLoop(state, 'l1', 'Loop', 10);
      next = runLoopIteration(next, 'l1', 'i1', 'input', 'a', 'b', 0.1);
      const iterations = getLoopIterations(next, 'l1');
      expect(iterations.length).toBe(1);
    });

    it('should return empty for unknown loop', () => {
      const iterations = getLoopIterations(state, 'unknown');
      expect(iterations).toEqual([]);
    });
  });

  describe('getRefinementLoopReport', () => {
    it('should return comprehensive report', () => {
      const report = getRefinementLoopReport(state);
      expect(report.totalLoops).toBe(0);
      expect(typeof report.convergenceRate).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getRefinementLoopReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetRefinementLoopEngineState', () => {
    it('should reset all state', () => {
      let next = createLoop(state, 'l1', 'Loop', 10);
      next = resetRefinementLoopEngineState();
      expect(next.loops.size).toBe(0);
      expect(next.totalLoops).toBe(0);
    });
  });
});