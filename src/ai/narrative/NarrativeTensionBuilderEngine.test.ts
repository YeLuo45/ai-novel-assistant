/**
 * V1005 NarrativeTensionBuilderEngine Tests — Direction B Iter 5/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTensionBuilderEngineState,
  addTensionEvent,
  addTensionCurve,
  getTensionEventsByType,
  getTensionReport,
  resetNarrativeTensionBuilderEngineState,
  type NarrativeTensionBuilderEngineState,
} from './NarrativeTensionBuilderEngine';

describe('NarrativeTensionBuilderEngine', () => {
  let state: NarrativeTensionBuilderEngineState;

  beforeEach(() => { state = createNarrativeTensionBuilderEngineState(); });

  describe('createNarrativeTensionBuilderEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.events.size).toBe(0);
      expect(state.curves.size).toBe(0);
    });
  });

  describe('addTensionEvent', () => {
    it('should add event', () => {
      const next = addTensionEvent(state, 'e1', 'dramatic', 'foreshadow', 'desc', 0.3, 0.9, 0.4, 1);
      expect(next.events.size).toBe(1);
      expect(next.totalEvents).toBe(1);
    });
  });

  describe('addTensionCurve', () => {
    it('should add curve', () => {
      let next = addTensionEvent(state, 'e1', 'dramatic', 'foreshadow', 'desc', 0.3, 0.9, 0.4, 1);
      next = addTensionCurve(next, 'c1', 'e1', 'mountain', 0.7, 0.9);
      expect(next.totalCurves).toBe(1);
    });
  });

  describe('getTensionEventsByType', () => {
    it('should filter by type', () => {
      let next = addTensionEvent(state, 'e1', 'dramatic', 'foreshadow', 'desc', 0.3, 0.9, 0.4, 1);
      next = addTensionEvent(next, 'e2', 'romantic', 'foreshadow', 'desc', 0.3, 0.9, 0.4, 1);
      const dramatic = getTensionEventsByType(next, 'dramatic');
      expect(dramatic.length).toBe(1);
    });
  });

  describe('getTensionReport', () => {
    it('should return comprehensive report', () => {
      const report = getTensionReport(state);
      expect(report.totalEvents).toBe(0);
      expect(typeof report.tensionMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTensionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTensionBuilderEngineState', () => {
    it('should reset all state', () => {
      let next = addTensionEvent(state, 'e1', 'dramatic', 'foreshadow', 'desc', 0.3, 0.9, 0.4, 1);
      next = resetNarrativeTensionBuilderEngineState();
      expect(next.events.size).toBe(0);
      expect(next.totalEvents).toBe(0);
    });
  });
});