/**
 * V1123 NarrativeEmpathyEngine Tests — Direction E Iter 9/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeEmpathyEngineState,
  addEmpathy,
  addEmpathyField,
  getEmpathiesByMode,
  getEmpathyReport,
  resetNarrativeEmpathyEngineState,
  type NarrativeEmpathyEngineState,
} from './NarrativeEmpathyEngine';

describe('NarrativeEmpathyEngine', () => {
  let state: NarrativeEmpathyEngineState;

  beforeEach(() => { state = createNarrativeEmpathyEngineState(); });

  describe('createNarrativeEmpathyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.empathies.size).toBe(0);
      expect(state.fields.size).toBe(0);
    });
  });

  describe('addEmpathy', () => {
    it('should add empathy', () => {
      const next = addEmpathy(state, 'e1', 'emotional', 'broad', 'profound', 'desc', 0.85, 0.9, 1);
      expect(next.empathies.size).toBe(1);
      expect(next.totalEmpathies).toBe(1);
    });
  });

  describe('addEmpathyField', () => {
    it('should add field', () => {
      let next = addEmpathy(state, 'e1', 'emotional', 'broad', 'profound', 'desc', 0.85, 0.9, 1);
      next = addEmpathyField(next, 'f1', ['e1']);
      expect(next.totalFields).toBe(1);
    });
  });

  describe('getEmpathiesByMode', () => {
    it('should filter by mode', () => {
      let next = addEmpathy(state, 'e1', 'emotional', 'broad', 'profound', 'desc', 0.85, 0.9, 1);
      next = addEmpathy(next, 'e2', 'cognitive', 'broad', 'profound', 'desc', 0.85, 0.9, 1);
      const emotional = getEmpathiesByMode(next, 'emotional');
      expect(emotional.length).toBe(1);
    });
  });

  describe('getEmpathyReport', () => {
    it('should return comprehensive report', () => {
      const report = getEmpathyReport(state);
      expect(report.totalEmpathies).toBe(0);
      expect(typeof report.empathyMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getEmpathyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeEmpathyEngineState', () => {
    it('should reset all state', () => {
      let next = addEmpathy(state, 'e1', 'emotional', 'broad', 'profound', 'desc', 0.85, 0.9, 1);
      next = resetNarrativeEmpathyEngineState();
      expect(next.empathies.size).toBe(0);
      expect(next.totalEmpathies).toBe(0);
    });
  });
});