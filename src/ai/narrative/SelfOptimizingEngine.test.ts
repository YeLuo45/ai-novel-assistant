/**
 * V921 SelfOptimizingEngine Tests — Direction D Iter 8/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSelfOptimizingEngineState,
  addOptimizationRun,
  addOptimizationParameter,
  updateParameterValue,
  getRunsByTarget,
  getOptimizationReport,
  resetSelfOptimizingEngineState,
  type SelfOptimizingEngineState,
} from './SelfOptimizingEngine';

describe('SelfOptimizingEngine', () => {
  let state: SelfOptimizingEngineState;

  beforeEach(() => { state = createSelfOptimizingEngineState(); });

  describe('createSelfOptimizingEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.runs.size).toBe(0);
      expect(state.parameters.size).toBe(0);
    });
  });

  describe('addOptimizationRun', () => {
    it('should add run', () => {
      const next = addOptimizationRun(state, 'r1', 'speed', 'gradient', 0.5, 0.7, 10, 1);
      expect(next.runs.size).toBe(1);
      expect(next.totalImprovement).toBeCloseTo(0.2, 5);
    });
  });

  describe('addOptimizationParameter', () => {
    it('should add parameter', () => {
      const next = addOptimizationParameter(state, 'p1', 'word count', 0.5, [0, 1], 0.7);
      expect(next.totalParameters).toBe(1);
    });
  });

  describe('updateParameterValue', () => {
    it('should update', () => {
      let next = addOptimizationParameter(state, 'p1', 'p1', 0.5, [0, 1]);
      next = updateParameterValue(next, 'p1', 0.8);
      expect(next.parameters.get('p1')?.value).toBe(0.8);
    });

    it('should clamp value', () => {
      let next = addOptimizationParameter(state, 'p1', 'p1', 0.5, [0, 1]);
      next = updateParameterValue(next, 'p1', 1.5);
      expect(next.parameters.get('p1')?.value).toBe(1);
    });
  });

  describe('getRunsByTarget', () => {
    it('should filter by target', () => {
      let next = addOptimizationRun(state, 'r1', 'speed', 'gradient', 0.5, 0.7, 10, 1);
      next = addOptimizationRun(next, 'r2', 'quality', 'evolutionary', 0.5, 0.7, 10, 1);
      const speed = getRunsByTarget(next, 'speed');
      expect(speed.length).toBe(1);
    });
  });

  describe('getOptimizationReport', () => {
    it('should return comprehensive report', () => {
      const report = getOptimizationReport(state);
      expect(report.totalRuns).toBe(0);
      expect(typeof report.selfOptimizationMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getOptimizationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetSelfOptimizingEngineState', () => {
    it('should reset all state', () => {
      let next = addOptimizationRun(state, 'r1', 'speed', 'gradient', 0.5, 0.7, 10, 1);
      next = resetSelfOptimizingEngineState();
      expect(next.runs.size).toBe(0);
      expect(next.totalRuns).toBe(0);
    });
  });
});