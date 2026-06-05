/**
 * V727 NarrativeReasoningCore Tests — Direction E Iter 4/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeReasoningCoreState,
  createReasoningChain,
  setConclusion,
  invalidateChain,
  revalidateChain,
  getChainsByType,
  getValidChains,
  inferConclusion,
  getReasoningReport,
  resetNarrativeReasoningCoreState,
  type NarrativeReasoningCoreState,
} from './NarrativeReasoningCore';

describe('NarrativeReasoningCore', () => {
  let state: NarrativeReasoningCoreState;

  beforeEach(() => { state = createNarrativeReasoningCoreState(); });

  describe('createNarrativeReasoningCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.chains.size).toBe(0);
      expect(state.totalChains).toBe(0);
    });
  });

  describe('createReasoningChain', () => {
    it('should create chain', () => {
      const next = createReasoningChain(state, 'c1', 'deductive', ['All heroes are brave', 'Alice is a hero']);
      expect(next.chains.size).toBe(1);
      expect(next.totalChains).toBe(1);
    });

    it('should infer confidence from type', () => {
      const next = createReasoningChain(state, 'c1', 'deductive', ['premise']);
      expect(next.chains.get('c1')?.confidence).toBe('certain');
    });

    it('should track type distribution', () => {
      let next = createReasoningChain(state, 'c1', 'deductive', ['p1']);
      next = createReasoningChain(next, 'c2', 'inductive', ['p2']);
      expect(next.typeDistribution.get('deductive')).toBe(1);
      expect(next.typeDistribution.get('inductive')).toBe(1);
    });
  });

  describe('setConclusion', () => {
    it('should set conclusion', () => {
      let next = createReasoningChain(state, 'c1', 'deductive', ['premise']);
      next = setConclusion(next, 'c1', 'Therefore Alice is brave');
      expect(next.chains.get('c1')?.conclusion).toBe('Therefore Alice is brave');
    });
  });

  describe('invalidateChain', () => {
    it('should invalidate', () => {
      let next = createReasoningChain(state, 'c1', 'deductive', ['premise']);
      next = invalidateChain(next, 'c1');
      expect(next.chains.get('c1')?.valid).toBe(false);
    });
  });

  describe('revalidateChain', () => {
    it('should revalidate', () => {
      let next = createReasoningChain(state, 'c1', 'deductive', ['premise']);
      next = invalidateChain(next, 'c1');
      next = revalidateChain(next, 'c1');
      expect(next.chains.get('c1')?.valid).toBe(true);
    });
  });

  describe('getChainsByType', () => {
    it('should filter by type', () => {
      let next = createReasoningChain(state, 'c1', 'deductive', ['p1']);
      next = createReasoningChain(next, 'c2', 'inductive', ['p2']);
      const deductive = getChainsByType(next, 'deductive');
      expect(deductive.length).toBe(1);
    });
  });

  describe('getValidChains', () => {
    it('should return only valid chains', () => {
      let next = createReasoningChain(state, 'c1', 'deductive', ['p1']);
      next = createReasoningChain(next, 'c2', 'inductive', ['p2']);
      next = invalidateChain(next, 'c2');
      const valid = getValidChains(next);
      expect(valid.length).toBe(1);
    });
  });

  describe('inferConclusion', () => {
    it('should return message for no abductive chains', () => {
      const result = inferConclusion(state, 'observation');
      expect(result).toBe('No abductive basis');
    });

    it('should find best matching abductive chain', () => {
      let next = createReasoningChain(state, 'c1', 'abductive', ['Hero saves the day', 'Hero is brave']);
      next = setConclusion(next, 'c1', 'Hero is brave');
      const result = inferConclusion(next, 'Hero saves');
      expect(result).toBe('Hero is brave');
    });
  });

  describe('getReasoningReport', () => {
    it('should return comprehensive report', () => {
      const report = getReasoningReport(state);
      expect(report.totalChains).toBe(0);
      expect(typeof report.abductivePower).toBe('number');
    });

    it('should include type distribution', () => {
      let next = createReasoningChain(state, 'c1', 'deductive', ['p1']);
      const report = getReasoningReport(next);
      expect(report.typeDistribution.deductive).toBe(1);
    });

    it('should include recommendations for empty state', () => {
      const report = getReasoningReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeReasoningCoreState', () => {
    it('should reset all state', () => {
      let next = createReasoningChain(state, 'c1', 'deductive', ['p1']);
      next = resetNarrativeReasoningCoreState();
      expect(next.chains.size).toBe(0);
      expect(next.totalChains).toBe(0);
    });
  });
});