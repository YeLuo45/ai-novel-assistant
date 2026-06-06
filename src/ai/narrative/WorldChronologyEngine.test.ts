/**
 * V1051 WorldChronologyEngine Tests — Direction C Iter 13/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWorldChronologyEngineState,
  addChronologyEvent,
  addChronologyEra,
  getEventsByScale,
  getChronologyReport,
  resetWorldChronologyEngineState,
  type WorldChronologyEngineState,
} from './WorldChronologyEngine';

describe('WorldChronologyEngine', () => {
  let state: WorldChronologyEngineState;

  beforeEach(() => { state = createWorldChronologyEngineState(); });

  describe('createWorldChronologyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.events.size).toBe(0);
      expect(state.eras.size).toBe(0);
    });
  });

  describe('addChronologyEvent', () => {
    it('should add event', () => {
      const next = addChronologyEvent(state, 'e1', 'year', 'documented', 'pivotal', 'desc', 1, 0.9, 0.8);
      expect(next.events.size).toBe(1);
      expect(next.totalEvents).toBe(1);
    });
  });

  describe('addChronologyEra', () => {
    it('should add era', () => {
      let next = addChronologyEvent(state, 'e1', 'year', 'documented', 'pivotal', 'desc', 1, 0.9, 0.8);
      next = addChronologyEra(next, 'era1', 'Golden Age', 0, 100, ['e1']);
      expect(next.totalEras).toBe(1);
    });
  });

  describe('getEventsByScale', () => {
    it('should filter by scale', () => {
      let next = addChronologyEvent(state, 'e1', 'year', 'documented', 'pivotal', 'desc', 1, 0.9, 0.8);
      next = addChronologyEvent(next, 'e2', 'era', 'documented', 'pivotal', 'desc', 1, 0.9, 0.8);
      const year = getEventsByScale(next, 'year');
      expect(year.length).toBe(1);
    });
  });

  describe('getChronologyReport', () => {
    it('should return comprehensive report', () => {
      const report = getChronologyReport(state);
      expect(report.totalEvents).toBe(0);
      expect(typeof report.chronologyMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getChronologyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetWorldChronologyEngineState', () => {
    it('should reset all state', () => {
      let next = addChronologyEvent(state, 'e1', 'year', 'documented', 'pivotal', 'desc', 1, 0.9, 0.8);
      next = resetWorldChronologyEngineState();
      expect(next.events.size).toBe(0);
      expect(next.totalEvents).toBe(0);
    });
  });
});