/**
 * V1091 NarrativeModulationEngine Tests — Direction D Iter 13/20 (Round 6)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeModulationEngineState,
  addModulationEvent,
  addModulationPattern,
  getModulationEventsByType,
  getModulationReport,
  resetNarrativeModulationEngineState,
  type NarrativeModulationEngineState,
} from './NarrativeModulationEngine';

describe('NarrativeModulationEngine', () => {
  let state: NarrativeModulationEngineState;

  beforeEach(() => { state = createNarrativeModulationEngineState(); });

  describe('createNarrativeModulationEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.events.size).toBe(0);
      expect(state.patterns.size).toBe(0);
    });
  });

  describe('addModulationEvent', () => {
    it('should add event', () => {
      const next = addModulationEvent(state, 'e1', 'volume', 'smooth', 'wide', 'desc', 0.3, 0.9);
      expect(next.events.size).toBe(1);
      expect(next.totalEvents).toBe(1);
    });
  });

  describe('addModulationPattern', () => {
    it('should add pattern', () => {
      let next = addModulationEvent(state, 'e1', 'volume', 'smooth', 'wide', 'desc', 0.3, 0.9);
      next = addModulationPattern(next, 'p1', ['e1']);
      expect(next.totalPatterns).toBe(1);
    });
  });

  describe('getModulationEventsByType', () => {
    it('should filter by type', () => {
      let next = addModulationEvent(state, 'e1', 'volume', 'smooth', 'wide', 'desc', 0.3, 0.9);
      next = addModulationEvent(next, 'e2', 'rhythm', 'smooth', 'wide', 'desc', 0.3, 0.9);
      const vol = getModulationEventsByType(next, 'volume');
      expect(vol.length).toBe(1);
    });
  });

  describe('getModulationReport', () => {
    it('should return comprehensive report', () => {
      const report = getModulationReport(state);
      expect(report.totalEvents).toBe(0);
      expect(typeof report.modulationMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getModulationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeModulationEngineState', () => {
    it('should reset all state', () => {
      let next = addModulationEvent(state, 'e1', 'volume', 'smooth', 'wide', 'desc', 0.3, 0.9);
      next = resetNarrativeModulationEngineState();
      expect(next.events.size).toBe(0);
      expect(next.totalEvents).toBe(0);
    });
  });
});