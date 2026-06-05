/**
 * V815 NarrativeInsightEngine Tests — Direction E Iter 3/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeInsightEngineState,
  generateInsight,
  verifyInsight,
  connectInsights,
  getInsightsByType,
  getInsightReport,
  resetNarrativeInsightEngineState,
  type NarrativeInsightEngineState,
} from './NarrativeInsightEngine';

describe('NarrativeInsightEngine', () => {
  let state: NarrativeInsightEngineState;

  beforeEach(() => { state = createNarrativeInsightEngineState(); });

  describe('createNarrativeInsightEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.insights.size).toBe(0);
      expect(state.connections.size).toBe(0);
    });
  });

  describe('generateInsight', () => {
    it('should generate insight', () => {
      const next = generateInsight(state, 'i1', 'pattern', 'Hero pattern', 0.8, 'deep', ['evidence'], ['implication']);
      expect(next.insights.size).toBe(1);
      expect(next.totalInsights).toBe(1);
    });

    it('should clamp impact', () => {
      const next = generateInsight(state, 'i1', 'pattern', 'desc', 1.5);
      expect(next.insights.get('i1')?.impact).toBe(1);
    });
  });

  describe('verifyInsight', () => {
    it('should verify', () => {
      let next = generateInsight(state, 'i1', 'pattern', 'desc');
      next = verifyInsight(next, 'i1');
      expect(next.insights.get('i1')?.status).toBe('verified');
      expect(next.verifiedInsights).toBe(1);
    });
  });

  describe('connectInsights', () => {
    it('should connect', () => {
      const next = connectInsights(state, 'c1', 'i1', 'i2', 0.7, 'related');
      expect(next.totalConnections).toBe(1);
    });
  });

  describe('getInsightsByType', () => {
    it('should filter by type', () => {
      let next = generateInsight(state, 'i1', 'pattern', 'desc');
      next = generateInsight(next, 'i2', 'discovery', 'desc');
      const patterns = getInsightsByType(next, 'pattern');
      expect(patterns.length).toBe(1);
    });
  });

  describe('getInsightReport', () => {
    it('should return comprehensive report', () => {
      const report = getInsightReport(state);
      expect(report.totalInsights).toBe(0);
      expect(typeof report.averageQuality).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getInsightReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeInsightEngineState', () => {
    it('should reset all state', () => {
      let next = generateInsight(state, 'i1', 'pattern', 'desc');
      next = resetNarrativeInsightEngineState();
      expect(next.insights.size).toBe(0);
      expect(next.totalInsights).toBe(0);
    });
  });
});