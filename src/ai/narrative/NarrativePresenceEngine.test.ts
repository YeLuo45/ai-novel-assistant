/**
 * V1131 NarrativePresenceEngine Tests — Direction E Iter 13/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativePresenceEngineState,
  addPresence,
  addPresenceField,
  getPresencesByType,
  getPresenceReport,
  resetNarrativePresenceEngineState,
  type NarrativePresenceEngineState,
} from './NarrativePresenceEngine';

describe('NarrativePresenceEngine', () => {
  let state: NarrativePresenceEngineState;

  beforeEach(() => { state = createNarrativePresenceEngineState(); });

  describe('createNarrativePresenceEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.presences.size).toBe(0);
      expect(state.fields.size).toBe(0);
    });
  });

  describe('addPresence', () => {
    it('should add presence', () => {
      const next = addPresence(state, 'p1', 'spatial', 'strong', 'tangible', 'desc', 0.9, 0.85, 1);
      expect(next.presences.size).toBe(1);
      expect(next.totalPresences).toBe(1);
    });
  });

  describe('addPresenceField', () => {
    it('should add field', () => {
      let next = addPresence(state, 'p1', 'spatial', 'strong', 'tangible', 'desc', 0.9, 0.85, 1);
      next = addPresenceField(next, 'f1', ['p1']);
      expect(next.totalFields).toBe(1);
    });
  });

  describe('getPresencesByType', () => {
    it('should filter by type', () => {
      let next = addPresence(state, 'p1', 'spatial', 'strong', 'tangible', 'desc', 0.9, 0.85, 1);
      next = addPresence(next, 'p2', 'temporal', 'strong', 'tangible', 'desc', 0.9, 0.85, 1);
      const spatial = getPresencesByType(next, 'spatial');
      expect(spatial.length).toBe(1);
    });
  });

  describe('getPresenceReport', () => {
    it('should return comprehensive report', () => {
      const report = getPresenceReport(state);
      expect(report.totalPresences).toBe(0);
      expect(typeof report.presenceMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getPresenceReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativePresenceEngineState', () => {
    it('should reset all state', () => {
      let next = addPresence(state, 'p1', 'spatial', 'strong', 'tangible', 'desc', 0.9, 0.85, 1);
      next = resetNarrativePresenceEngineState();
      expect(next.presences.size).toBe(0);
      expect(next.totalPresences).toBe(0);
    });
  });
});