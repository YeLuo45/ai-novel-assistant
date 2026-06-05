/**
 * V813 NarrativeAwarenessEngine Tests — Direction E Iter 2/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAwarenessEngineState,
  recordAwareness,
  performAwarenessCheck,
  getStatesByFocus,
  getChecksByFocus,
  getAwarenessReport,
  resetNarrativeAwarenessEngineState,
  type NarrativeAwarenessEngineState,
} from './NarrativeAwarenessEngine';

describe('NarrativeAwarenessEngine', () => {
  let state: NarrativeAwarenessEngineState;

  beforeEach(() => { state = createNarrativeAwarenessEngineState(); });

  describe('createNarrativeAwarenessEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.states.size).toBe(0);
      expect(state.overallAwareness).toBe(0.5);
    });
  });

  describe('recordAwareness', () => {
    it('should record awareness', () => {
      const next = recordAwareness(state, 'a1', 'perception', 'active', 'narrative', 0.8, 0.7, 0.6);
      expect(next.states.size).toBe(1);
      expect(next.totalStates).toBe(1);
    });

    it('should clamp values', () => {
      const next = recordAwareness(state, 'a1', 'perception', 'active', 'narrative', 1.5, -0.5, 0.6);
      expect(next.states.get('a1')?.clarity).toBe(1);
      expect(next.states.get('a1')?.breadth).toBe(0);
    });
  });

  describe('performAwarenessCheck', () => {
    it('should perform check', () => {
      const next = performAwarenessCheck(state, 'c1', 'narrative', 'what is the theme?', 'love', 0.8, 0.7);
      expect(next.totalChecks).toBe(1);
    });
  });

  describe('getStatesByFocus', () => {
    it('should filter by focus', () => {
      let next = recordAwareness(state, 'a1', 'perception', 'active', 'narrative');
      next = recordAwareness(next, 'a2', 'perception', 'active', 'reader');
      const narrative = getStatesByFocus(next, 'narrative');
      expect(narrative.length).toBe(1);
    });
  });

  describe('getChecksByFocus', () => {
    it('should filter by focus', () => {
      let next = performAwarenessCheck(state, 'c1', 'narrative', 'q1', 'a1');
      next = performAwarenessCheck(next, 'c2', 'reader', 'q2', 'a2');
      const narrative = getChecksByFocus(next, 'narrative');
      expect(narrative.length).toBe(1);
    });
  });

  describe('getAwarenessReport', () => {
    it('should return comprehensive report', () => {
      const report = getAwarenessReport(state);
      expect(report.totalStates).toBe(0);
      expect(typeof report.overallAwareness).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAwarenessReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAwarenessEngineState', () => {
    it('should reset all state', () => {
      let next = recordAwareness(state, 'a1', 'perception', 'active', 'narrative');
      next = resetNarrativeAwarenessEngineState();
      expect(next.states.size).toBe(0);
      expect(next.totalStates).toBe(0);
    });
  });
});