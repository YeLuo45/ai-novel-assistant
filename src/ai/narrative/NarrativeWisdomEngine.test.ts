/**
 * V827 NarrativeWisdomEngine Tests — Direction E Iter 9/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWisdomEngineState,
  runWisdomCycle,
  getNarrativeWisdomReport,
  resetNarrativeWisdomEngineState,
  type NarrativeWisdomEngineState,
} from './NarrativeWisdomEngine';

describe('NarrativeWisdomEngine', () => {
  let state: NarrativeWisdomEngineState;

  beforeEach(() => { state = createNarrativeWisdomEngineState(); });

  describe('createNarrativeWisdomEngineState', () => {
    it('should initialize all 8 sub-systems', () => {
      expect(state.cognition).toBeDefined();
      expect(state.awareness).toBeDefined();
      expect(state.insight).toBeDefined();
      expect(state.comprehension).toBeDefined();
      expect(state.understanding).toBeDefined();
      expect(state.knowledge).toBeDefined();
      expect(state.learning).toBeDefined();
      expect(state.adaptation).toBeDefined();
    });

    it('should have correct version', () => {
      expect(state.version).toBe('3.0.0');
    });

    it('should have default overall wisdom', () => {
      expect(state.overallWisdom).toBe(0.5);
    });
  });

  describe('runWisdomCycle', () => {
    it('should run cycle and return metrics', () => {
      const { overallWisdom, insights } = runWisdomCycle(state);
      expect(typeof overallWisdom).toBe('number');
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should generate insights for empty state', () => {
      const { insights } = runWisdomCycle(state);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should compute overall wisdom', () => {
      const { overallWisdom } = runWisdomCycle(state);
      expect(overallWisdom).toBeGreaterThanOrEqual(0);
      expect(overallWisdom).toBeLessThanOrEqual(1);
    });
  });

  describe('getNarrativeWisdomReport', () => {
    it('should return comprehensive report', () => {
      const report = getNarrativeWisdomReport(state);
      expect(typeof report.cognitiveIntegration).toBe('number');
      expect(typeof report.overallWisdom).toBe('number');
    });

    it('should include all subsystem scores', () => {
      const report = getNarrativeWisdomReport(state);
      expect(typeof report.overallAwareness).toBe('number');
      expect(typeof report.averageQuality).toBe('number');
      expect(typeof report.comprehensionDepth).toBe('number');
    });
  });

  describe('resetNarrativeWisdomEngineState', () => {
    it('should reset all state', () => {
      const reset = resetNarrativeWisdomEngineState();
      expect(reset.cognition).toBeDefined();
      expect(reset.overallWisdom).toBe(0.5);
    });
  });
});