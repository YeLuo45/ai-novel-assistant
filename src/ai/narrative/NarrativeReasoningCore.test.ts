/**
 * V959 NarrativeReasoningCore Tests — Direction E Iter 12/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeReasoningCoreState,
  addReasoningArgument,
  addReasoningChain,
  getArgumentsByType,
  getReasoningReport,
  resetNarrativeReasoningCoreState,
  type NarrativeReasoningCoreState,
} from './NarrativeReasoningCore';

describe('NarrativeReasoningCore', () => {
  let state: NarrativeReasoningCoreState;

  beforeEach(() => { state = createNarrativeReasoningCoreState(); });

  describe('createNarrativeReasoningCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.arguments.size).toBe(0);
      expect(state.chains.size).toBe(0);
    });
  });

  describe('addReasoningArgument', () => {
    it('should add argument', () => {
      const next = addReasoningArgument(state, 'a1', 'deductive', 'strong', 'deep', 'premise', 'conclusion', 0.8, 1);
      expect(next.arguments.size).toBe(1);
      expect(next.totalArguments).toBe(1);
    });
  });

  describe('addReasoningChain', () => {
    it('should add chain', () => {
      let next = addReasoningArgument(state, 'a1', 'deductive', 'strong', 'deep', 'premise', 'conclusion', 0.8, 1);
      next = addReasoningChain(next, 'c1', 'main argument', ['a1']);
      expect(next.totalChains).toBe(1);
    });
  });

  describe('getArgumentsByType', () => {
    it('should filter by type', () => {
      let next = addReasoningArgument(state, 'a1', 'deductive', 'strong', 'deep', 'p', 'c', 0.8, 1);
      next = addReasoningArgument(next, 'a2', 'inductive', 'strong', 'deep', 'p', 'c', 0.8, 1);
      const deductive = getArgumentsByType(next, 'deductive');
      expect(deductive.length).toBe(1);
    });
  });

  describe('getReasoningReport', () => {
    it('should return comprehensive report', () => {
      const report = getReasoningReport(state);
      expect(report.totalArguments).toBe(0);
      expect(typeof report.reasoningMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getReasoningReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeReasoningCoreState', () => {
    it('should reset all state', () => {
      let next = addReasoningArgument(state, 'a1', 'deductive', 'strong', 'deep', 'p', 'c', 0.8, 1);
      next = resetNarrativeReasoningCoreState();
      expect(next.arguments.size).toBe(0);
      expect(next.totalArguments).toBe(0);
    });
  });
});