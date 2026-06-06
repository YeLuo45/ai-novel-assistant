/**
 * V1211 NarrativeTimeFieldEngine2 Tests — Direction G Iter 13/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTimeFieldEngineState,
  addTimeField,
  addTimeFieldDomain,
  getTimeFieldsByType,
  getTimeFieldReport,
  resetNarrativeTimeFieldEngineState,
  type NarrativeTimeFieldEngineState,
} from './NarrativeTimeFieldEngine2';

describe('NarrativeTimeFieldEngine2', () => {
  let state: NarrativeTimeFieldEngineState;

  beforeEach(() => { state = createNarrativeTimeFieldEngineState(); });

  describe('createNarrativeTimeFieldEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.fields.size).toBe(0);
      expect(state.domains.size).toBe(0);
    });
  });

  describe('addTimeField', () => {
    it('should add field', () => {
      const next = addTimeField(state, 'f1', 'narrative', 'absolute', 'hyperspatial', 'desc', 0.9, 0.85, 1);
      expect(next.fields.size).toBe(1);
      expect(next.totalFields).toBe(1);
    });
  });

  describe('addTimeFieldDomain', () => {
    it('should add domain', () => {
      let next = addTimeField(state, 'f1', 'narrative', 'absolute', 'hyperspatial', 'desc', 0.9, 0.85, 1);
      next = addTimeFieldDomain(next, 'd1', ['f1']);
      expect(next.totalDomains).toBe(1);
    });
  });

  describe('getTimeFieldsByType', () => {
    it('should filter by type', () => {
      let next = addTimeField(state, 'f1', 'narrative', 'absolute', 'hyperspatial', 'desc', 0.9, 0.85, 1);
      next = addTimeField(next, 'f2', 'gravitational', 'absolute', 'hyperspatial', 'desc', 0.9, 0.85, 1);
      const narrative = getTimeFieldsByType(next, 'narrative');
      expect(narrative.length).toBe(1);
    });
  });

  describe('getTimeFieldReport', () => {
    it('should return comprehensive report', () => {
      const report = getTimeFieldReport(state);
      expect(report.totalFields).toBe(0);
      expect(typeof report.timeFieldMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTimeFieldReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTimeFieldEngineState', () => {
    it('should reset all state', () => {
      let next = addTimeField(state, 'f1', 'narrative', 'absolute', 'hyperspatial', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeTimeFieldEngineState();
      expect(next.fields.size).toBe(0);
      expect(next.totalFields).toBe(0);
    });
  });
});