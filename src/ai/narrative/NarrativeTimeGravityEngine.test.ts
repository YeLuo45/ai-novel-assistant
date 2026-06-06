/**
 * V1213 NarrativeTimeGravityEngine Tests — Direction G Iter 14/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTimeGravityEngineState,
  addTimeGravity,
  addTimeGravityField,
  getTimeGravitiesByType,
  getTimeGravityReport,
  resetNarrativeTimeGravityEngineState,
  type NarrativeTimeGravityEngineState,
} from './NarrativeTimeGravityEngine';

describe('NarrativeTimeGravityEngine', () => {
  let state: NarrativeTimeGravityEngineState;

  beforeEach(() => { state = createNarrativeTimeGravityEngineState(); });

  describe('createNarrativeTimeGravityEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.gravities.size).toBe(0);
      expect(state.fields.size).toBe(0);
    });
  });

  describe('addTimeGravity', () => {
    it('should add gravity', () => {
      const next = addTimeGravity(state, 'g1', 'attractive', 'infinite', 'event_horizon', 'desc', 0.9, 0.85, 1);
      expect(next.gravities.size).toBe(1);
      expect(next.totalGravities).toBe(1);
    });
  });

  describe('addTimeGravityField', () => {
    it('should add field', () => {
      let next = addTimeGravity(state, 'g1', 'attractive', 'infinite', 'event_horizon', 'desc', 0.9, 0.85, 1);
      next = addTimeGravityField(next, 'f1', ['g1']);
      expect(next.totalFields).toBe(1);
    });
  });

  describe('getTimeGravitiesByType', () => {
    it('should filter by type', () => {
      let next = addTimeGravity(state, 'g1', 'attractive', 'infinite', 'event_horizon', 'desc', 0.9, 0.85, 1);
      next = addTimeGravity(next, 'g2', 'repulsive', 'infinite', 'event_horizon', 'desc', 0.9, 0.85, 1);
      const attractive = getTimeGravitiesByType(next, 'attractive');
      expect(attractive.length).toBe(1);
    });
  });

  describe('getTimeGravityReport', () => {
    it('should return comprehensive report', () => {
      const report = getTimeGravityReport(state);
      expect(report.totalGravities).toBe(0);
      expect(typeof report.timeGravityMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTimeGravityReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTimeGravityEngineState', () => {
    it('should reset all state', () => {
      let next = addTimeGravity(state, 'g1', 'attractive', 'infinite', 'event_horizon', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeTimeGravityEngineState();
      expect(next.gravities.size).toBe(0);
      expect(next.totalGravities).toBe(0);
    });
  });
});