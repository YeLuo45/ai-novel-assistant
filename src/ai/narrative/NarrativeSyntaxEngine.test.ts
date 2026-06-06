/**
 * V1177 NarrativeSyntaxEngine Tests — Direction F Iter 16/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeSyntaxEngineState,
  addSyntax,
  addSyntaxLayer,
  getSyntaxesByPattern,
  getSyntaxReport,
  resetNarrativeSyntaxEngineState,
  type NarrativeSyntaxEngineState,
} from './NarrativeSyntaxEngine';

describe('NarrativeSyntaxEngine', () => {
  let state: NarrativeSyntaxEngineState;

  beforeEach(() => { state = createNarrativeSyntaxEngineState(); });

  describe('createNarrativeSyntaxEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.syntaxes.size).toBe(0);
      expect(state.layers.size).toBe(0);
    });
  });

  describe('addSyntax', () => {
    it('should add syntax', () => {
      const next = addSyntax(state, 's1', 'anaphora', 'complex', 'varied', 'desc', 0.9, 0.85, 1);
      expect(next.syntaxes.size).toBe(1);
      expect(next.totalSyntaxes).toBe(1);
    });
  });

  describe('addSyntaxLayer', () => {
    it('should add layer', () => {
      let next = addSyntax(state, 's1', 'anaphora', 'complex', 'varied', 'desc', 0.9, 0.85, 1);
      next = addSyntaxLayer(next, 'l1', ['s1']);
      expect(next.totalLayers).toBe(1);
    });
  });

  describe('getSyntaxesByPattern', () => {
    it('should filter by pattern', () => {
      let next = addSyntax(state, 's1', 'anaphora', 'complex', 'varied', 'desc', 0.9, 0.85, 1);
      next = addSyntax(next, 's2', 'chiasmus', 'complex', 'varied', 'desc', 0.9, 0.85, 1);
      const anaphora = getSyntaxesByPattern(next, 'anaphora');
      expect(anaphora.length).toBe(1);
    });
  });

  describe('getSyntaxReport', () => {
    it('should return comprehensive report', () => {
      const report = getSyntaxReport(state);
      expect(report.totalSyntaxes).toBe(0);
      expect(typeof report.syntaxMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getSyntaxReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeSyntaxEngineState', () => {
    it('should reset all state', () => {
      let next = addSyntax(state, 's1', 'anaphora', 'complex', 'varied', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeSyntaxEngineState();
      expect(next.syntaxes.size).toBe(0);
      expect(next.totalSyntaxes).toBe(0);
    });
  });
});