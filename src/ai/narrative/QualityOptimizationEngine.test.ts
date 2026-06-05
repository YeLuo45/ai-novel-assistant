/**
 * V797 QualityOptimizationEngine Tests — Direction D Iter 3/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createQualityOptimizationEngineState,
  measureQuality,
  planOptimization,
  completeOptimization,
  getMeasurementsByDimension,
  getActionsByStatus,
  getQualityOptimizationReport,
  resetQualityOptimizationEngineState,
  type QualityOptimizationEngineState,
} from './QualityOptimizationEngine';

describe('QualityOptimizationEngine', () => {
  let state: QualityOptimizationEngineState;

  beforeEach(() => { state = createQualityOptimizationEngineState(); });

  describe('createQualityOptimizationEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.measurements.size).toBe(0);
      expect(state.overallLevel).toBe('fair');
    });
  });

  describe('measureQuality', () => {
    it('should measure quality', () => {
      const next = measureQuality(state, 'm1', 'prose', 0.85, 5, 'good prose');
      expect(next.measurements.size).toBe(1);
      expect(next.measurements.get('m1')?.level).toBe('excellent');
    });

    it('should clamp score', () => {
      const next = measureQuality(state, 'm1', 'prose', 1.5, 5);
      expect(next.measurements.get('m1')?.score).toBe(1);
    });

    it('should determine level correctly', () => {
      const excellent = measureQuality(state, 'm1', 'prose', 0.95, 5);
      expect(excellent.measurements.get('m1')?.level).toBe('masterful');
    });
  });

  describe('planOptimization', () => {
    it('should plan optimization', () => {
      const next = planOptimization(state, 'a1', 'm1', 'incremental', 'fix grammar', 0.2);
      expect(next.totalActions).toBe(1);
    });

    it('should clamp expected improvement', () => {
      const next = planOptimization(state, 'a1', 'm1', 'incremental', 'fix', 1.5);
      expect(next.actions.get('a1')?.expectedImprovement).toBe(1);
    });
  });

  describe('completeOptimization', () => {
    it('should complete optimization successfully', () => {
      let next = planOptimization(state, 'a1', 'm1', 'incremental', 'fix', 0.2);
      next = completeOptimization(next, 'a1', 0.25);
      expect(next.actions.get('a1')?.status).toBe('completed');
    });

    it('should mark as failed if below 80%', () => {
      let next = planOptimization(state, 'a1', 'm1', 'incremental', 'fix', 0.5);
      next = completeOptimization(next, 'a1', 0.1);
      expect(next.actions.get('a1')?.status).toBe('failed');
    });
  });

  describe('getMeasurementsByDimension', () => {
    it('should filter by dimension', () => {
      let next = measureQuality(state, 'm1', 'prose', 0.8, 5);
      next = measureQuality(next, 'm2', 'plot', 0.7, 5);
      const prose = getMeasurementsByDimension(next, 'prose');
      expect(prose.length).toBe(1);
    });
  });

  describe('getActionsByStatus', () => {
    it('should filter by status', () => {
      let next = planOptimization(state, 'a1', 'm1', 'incremental', 'fix', 0.2);
      next = completeOptimization(next, 'a1', 0.25);
      const completed = getActionsByStatus(next, 'completed');
      expect(completed.length).toBe(1);
    });
  });

  describe('getQualityOptimizationReport', () => {
    it('should return comprehensive report', () => {
      const report = getQualityOptimizationReport(state);
      expect(report.totalMeasurements).toBe(0);
      expect(typeof report.averageQuality).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getQualityOptimizationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetQualityOptimizationEngineState', () => {
    it('should reset all state', () => {
      let next = measureQuality(state, 'm1', 'prose', 0.8, 5);
      next = resetQualityOptimizationEngineState();
      expect(next.measurements.size).toBe(0);
      expect(next.totalMeasurements).toBe(0);
    });
  });
});