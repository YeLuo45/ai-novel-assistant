/**
 * V1097 NarrativeHarmonizationEngine Tests — Direction D Iter 16/20 (Round 6)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeHarmonizationEngineState,
  addHarmonizationEvent,
  addHarmonizationLayer,
  getHarmonizationEventsByMode,
  getHarmonizationReport,
  resetNarrativeHarmonizationEngineState,
  type NarrativeHarmonizationEngineState,
} from './NarrativeHarmonizationEngine';

describe('NarrativeHarmonizationEngine', () => {
  let state: NarrativeHarmonizationEngineState;

  beforeEach(() => { state = createNarrativeHarmonizationEngineState(); });

  describe('createNarrativeHarmonizationEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.events.size).toBe(0);
      expect(state.layers.size).toBe(0);
    });
  });

  describe('addHarmonizationEvent', () => {
    it('should add event', () => {
      const next = addHarmonizationEvent(state, 'e1', 'symphonic', 'arc', 'moderate', 'desc', 0.8, 0.9, 1);
      expect(next.events.size).toBe(1);
      expect(next.totalEvents).toBe(1);
    });
  });

  describe('addHarmonizationLayer', () => {
    it('should add layer', () => {
      let next = addHarmonizationEvent(state, 'e1', 'symphonic', 'arc', 'moderate', 'desc', 0.8, 0.9, 1);
      next = addHarmonizationLayer(next, 'l1', ['e1']);
      expect(next.totalLayers).toBe(1);
    });
  });

  describe('getHarmonizationEventsByMode', () => {
    it('should filter by mode', () => {
      let next = addHarmonizationEvent(state, 'e1', 'symphonic', 'arc', 'moderate', 'desc', 0.8, 0.9, 1);
      next = addHarmonizationEvent(next, 'e2', 'dissonant', 'arc', 'moderate', 'desc', 0.8, 0.9, 1);
      const symph = getHarmonizationEventsByMode(next, 'symphonic');
      expect(symph.length).toBe(1);
    });
  });

  describe('getHarmonizationReport', () => {
    it('should return comprehensive report', () => {
      const report = getHarmonizationReport(state);
      expect(report.totalEvents).toBe(0);
      expect(typeof report.harmonizationMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getHarmonizationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeHarmonizationEngineState', () => {
    it('should reset all state', () => {
      let next = addHarmonizationEvent(state, 'e1', 'symphonic', 'arc', 'moderate', 'desc', 0.8, 0.9, 1);
      next = resetNarrativeHarmonizationEngineState();
      expect(next.events.size).toBe(0);
      expect(next.totalEvents).toBe(0);
    });
  });
});