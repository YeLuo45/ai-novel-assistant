/**
 * V1289 NarrativeStoryCircuitEngine Tests — Direction I Iter 12/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStoryCircuitEngineState,
  addStoryCircuitNode,
  addStoryCircuitLoop,
  getStoryCircuitNodesByType,
  getStoryCircuitReport,
  resetNarrativeStoryCircuitEngineState,
  type NarrativeStoryCircuitEngineState,
} from './NarrativeStoryCircuitEngine';

describe('NarrativeStoryCircuitEngine', () => {
  let state: NarrativeStoryCircuitEngineState;

  beforeEach(() => { state = createNarrativeStoryCircuitEngineState(); });

  describe('createNarrativeStoryCircuitEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.circuits.size).toBe(0);
      expect(state.loops.size).toBe(0);
    });
  });

  describe('addStoryCircuitNode', () => {
    it('should add circuit', () => {
      const next = addStoryCircuitNode(state, 'c1', 'closed_loop', 'overwhelming', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.circuits.size).toBe(1);
      expect(next.totalCircuits).toBe(1);
    });
  });

  describe('addStoryCircuitLoop', () => {
    it('should add loop', () => {
      let next = addStoryCircuitNode(state, 'c1', 'closed_loop', 'overwhelming', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addStoryCircuitLoop(next, 'l1', ['c1']);
      expect(next.totalLoops).toBe(1);
    });
  });

  describe('getStoryCircuitNodesByType', () => {
    it('should filter by type', () => {
      let next = addStoryCircuitNode(state, 'c1', 'closed_loop', 'overwhelming', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addStoryCircuitNode(next, 'c2', 'linear', 'overwhelming', 'transcendent', 'desc', 0.95, 0.9, 1);
      const closed = getStoryCircuitNodesByType(next, 'closed_loop');
      expect(closed.length).toBe(1);
    });
  });

  describe('getStoryCircuitReport', () => {
    it('should return comprehensive report', () => {
      const report = getStoryCircuitReport(state);
      expect(report.totalCircuits).toBe(0);
      expect(typeof report.storyCircuitMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStoryCircuitReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStoryCircuitEngineState', () => {
    it('should reset all state', () => {
      let next = addStoryCircuitNode(state, 'c1', 'closed_loop', 'overwhelming', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeStoryCircuitEngineState();
      expect(next.circuits.size).toBe(0);
      expect(next.totalCircuits).toBe(0);
    });
  });
});