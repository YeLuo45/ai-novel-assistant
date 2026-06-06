/**
 * V931 AdaptiveQualityEngine Tests — Direction D Iter 13/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAdaptiveQualityEngineState,
  addQualityMetric,
  addQualityAction,
  getMetricsByDimension,
  getQualityReport,
  resetAdaptiveQualityEngineState,
  type AdaptiveQualityEngineState,
} from './AdaptiveQualityEngine';

describe('AdaptiveQualityEngine', () => {
  let state: AdaptiveQualityEngineState;

  beforeEach(() => { state = createAdaptiveQualityEngineState(); });

  describe('createAdaptiveQualityEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.metrics.size).toBe(0);
      expect(state.actions.size).toBe(0);
    });
  });

  describe('addQualityMetric', () => {
    it('should add metric', () => {
      const next = addQualityMetric(state, 'm1', 'prose', 'good', 0.7, 'improving', 1);
      expect(next.metrics.size).toBe(1);
      expect(next.totalMetrics).toBe(1);
    });
  });

  describe('addQualityAction', () => {
    it('should add action', () => {
      let next = addQualityMetric(state, 'm1', 'prose', 'good', 0.7, 'improving', 1);
      next = addQualityAction(next, 'a1', 'm1', 'revise', 0.2, true, 2);
      expect(next.totalActions).toBe(1);
      expect(next.successfulActions).toBe(1);
    });
  });

  describe('getMetricsByDimension', () => {
    it('should filter by dimension', () => {
      let next = addQualityMetric(state, 'm1', 'prose', 'good', 0.7, 'improving', 1);
      next = addQualityMetric(next, 'm2', 'plot', 'good', 0.7, 'improving', 1);
      const prose = getMetricsByDimension(next, 'prose');
      expect(prose.length).toBe(1);
    });
  });

  describe('getQualityReport', () => {
    it('should return comprehensive report', () => {
      const report = getQualityReport(state);
      expect(report.totalMetrics).toBe(0);
      expect(typeof report.qualityMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getQualityReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetAdaptiveQualityEngineState', () => {
    it('should reset all state', () => {
      let next = addQualityMetric(state, 'm1', 'prose', 'good', 0.7, 'improving', 1);
      next = resetAdaptiveQualityEngineState();
      expect(next.metrics.size).toBe(0);
      expect(next.totalMetrics).toBe(0);
    });
  });
});