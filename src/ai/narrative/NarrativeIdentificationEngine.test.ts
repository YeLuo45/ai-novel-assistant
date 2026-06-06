/**
 * V1117 NarrativeIdentificationEngine Tests — Direction E Iter 6/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeIdentificationEngineState,
  addIdentification,
  addIdentificationArc,
  getIdentificationsByMode,
  getIdentificationReport,
  resetNarrativeIdentificationEngineState,
  type NarrativeIdentificationEngineState,
} from './NarrativeIdentificationEngine';

describe('NarrativeIdentificationEngine', () => {
  let state: NarrativeIdentificationEngineState;

  beforeEach(() => { state = createNarrativeIdentificationEngineState(); });

  describe('createNarrativeIdentificationEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.identifications.size).toBe(0);
      expect(state.arcs.size).toBe(0);
    });
  });

  describe('addIdentification', () => {
    it('should add identification', () => {
      const next = addIdentification(state, 'i1', 'empathic', 'deep', 'strong', 'desc', 0.8, 0.9, 1);
      expect(next.identifications.size).toBe(1);
      expect(next.totalIdentifications).toBe(1);
    });
  });

  describe('addIdentificationArc', () => {
    it('should add arc', () => {
      let next = addIdentification(state, 'i1', 'empathic', 'deep', 'strong', 'desc', 0.8, 0.9, 1);
      next = addIdentificationArc(next, 'a1', ['i1']);
      expect(next.totalArcs).toBe(1);
    });
  });

  describe('getIdentificationsByMode', () => {
    it('should filter by mode', () => {
      let next = addIdentification(state, 'i1', 'empathic', 'deep', 'strong', 'desc', 0.8, 0.9, 1);
      next = addIdentification(next, 'i2', 'ironic', 'deep', 'strong', 'desc', 0.8, 0.9, 1);
      const emp = getIdentificationsByMode(next, 'empathic');
      expect(emp.length).toBe(1);
    });
  });

  describe('getIdentificationReport', () => {
    it('should return comprehensive report', () => {
      const report = getIdentificationReport(state);
      expect(report.totalIdentifications).toBe(0);
      expect(typeof report.identificationMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getIdentificationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeIdentificationEngineState', () => {
    it('should reset all state', () => {
      let next = addIdentification(state, 'i1', 'empathic', 'deep', 'strong', 'desc', 0.8, 0.9, 1);
      next = resetNarrativeIdentificationEngineState();
      expect(next.identifications.size).toBe(0);
      expect(next.totalIdentifications).toBe(0);
    });
  });
});