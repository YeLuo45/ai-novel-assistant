/**
 * V949 NarrativeSynthesisEngine Tests — Direction E Iter 7/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeSynthesisEngineState,
  addSynthesisElement,
  addSynthesisPattern,
  useSynthesisPattern,
  getElementsByType,
  getSynthesisReport,
  resetNarrativeSynthesisEngineState,
  type NarrativeSynthesisEngineState,
} from './NarrativeSynthesisEngine';

describe('NarrativeSynthesisEngine', () => {
  let state: NarrativeSynthesisEngineState;

  beforeEach(() => { state = createNarrativeSynthesisEngineState(); });

  describe('createNarrativeSynthesisEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.elements.size).toBe(0);
      expect(state.patterns.size).toBe(0);
    });
  });

  describe('addSynthesisElement', () => {
    it('should add element', () => {
      const next = addSynthesisElement(state, 'e1', 'thematic', 'combine', ['i1', 'i2'], 'output', 0.7, 1);
      expect(next.elements.size).toBe(1);
      expect(next.totalElements).toBe(1);
    });
  });

  describe('addSynthesisPattern', () => {
    it('should add pattern', () => {
      let next = addSynthesisElement(state, 'e1', 'thematic', 'combine', ['i1', 'i2'], 'output', 0.7, 1);
      next = addSynthesisPattern(next, 'p1', 'thematic fusion', ['e1']);
      expect(next.totalPatterns).toBe(1);
    });
  });

  describe('useSynthesisPattern', () => {
    it('should use', () => {
      let next = addSynthesisElement(state, 'e1', 'thematic', 'combine', ['i1', 'i2'], 'output', 0.7, 1);
      next = addSynthesisPattern(next, 'p1', 'name', ['e1']);
      next = useSynthesisPattern(next, 'p1');
      expect(next.patterns.get('p1')?.reuse).toBe(1);
    });
  });

  describe('getElementsByType', () => {
    it('should filter by type', () => {
      let next = addSynthesisElement(state, 'e1', 'thematic', 'combine', ['i1'], 'output', 0.7, 1);
      next = addSynthesisElement(next, 'e2', 'character', 'combine', ['i1'], 'output', 0.7, 1);
      const thematic = getElementsByType(next, 'thematic');
      expect(thematic.length).toBe(1);
    });
  });

  describe('getSynthesisReport', () => {
    it('should return comprehensive report', () => {
      const report = getSynthesisReport(state);
      expect(report.totalElements).toBe(0);
      expect(typeof report.synthesisMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getSynthesisReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeSynthesisEngineState', () => {
    it('should reset all state', () => {
      let next = addSynthesisElement(state, 'e1', 'thematic', 'combine', ['i1'], 'output', 0.7, 1);
      next = resetNarrativeSynthesisEngineState();
      expect(next.elements.size).toBe(0);
      expect(next.totalElements).toBe(0);
    });
  });
});