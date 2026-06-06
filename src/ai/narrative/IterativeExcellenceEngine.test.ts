/**
 * V933 IterativeExcellenceEngine Tests — Direction D Iter 14/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createIterativeExcellenceEngineState,
  addExcellenceStep,
  addExcellenceProfile,
  updateExcellenceDimension,
  getStepsByDimension,
  getExcellenceReport,
  resetIterativeExcellenceEngineState,
  type IterativeExcellenceEngineState,
} from './IterativeExcellenceEngine';

describe('IterativeExcellenceEngine', () => {
  let state: IterativeExcellenceEngineState;

  beforeEach(() => { state = createIterativeExcellenceEngineState(); });

  describe('createIterativeExcellenceEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.steps.size).toBe(0);
      expect(state.profiles.size).toBe(0);
    });
  });

  describe('addExcellenceStep', () => {
    it('should add step', () => {
      const next = addExcellenceStep(state, 's1', 'craft', 0.5, 0.7, 'steady', 'desc', 1);
      expect(next.steps.size).toBe(1);
      expect(next.totalGain).toBeCloseTo(0.2, 5);
    });
  });

  describe('addExcellenceProfile', () => {
    it('should add profile', () => {
      const dims = new Map();
      dims.set('craft', 0.6);
      const next = addExcellenceProfile(state, 'p1', 'Distinguished Writer', dims);
      expect(next.profiles.size).toBe(1);
      expect(next.profiles.get('p1')?.level).toBe('distinguished');
    });
  });

  describe('updateExcellenceDimension', () => {
    it('should update', () => {
      const dims = new Map();
      dims.set('craft', 0.6);
      let next = addExcellenceProfile(state, 'p1', 'name', dims);
      next = updateExcellenceDimension(next, 'p1', 'craft', 0.85);
      expect(next.profiles.get('p1')?.level).toBe('exceptional');
    });
  });

  describe('getStepsByDimension', () => {
    it('should filter by dimension', () => {
      let next = addExcellenceStep(state, 's1', 'craft', 0.5, 0.7, 'steady', 'desc', 1);
      next = addExcellenceStep(next, 's2', 'creativity', 0.5, 0.7, 'steady', 'desc', 1);
      const craft = getStepsByDimension(next, 'craft');
      expect(craft.length).toBe(1);
    });
  });

  describe('getExcellenceReport', () => {
    it('should return comprehensive report', () => {
      const report = getExcellenceReport(state);
      expect(report.totalSteps).toBe(0);
      expect(typeof report.excellenceMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getExcellenceReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetIterativeExcellenceEngineState', () => {
    it('should reset all state', () => {
      let next = addExcellenceStep(state, 's1', 'craft', 0.5, 0.7, 'steady', 'desc', 1);
      next = resetIterativeExcellenceEngineState();
      expect(next.steps.size).toBe(0);
      expect(next.totalSteps).toBe(0);
    });
  });
});