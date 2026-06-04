/**
 * V651 NarrativeReasoningEngine Tests — Direction E Iter 2/9
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeReasoningState,
  startReasoningChain,
  addConclusion,
  setReasoningType,
  setReasoningState,
  computeConclusionConfidence,
  finalizeChain,
  getReasoningReport,
  resetNarrativeReasoningState,
  type NarrativeReasoningState,
} from './NarrativeReasoningEngine';

describe('NarrativeReasoningEngine', () => {
  let state: NarrativeReasoningState;

  beforeEach(() => { state = createNarrativeReasoningState(); });

  describe('createNarrativeReasoningState', () => {
    it('should initialize with defaults', () => {
      expect(state.activeChain).toBeNull();
      expect(state.reasoningType).toBe('deductive');
      expect(state.state).toBe('exploring');
    });

    it('should start with empty history', () => {
      expect(state.chainHistory).toEqual([]);
    });
  });

  describe('startReasoningChain', () => {
    it('should start new chain', () => {
      const next = startReasoningChain(state, 'chain1', 'deductive', ['P1', 'P2']);
      expect(next.activeChain).toBeTruthy();
      expect(next.activeChain?.chainId).toBe('chain1');
    });

    it('should set reasoning type', () => {
      const next = startReasoningChain(state, 'chain1', 'abductive', ['P1']);
      expect(next.reasoningType).toBe('abductive');
    });

    it('should set depth based on premises', () => {
      const next = startReasoningChain(state, 'chain1', 'deductive', ['P1', 'P2', 'P3']);
      expect(next.depth).toBe(3);
    });
  });

  describe('addConclusion', () => {
    it('should add conclusion to active chain', () => {
      let next = startReasoningChain(state, 'chain1', 'deductive', ['P1']);
      next = addConclusion(next, 'Conclusion 1');
      expect(next.activeChain?.conclusions).toContain('Conclusion 1');
    });

    it('should return state if no active chain', () => {
      const next = addConclusion(state, 'Conclusion');
      expect(next.activeChain).toBeNull();
    });
  });

  describe('setReasoningType', () => {
    it('should set reasoning type', () => {
      const next = setReasoningType(state, 'inductive');
      expect(next.reasoningType).toBe('inductive');
    });

    it('should accept all reasoning types', () => {
      const types = ['deductive', 'abductive', 'inductive', 'analogical'] as const;
      types.forEach(type => {
        const next = setReasoningType(state, type);
        expect(next.reasoningType).toBe(type);
      });
    });
  });

  describe('setReasoningState', () => {
    it('should set reasoning state', () => {
      const next = setReasoningState(state, 'converging');
      expect(next.state).toBe('converging');
    });
  });

  describe('computeConclusionConfidence', () => {
    it('should return 0 if no active chain', () => {
      const confidence = computeConclusionConfidence(state);
      expect(confidence).toBe(0);
    });

    it('should compute confidence based on chain properties', () => {
      let next = startReasoningChain(state, 'chain1', 'deductive', ['P1', 'P2']);
      next = addConclusion(next, 'C1');
      const confidence = computeConclusionConfidence(next);
      expect(confidence).toBeGreaterThan(0);
    });
  });

  describe('finalizeChain', () => {
    it('should finalize and return result', () => {
      let next = startReasoningChain(state, 'chain1', 'deductive', ['P1']);
      next = addConclusion(next, 'Conclusion 1');
      const { result } = finalizeChain(next);
      expect(result).toBeTruthy();
    });

    it('should return null if no conclusions', () => {
      let next = startReasoningChain(state, 'chain1', 'deductive', ['P1']);
      const { result } = finalizeChain(next);
      expect(result).toBeNull();
    });

    it('should add to chain history', () => {
      let next = startReasoningChain(state, 'chain1', 'deductive', ['P1']);
      next = addConclusion(next, 'C1');
      const { state: finalized } = finalizeChain(next);
      expect(finalized.chainHistory.length).toBe(1);
    });

    it('should clear active chain after finalize', () => {
      let next = startReasoningChain(state, 'chain1', 'deductive', ['P1']);
      next = addConclusion(next, 'C1');
      const { state: finalized } = finalizeChain(next);
      expect(finalized.activeChain).toBeNull();
    });
  });

  describe('getReasoningReport', () => {
    it('should return comprehensive report', () => {
      const report = getReasoningReport(state);
      expect(typeof report.hasActiveChain).toBe('boolean');
      expect(report.chainCount).toBe(0);
    });

    it('should include recommendations', () => {
      const report = getReasoningReport(state);
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should report active chain status', () => {
      let next = startReasoningChain(state, 'chain1', 'deductive', ['P1']);
      const report = getReasoningReport(next);
      expect(report.hasActiveChain).toBe(true);
    });
  });

  describe('resetNarrativeReasoningState', () => {
    it('should reset all state', () => {
      let next = startReasoningChain(state, 'chain1', 'deductive', ['P1']);
      next = addConclusion(next, 'C1');
      next = finalizeChain(next).state;
      next = resetNarrativeReasoningState();
      expect(next.activeChain).toBeNull();
      expect(next.chainHistory.length).toBe(0);
    });
  });
});