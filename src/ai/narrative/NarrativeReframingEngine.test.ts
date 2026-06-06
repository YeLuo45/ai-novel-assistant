/**
 * V1083 NarrativeReframingEngine Tests — Direction D Iter 9/20 (Round 6)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeReframingEngineState,
  addReframeEvent,
  addReframeSequence,
  getReframeEventsByType,
  getReframingReport,
  resetNarrativeReframingEngineState,
  type NarrativeReframingEngineState,
} from './NarrativeReframingEngine';

describe('NarrativeReframingEngine', () => {
  let state: NarrativeReframingEngineState;

  beforeEach(() => { state = createNarrativeReframingEngineState(); });

  describe('createNarrativeReframingEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.events.size).toBe(0);
      expect(state.sequences.size).toBe(0);
    });
  });

  describe('addReframeEvent', () => {
    it('should add event', () => {
      const next = addReframeEvent(state, 'e1', 'perspective', 'profound', 'chapter', 'desc', 0.3, 0.9, 1);
      expect(next.events.size).toBe(1);
      expect(next.totalEvents).toBe(1);
    });
  });

  describe('addReframeSequence', () => {
    it('should add sequence', () => {
      let next = addReframeEvent(state, 'e1', 'perspective', 'profound', 'chapter', 'desc', 0.3, 0.9, 1);
      next = addReframeSequence(next, 's1', ['e1']);
      expect(next.totalSequences).toBe(1);
    });
  });

  describe('getReframeEventsByType', () => {
    it('should filter by type', () => {
      let next = addReframeEvent(state, 'e1', 'perspective', 'profound', 'chapter', 'desc', 0.3, 0.9, 1);
      next = addReframeEvent(next, 'e2', 'context', 'profound', 'chapter', 'desc', 0.3, 0.9, 1);
      const perspective = getReframeEventsByType(next, 'perspective');
      expect(perspective.length).toBe(1);
    });
  });

  describe('getReframingReport', () => {
    it('should return comprehensive report', () => {
      const report = getReframingReport(state);
      expect(report.totalEvents).toBe(0);
      expect(typeof report.reframingMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getReframingReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeReframingEngineState', () => {
    it('should reset all state', () => {
      let next = addReframeEvent(state, 'e1', 'perspective', 'profound', 'chapter', 'desc', 0.3, 0.9, 1);
      next = resetNarrativeReframingEngineState();
      expect(next.events.size).toBe(0);
      expect(next.totalEvents).toBe(0);
    });
  });
});