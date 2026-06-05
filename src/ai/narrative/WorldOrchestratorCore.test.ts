/**
 * V791 WorldOrchestratorCore Tests — Direction C Iter 9/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWorldOrchestratorCoreState,
  runWorldCycle,
  getWorldOrchestratorReport,
  resetWorldOrchestratorCoreState,
  type WorldOrchestratorCoreState,
} from './WorldOrchestratorCore';

describe('WorldOrchestratorCore', () => {
  let state: WorldOrchestratorCoreState;

  beforeEach(() => { state = createWorldOrchestratorCoreState(); });

  describe('createWorldOrchestratorCoreState', () => {
    it('should initialize all 8 sub-systems', () => {
      expect(state.reality).toBeDefined();
      expect(state.physics).toBeDefined();
      expect(state.dynamics).toBeDefined();
      expect(state.causality).toBeDefined();
      expect(state.depth).toBeDefined();
      expect(state.consistency).toBeDefined();
      expect(state.evolution).toBeDefined();
      expect(state.rules).toBeDefined();
    });

    it('should have correct version', () => {
      expect(state.version).toBe('3.0.0');
    });

    it('should have default overall world health', () => {
      expect(state.overallWorldHealth).toBe(0.5);
    });
  });

  describe('runWorldCycle', () => {
    it('should run cycle and return metrics', () => {
      const { overallWorldHealth, insights } = runWorldCycle(state);
      expect(typeof overallWorldHealth).toBe('number');
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should generate insights for empty state', () => {
      const { insights } = runWorldCycle(state);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should compute overall world health', () => {
      const { overallWorldHealth } = runWorldCycle(state);
      expect(overallWorldHealth).toBeGreaterThanOrEqual(0);
      expect(overallWorldHealth).toBeLessThanOrEqual(1);
    });
  });

  describe('getWorldOrchestratorReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldOrchestratorReport(state);
      expect(typeof report.realityConsistency).toBe('number');
      expect(typeof report.overallWorldHealth).toBe('number');
    });

    it('should include all subsystem scores', () => {
      const report = getWorldOrchestratorReport(state);
      expect(typeof report.physicsComplexity).toBe('number');
      expect(typeof report.dynamicsComplexity).toBe('number');
      expect(typeof report.causalConsistency).toBe('number');
    });
  });

  describe('resetWorldOrchestratorCoreState', () => {
    it('should reset all state', () => {
      const reset = resetWorldOrchestratorCoreState();
      expect(reset.reality).toBeDefined();
      expect(reset.overallWorldHealth).toBe(0.5);
    });
  });
});