/**
 * V1085 NarrativeAmplificationEngine Tests — Direction D Iter 10/20 (Round 6)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAmplificationEngineState,
  addAmplificationEvent,
  addAmplificationPath,
  getAmplificationEventsByMode,
  getAmplificationReport,
  resetNarrativeAmplificationEngineState,
  type NarrativeAmplificationEngineState,
} from './NarrativeAmplificationEngine';

describe('NarrativeAmplificationEngine', () => {
  let state: NarrativeAmplificationEngineState;

  beforeEach(() => { state = createNarrativeAmplificationEngineState(); });

  describe('createNarrativeAmplificationEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.events.size).toBe(0);
      expect(state.paths.size).toBe(0);
    });
  });

  describe('addAmplificationEvent', () => {
    it('should add event', () => {
      const next = addAmplificationEvent(state, 'e1', 'dramatic', 'emotion', 'moderate', 'desc', 0.3, 0.9);
      expect(next.events.size).toBe(1);
      expect(next.totalEvents).toBe(1);
    });
  });

  describe('addAmplificationPath', () => {
    it('should add path', () => {
      let next = addAmplificationEvent(state, 'e1', 'dramatic', 'emotion', 'moderate', 'desc', 0.3, 0.9);
      next = addAmplificationPath(next, 'p1', ['e1']);
      expect(next.totalPaths).toBe(1);
    });
  });

  describe('getAmplificationEventsByMode', () => {
    it('should filter by mode', () => {
      let next = addAmplificationEvent(state, 'e1', 'dramatic', 'emotion', 'moderate', 'desc', 0.3, 0.9);
      next = addAmplificationEvent(next, 'e2', 'subtle', 'emotion', 'moderate', 'desc', 0.3, 0.5);
      const dramatic = getAmplificationEventsByMode(next, 'dramatic');
      expect(dramatic.length).toBe(1);
    });
  });

  describe('getAmplificationReport', () => {
    it('should return comprehensive report', () => {
      const report = getAmplificationReport(state);
      expect(report.totalEvents).toBe(0);
      expect(typeof report.amplificationMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAmplificationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAmplificationEngineState', () => {
    it('should reset all state', () => {
      let next = addAmplificationEvent(state, 'e1', 'dramatic', 'emotion', 'moderate', 'desc', 0.3, 0.9);
      next = resetNarrativeAmplificationEngineState();
      expect(next.events.size).toBe(0);
      expect(next.totalEvents).toBe(0);
    });
  });
});