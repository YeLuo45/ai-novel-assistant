/**
 * V1163 NarrativeSensoryDetailEngine Tests — Direction F Iter 9/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeSensoryDetailEngineState,
  addSensoryDetail,
  addSensoryDetailField,
  getSensoryDetailsByType,
  getSensoryDetailReport,
  resetNarrativeSensoryDetailEngineState,
  type NarrativeSensoryDetailEngineState,
} from './NarrativeSensoryDetailEngine';

describe('NarrativeSensoryDetailEngine', () => {
  let state: NarrativeSensoryDetailEngineState;

  beforeEach(() => { state = createNarrativeSensoryDetailEngineState(); });

  describe('createNarrativeSensoryDetailEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.details.size).toBe(0);
      expect(state.fields.size).toBe(0);
    });
  });

  describe('addSensoryDetail', () => {
    it('should add detail', () => {
      const next = addSensoryDetail(state, 'd1', 'sight', 'rich', 'tactile', 'desc', 0.9, 0.85, 1);
      expect(next.details.size).toBe(1);
      expect(next.totalDetails).toBe(1);
    });
  });

  describe('addSensoryDetailField', () => {
    it('should add field', () => {
      let next = addSensoryDetail(state, 'd1', 'sight', 'rich', 'tactile', 'desc', 0.9, 0.85, 1);
      next = addSensoryDetailField(next, 'f1', ['d1']);
      expect(next.totalFields).toBe(1);
    });
  });

  describe('getSensoryDetailsByType', () => {
    it('should filter by type', () => {
      let next = addSensoryDetail(state, 'd1', 'sight', 'rich', 'tactile', 'desc', 0.9, 0.85, 1);
      next = addSensoryDetail(next, 'd2', 'sound', 'rich', 'tactile', 'desc', 0.9, 0.85, 1);
      const sight = getSensoryDetailsByType(next, 'sight');
      expect(sight.length).toBe(1);
    });
  });

  describe('getSensoryDetailReport', () => {
    it('should return comprehensive report', () => {
      const report = getSensoryDetailReport(state);
      expect(report.totalDetails).toBe(0);
      expect(typeof report.sensoryDetailMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getSensoryDetailReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeSensoryDetailEngineState', () => {
    it('should reset all state', () => {
      let next = addSensoryDetail(state, 'd1', 'sight', 'rich', 'tactile', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeSensoryDetailEngineState();
      expect(next.details.size).toBe(0);
      expect(next.totalDetails).toBe(0);
    });
  });
});