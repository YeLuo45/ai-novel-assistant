/**
 * V1003 NarrativeResolutionEngine Tests — Direction B Iter 4/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeResolutionEngineState,
  addResolutionEvent,
  addResolutionArc,
  getResolutionEventsByType,
  getResolutionReport,
  resetNarrativeResolutionEngineState,
  type NarrativeResolutionEngineState,
} from './NarrativeResolutionEngine';

describe('NarrativeResolutionEngine', () => {
  let state: NarrativeResolutionEngineState;

  beforeEach(() => { state = createNarrativeResolutionEngineState(); });

  describe('createNarrativeResolutionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.events.size).toBe(0);
      expect(state.arcs.size).toBe(0);
    });
  });

  describe('addResolutionEvent', () => {
    it('should add event', () => {
      const next = addResolutionEvent(state, 'e1', 'closure', 'thematic', 'hopeful', 'desc', 0.8, ['c1'], 1);
      expect(next.events.size).toBe(1);
      expect(next.totalEvents).toBe(1);
    });
  });

  describe('addResolutionArc', () => {
    it('should add arc', () => {
      let next = addResolutionEvent(state, 'e1', 'closure', 'thematic', 'hopeful', 'desc', 0.8, ['c1'], 1);
      next = addResolutionArc(next, 'a1', 'e1', 0.3, 0.9);
      expect(next.totalArcs).toBe(1);
    });
  });

  describe('getResolutionEventsByType', () => {
    it('should filter by type', () => {
      let next = addResolutionEvent(state, 'e1', 'closure', 'thematic', 'hopeful', 'desc', 0.8, ['c1'], 1);
      next = addResolutionEvent(next, 'e2', 'transformation', 'thematic', 'hopeful', 'desc', 0.8, ['c1'], 1);
      const closure = getResolutionEventsByType(next, 'closure');
      expect(closure.length).toBe(1);
    });
  });

  describe('getResolutionReport', () => {
    it('should return comprehensive report', () => {
      const report = getResolutionReport(state);
      expect(report.totalEvents).toBe(0);
      expect(typeof report.resolutionMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getResolutionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeResolutionEngineState', () => {
    it('should reset all state', () => {
      let next = addResolutionEvent(state, 'e1', 'closure', 'thematic', 'hopeful', 'desc', 0.8, ['c1'], 1);
      next = resetNarrativeResolutionEngineState();
      expect(next.events.size).toBe(0);
      expect(next.totalEvents).toBe(0);
    });
  });
});