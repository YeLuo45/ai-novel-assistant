/**
 * V953 NarrativeCreationEngine Tests — Direction E Iter 9/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCreationEngineState,
  addCreationEvent,
  addCreativeWork,
  completeCreativeWork,
  getEventsByStage,
  getCreationReport,
  resetNarrativeCreationEngineState,
  type NarrativeCreationEngineState,
} from './NarrativeCreationEngine';

describe('NarrativeCreationEngine', () => {
  let state: NarrativeCreationEngineState;

  beforeEach(() => { state = createNarrativeCreationEngineState(); });

  describe('createNarrativeCreationEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.events.size).toBe(0);
      expect(state.works.size).toBe(0);
    });
  });

  describe('addCreationEvent', () => {
    it('should add event', () => {
      const next = addCreationEvent(state, 'e1', 'inspiration', 'flowing', 'professional', 'desc', 'output', 0.8, 1);
      expect(next.events.size).toBe(1);
      expect(next.totalEvents).toBe(1);
    });
  });

  describe('addCreativeWork', () => {
    it('should add work', () => {
      let next = addCreationEvent(state, 'e1', 'inspiration', 'flowing', 'professional', 'desc', 'output', 0.8, 1);
      next = addCreativeWork(next, 'w1', 'My Novel', ['e1']);
      expect(next.totalWorks).toBe(1);
    });
  });

  describe('completeCreativeWork', () => {
    it('should complete', () => {
      let next = addCreationEvent(state, 'e1', 'inspiration', 'flowing', 'professional', 'desc', 'output', 0.8, 1);
      next = addCreativeWork(next, 'w1', 'My Novel', ['e1']);
      next = completeCreativeWork(next, 'w1');
      expect(next.completedWorks).toBe(1);
      expect(next.works.get('w1')?.completed).toBe(true);
    });
  });

  describe('getEventsByStage', () => {
    it('should filter by stage', () => {
      let next = addCreationEvent(state, 'e1', 'inspiration', 'flowing', 'professional', 'desc', 'output', 0.8, 1);
      next = addCreationEvent(next, 'e2', 'creation', 'flowing', 'professional', 'desc', 'output', 0.8, 1);
      const inspiration = getEventsByStage(next, 'inspiration');
      expect(inspiration.length).toBe(1);
    });
  });

  describe('getCreationReport', () => {
    it('should return comprehensive report', () => {
      const report = getCreationReport(state);
      expect(report.totalEvents).toBe(0);
      expect(typeof report.creationMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCreationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeCreationEngineState', () => {
    it('should reset all state', () => {
      let next = addCreationEvent(state, 'e1', 'inspiration', 'flowing', 'professional', 'desc', 'output', 0.8, 1);
      next = resetNarrativeCreationEngineState();
      expect(next.events.size).toBe(0);
      expect(next.totalEvents).toBe(0);
    });
  });
});