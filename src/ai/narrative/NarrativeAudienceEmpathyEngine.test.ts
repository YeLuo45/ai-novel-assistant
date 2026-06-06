/**
 * V1227 NarrativeAudienceEmpathyEngine Tests — Direction H Iter 1/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAudienceEmpathyEngineState,
  addAudienceEmpathy,
  addAudienceEmpathyField,
  getAudienceEmpathiesByType,
  getAudienceEmpathyReport,
  resetNarrativeAudienceEmpathyEngineState,
  type NarrativeAudienceEmpathyEngineState,
} from './NarrativeAudienceEmpathyEngine';

describe('NarrativeAudienceEmpathyEngine', () => {
  let state: NarrativeAudienceEmpathyEngineState;

  beforeEach(() => { state = createNarrativeAudienceEmpathyEngineState(); });

  describe('createNarrativeAudienceEmpathyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.empathies.size).toBe(0);
      expect(state.fields.size).toBe(0);
    });
  });

  describe('addAudienceEmpathy', () => {
    it('should add empathy', () => {
      const next = addAudienceEmpathy(state, 'e1', 'radical', 'profound', 'permanent', 'desc', 0.9, 0.85, 1);
      expect(next.empathies.size).toBe(1);
      expect(next.totalEmpathies).toBe(1);
    });
  });

  describe('addAudienceEmpathyField', () => {
    it('should add field', () => {
      let next = addAudienceEmpathy(state, 'e1', 'radical', 'profound', 'permanent', 'desc', 0.9, 0.85, 1);
      next = addAudienceEmpathyField(next, 'f1', ['e1']);
      expect(next.totalFields).toBe(1);
    });
  });

  describe('getAudienceEmpathiesByType', () => {
    it('should filter by type', () => {
      let next = addAudienceEmpathy(state, 'e1', 'radical', 'profound', 'permanent', 'desc', 0.9, 0.85, 1);
      next = addAudienceEmpathy(next, 'e2', 'cognitive', 'profound', 'permanent', 'desc', 0.9, 0.85, 1);
      const radical = getAudienceEmpathiesByType(next, 'radical');
      expect(radical.length).toBe(1);
    });
  });

  describe('getAudienceEmpathyReport', () => {
    it('should return comprehensive report', () => {
      const report = getAudienceEmpathyReport(state);
      expect(report.totalEmpathies).toBe(0);
      expect(typeof report.audienceEmpathyMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAudienceEmpathyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAudienceEmpathyEngineState', () => {
    it('should reset all state', () => {
      let next = addAudienceEmpathy(state, 'e1', 'radical', 'profound', 'permanent', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeAudienceEmpathyEngineState();
      expect(next.empathies.size).toBe(0);
      expect(next.totalEmpathies).toBe(0);
    });
  });
});