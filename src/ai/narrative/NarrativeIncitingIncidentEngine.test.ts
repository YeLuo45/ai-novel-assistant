/**
 * V999 NarrativeIncitingIncidentEngine Tests — Direction B Iter 2/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeIncitingIncidentEngineState,
  addIncitingIncident,
  addIncidentRipple,
  getIncidentsByType,
  getIncitingReport,
  resetNarrativeIncitingIncidentEngineState,
  type NarrativeIncitingIncidentEngineState,
} from './NarrativeIncitingIncidentEngine';

describe('NarrativeIncitingIncidentEngine', () => {
  let state: NarrativeIncitingIncidentEngineState;

  beforeEach(() => { state = createNarrativeIncitingIncidentEngineState(); });

  describe('createNarrativeIncitingIncidentEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.incidents.size).toBe(0);
      expect(state.ripples.size).toBe(0);
    });
  });

  describe('addIncitingIncident', () => {
    it('should add incident', () => {
      const next = addIncitingIncident(state, 'i1', 'disruption', 'strong', 'early', 'desc', 0.8, ['c1'], 1);
      expect(next.incidents.size).toBe(1);
      expect(next.totalIncidents).toBe(1);
    });
  });

  describe('addIncidentRipple', () => {
    it('should add ripple', () => {
      let next = addIncitingIncident(state, 'i1', 'disruption', 'strong', 'early', 'desc', 0.8, ['c1'], 1);
      next = addIncidentRipple(next, 'r1', 'i1', 'desc', 0.7, 0.8);
      expect(next.totalRipples).toBe(1);
    });
  });

  describe('getIncidentsByType', () => {
    it('should filter by type', () => {
      let next = addIncitingIncident(state, 'i1', 'disruption', 'strong', 'early', 'desc', 0.8, ['c1'], 1);
      next = addIncitingIncident(next, 'i2', 'revelation', 'strong', 'early', 'desc', 0.8, ['c1'], 1);
      const disruption = getIncidentsByType(next, 'disruption');
      expect(disruption.length).toBe(1);
    });
  });

  describe('getIncitingReport', () => {
    it('should return comprehensive report', () => {
      const report = getIncitingReport(state);
      expect(report.totalIncidents).toBe(0);
      expect(typeof report.incitingMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getIncitingReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeIncitingIncidentEngineState', () => {
    it('should reset all state', () => {
      let next = addIncitingIncident(state, 'i1', 'disruption', 'strong', 'early', 'desc', 0.8, ['c1'], 1);
      next = resetNarrativeIncitingIncidentEngineState();
      expect(next.incidents.size).toBe(0);
      expect(next.totalIncidents).toBe(0);
    });
  });
});