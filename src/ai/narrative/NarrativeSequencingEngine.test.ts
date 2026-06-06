/**
 * V1075 NarrativeSequencingEngine Tests — Direction D Iter 5/20 (Round 6)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeSequencingEngineState,
  addSequenceEvent,
  addSequencePlan,
  getSequenceEventsByType,
  getSequencingReport,
  resetNarrativeSequencingEngineState,
  type NarrativeSequencingEngineState,
} from './NarrativeSequencingEngine';

describe('NarrativeSequencingEngine', () => {
  let state: NarrativeSequencingEngineState;

  beforeEach(() => { state = createNarrativeSequencingEngineState(); });

  describe('createNarrativeSequencingEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.events.size).toBe(0);
      expect(state.plans.size).toBe(0);
    });
  });

  describe('addSequenceEvent', () => {
    it('should add event', () => {
      const next = addSequenceEvent(state, 'e1', 'linear', 'optimal', 'natural', 'desc', 1, 0.8, 1);
      expect(next.events.size).toBe(1);
      expect(next.totalEvents).toBe(1);
    });
  });

  describe('addSequencePlan', () => {
    it('should add plan', () => {
      let next = addSequenceEvent(state, 'e1', 'linear', 'optimal', 'natural', 'desc', 1, 0.8, 1);
      next = addSequenceEvent(next, 'e2', 'linear', 'optimal', 'natural', 'desc', 2, 0.7, 1);
      next = addSequencePlan(next, 'p1', 'main', ['e1', 'e2']);
      expect(next.totalPlans).toBe(1);
    });
  });

  describe('getSequenceEventsByType', () => {
    it('should filter by type', () => {
      let next = addSequenceEvent(state, 'e1', 'linear', 'optimal', 'natural', 'desc', 1, 0.8, 1);
      next = addSequenceEvent(next, 'e2', 'parallel', 'optimal', 'natural', 'desc', 2, 0.7, 1);
      const linear = getSequenceEventsByType(next, 'linear');
      expect(linear.length).toBe(1);
    });
  });

  describe('getSequencingReport', () => {
    it('should return comprehensive report', () => {
      const report = getSequencingReport(state);
      expect(report.totalEvents).toBe(0);
      expect(typeof report.sequencingMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getSequencingReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeSequencingEngineState', () => {
    it('should reset all state', () => {
      let next = addSequenceEvent(state, 'e1', 'linear', 'optimal', 'natural', 'desc', 1, 0.8, 1);
      next = resetNarrativeSequencingEngineState();
      expect(next.events.size).toBe(0);
      expect(next.totalEvents).toBe(0);
    });
  });
});