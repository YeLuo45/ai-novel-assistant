/**
 * V1001 NarrativeClimaxEngine Tests — Direction B Iter 3/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeClimaxEngineState,
  addClimaxEvent,
  addClimaxBuildup,
  getClimaxEventsByType,
  getClimaxReport,
  resetNarrativeClimaxEngineState,
  type NarrativeClimaxEngineState,
} from './NarrativeClimaxEngine';

describe('NarrativeClimaxEngine', () => {
  let state: NarrativeClimaxEngineState;

  beforeEach(() => { state = createNarrativeClimaxEngineState(); });

  describe('createNarrativeClimaxEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.events.size).toBe(0);
      expect(state.buildups.size).toBe(0);
    });
  });

  describe('addClimaxEvent', () => {
    it('should add event', () => {
      const next = addClimaxEvent(state, 'e1', 'confrontation', 'intense', 'transformation', 'desc', 0.9, ['c1'], 1);
      expect(next.events.size).toBe(1);
      expect(next.totalEvents).toBe(1);
    });
  });

  describe('addClimaxBuildup', () => {
    it('should add buildup', () => {
      let next = addClimaxEvent(state, 'e1', 'confrontation', 'intense', 'transformation', 'desc', 0.9, ['c1'], 1);
      next = addClimaxBuildup(next, 'b1', 'e1', 0.3, 0.9, 0.7);
      expect(next.totalBuildups).toBe(1);
    });
  });

  describe('getClimaxEventsByType', () => {
    it('should filter by type', () => {
      let next = addClimaxEvent(state, 'e1', 'confrontation', 'intense', 'transformation', 'desc', 0.9, ['c1'], 1);
      next = addClimaxEvent(next, 'e2', 'sacrifice', 'intense', 'transformation', 'desc', 0.9, ['c1'], 1);
      const confrontation = getClimaxEventsByType(next, 'confrontation');
      expect(confrontation.length).toBe(1);
    });
  });

  describe('getClimaxReport', () => {
    it('should return comprehensive report', () => {
      const report = getClimaxReport(state);
      expect(report.totalEvents).toBe(0);
      expect(typeof report.climaxMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getClimaxReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeClimaxEngineState', () => {
    it('should reset all state', () => {
      let next = addClimaxEvent(state, 'e1', 'confrontation', 'intense', 'transformation', 'desc', 0.9, ['c1'], 1);
      next = resetNarrativeClimaxEngineState();
      expect(next.events.size).toBe(0);
      expect(next.totalEvents).toBe(0);
    });
  });
});