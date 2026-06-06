/**
 * V1093 NarrativeAttunementEngine Tests — Direction D Iter 14/20 (Round 6)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAttunementEngineState,
  addAttunementEvent,
  addAttunementProfile,
  getAttunementEventsByTarget,
  getAttunementReport,
  resetNarrativeAttunementEngineState,
  type NarrativeAttunementEngineState,
} from './NarrativeAttunementEngine';

describe('NarrativeAttunementEngine', () => {
  let state: NarrativeAttunementEngineState;

  beforeEach(() => { state = createNarrativeAttunementEngineState(); });

  describe('createNarrativeAttunementEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.events.size).toBe(0);
      expect(state.profiles.size).toBe(0);
    });
  });

  describe('addAttunementEvent', () => {
    it('should add event', () => {
      const next = addAttunementEvent(state, 'e1', 'reader', 'deep', 'resonant', 'desc', 0.8, 0.7, 1);
      expect(next.events.size).toBe(1);
      expect(next.totalEvents).toBe(1);
    });
  });

  describe('addAttunementProfile', () => {
    it('should add profile', () => {
      let next = addAttunementEvent(state, 'e1', 'reader', 'deep', 'resonant', 'desc', 0.8, 0.7, 1);
      next = addAttunementProfile(next, 'p1', 'reader', ['e1']);
      expect(next.totalProfiles).toBe(1);
    });
  });

  describe('getAttunementEventsByTarget', () => {
    it('should filter by target', () => {
      let next = addAttunementEvent(state, 'e1', 'reader', 'deep', 'resonant', 'desc', 0.8, 0.7, 1);
      next = addAttunementEvent(next, 'e2', 'audience', 'deep', 'resonant', 'desc', 0.8, 0.7, 1);
      const reader = getAttunementEventsByTarget(next, 'reader');
      expect(reader.length).toBe(1);
    });
  });

  describe('getAttunementReport', () => {
    it('should return comprehensive report', () => {
      const report = getAttunementReport(state);
      expect(report.totalEvents).toBe(0);
      expect(typeof report.attunementMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAttunementReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAttunementEngineState', () => {
    it('should reset all state', () => {
      let next = addAttunementEvent(state, 'e1', 'reader', 'deep', 'resonant', 'desc', 0.8, 0.7, 1);
      next = resetNarrativeAttunementEngineState();
      expect(next.events.size).toBe(0);
      expect(next.totalEvents).toBe(0);
    });
  });
});