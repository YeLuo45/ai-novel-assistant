/**
 * V1073 NarrativeResilienceEngine Tests — Direction D Iter 4/20 (Round 6)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeResilienceEngineState,
  addResilienceEvent,
  addResilienceCurve,
  getResilienceEventsByType,
  getResilienceReport,
  resetNarrativeResilienceEngineState,
  type NarrativeResilienceEngineState,
} from './NarrativeResilienceEngine';

describe('NarrativeResilienceEngine', () => {
  let state: NarrativeResilienceEngineState;

  beforeEach(() => { state = createNarrativeResilienceEngineState(); });

  describe('createNarrativeResilienceEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.events.size).toBe(0);
      expect(state.curves.size).toBe(0);
    });
  });

  describe('addResilienceEvent', () => {
    it('should add event', () => {
      const next = addResilienceEvent(state, 'e1', 'plot', 'strong', 'high', 'desc', 0.8, 0.7, 1);
      expect(next.events.size).toBe(1);
      expect(next.totalEvents).toBe(1);
    });
  });

  describe('addResilienceCurve', () => {
    it('should add curve', () => {
      let next = addResilienceEvent(state, 'e1', 'plot', 'strong', 'high', 'desc', 0.8, 0.7, 1);
      next = addResilienceCurve(next, 'c1', 'e1', 0.3, 0.9, 5);
      expect(next.totalCurves).toBe(1);
    });
  });

  describe('getResilienceEventsByType', () => {
    it('should filter by type', () => {
      let next = addResilienceEvent(state, 'e1', 'plot', 'strong', 'high', 'desc', 0.8, 0.7, 1);
      next = addResilienceEvent(next, 'e2', 'character', 'strong', 'high', 'desc', 0.8, 0.7, 1);
      const plot = getResilienceEventsByType(next, 'plot');
      expect(plot.length).toBe(1);
    });
  });

  describe('getResilienceReport', () => {
    it('should return comprehensive report', () => {
      const report = getResilienceReport(state);
      expect(report.totalEvents).toBe(0);
      expect(typeof report.resilienceMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getResilienceReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeResilienceEngineState', () => {
    it('should reset all state', () => {
      let next = addResilienceEvent(state, 'e1', 'plot', 'strong', 'high', 'desc', 0.8, 0.7, 1);
      next = resetNarrativeResilienceEngineState();
      expect(next.events.size).toBe(0);
      expect(next.totalEvents).toBe(0);
    });
  });
});