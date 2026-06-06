/**
 * V1087 NarrativeCompressionEngine Tests — Direction D Iter 11/20 (Round 6)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCompressionEngineState,
  addCompressionEvent,
  addCompressionPlan,
  getCompressionEventsByType,
  getCompressionReport,
  resetNarrativeCompressionEngineState,
  type NarrativeCompressionEngineState,
} from './NarrativeCompressionEngine';

describe('NarrativeCompressionEngine', () => {
  let state: NarrativeCompressionEngineState;

  beforeEach(() => { state = createNarrativeCompressionEngineState(); });

  describe('createNarrativeCompressionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.events.size).toBe(0);
      expect(state.plans.size).toBe(0);
    });
  });

  describe('addCompressionEvent', () => {
    it('should add event', () => {
      const next = addCompressionEvent(state, 'e1', 'temporal', 'moderate', 'good', 'desc', 100, 50);
      expect(next.events.size).toBe(1);
      expect(next.totalEvents).toBe(1);
    });
  });

  describe('addCompressionPlan', () => {
    it('should add plan', () => {
      let next = addCompressionEvent(state, 'e1', 'temporal', 'moderate', 'good', 'desc', 100, 50);
      next = addCompressionPlan(next, 'p1', 'main', ['e1']);
      expect(next.totalPlans).toBe(1);
    });
  });

  describe('getCompressionEventsByType', () => {
    it('should filter by type', () => {
      let next = addCompressionEvent(state, 'e1', 'temporal', 'moderate', 'good', 'desc', 100, 50);
      next = addCompressionEvent(next, 'e2', 'spatial', 'moderate', 'good', 'desc', 100, 50);
      const temp = getCompressionEventsByType(next, 'temporal');
      expect(temp.length).toBe(1);
    });
  });

  describe('getCompressionReport', () => {
    it('should return comprehensive report', () => {
      const report = getCompressionReport(state);
      expect(report.totalEvents).toBe(0);
      expect(typeof report.compressionMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCompressionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeCompressionEngineState', () => {
    it('should reset all state', () => {
      let next = addCompressionEvent(state, 'e1', 'temporal', 'moderate', 'good', 'desc', 100, 50);
      next = resetNarrativeCompressionEngineState();
      expect(next.events.size).toBe(0);
      expect(next.totalEvents).toBe(0);
    });
  });
});