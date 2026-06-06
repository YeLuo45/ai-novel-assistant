/**
 * V877 NarrativeSemanticsEngine Tests — Direction C Iter 1/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeSemanticsEngineState,
  addSemanticUnit,
  addSemanticRelation,
  createSemanticField,
  addInterpretation,
  getUnitsByContext,
  getSemanticsReport,
  resetNarrativeSemanticsEngineState,
  type NarrativeSemanticsEngineState,
} from './NarrativeSemanticsEngine';

describe('NarrativeSemanticsEngine', () => {
  let state: NarrativeSemanticsEngineState;

  beforeEach(() => { state = createNarrativeSemanticsEngineState(); });

  describe('createNarrativeSemanticsEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.units.size).toBe(0);
      expect(state.fields.size).toBe(0);
    });
  });

  describe('addSemanticUnit', () => {
    it('should add unit', () => {
      const next = addSemanticUnit(state, 'u1', 'rose', 'literal', 'moderate', 0.7);
      expect(next.units.size).toBe(1);
      expect(next.totalUnits).toBe(1);
    });

    it('should clamp resonance', () => {
      const next = addSemanticUnit(state, 'u1', 'text', 'literal', 'moderate', 1.5);
      expect(next.units.get('u1')?.resonance).toBe(1);
    });
  });

  describe('addSemanticRelation', () => {
    it('should add relation', () => {
      let next = addSemanticUnit(state, 'u1', 'rose');
      next = addSemanticUnit(next, 'u2', 'thorn');
      next = addSemanticRelation(next, 'u1', 'u2', 'metaphor');
      expect(next.units.get('u1')?.relations.get('u2')).toBe('metaphor');
    });
  });

  describe('createSemanticField', () => {
    it('should create field', () => {
      let next = addSemanticUnit(state, 'u1', 'rose');
      next = createSemanticField(next, 'f1', 'flower field', ['u1']);
      expect(next.totalFields).toBe(1);
    });
  });

  describe('addInterpretation', () => {
    it('should add interpretation', () => {
      let next = addSemanticUnit(state, 'u1', 'rose');
      next = addInterpretation(next, 'u1', 'love');
      expect(next.units.get('u1')?.interpretations.length).toBe(1);
    });
  });

  describe('getUnitsByContext', () => {
    it('should filter by context', () => {
      let next = addSemanticUnit(state, 'u1', 'text', 'literal');
      next = addSemanticUnit(next, 'u2', 'text', 'cultural');
      const literal = getUnitsByContext(next, 'literal');
      expect(literal.length).toBe(1);
    });
  });

  describe('getSemanticsReport', () => {
    it('should return comprehensive report', () => {
      const report = getSemanticsReport(state);
      expect(report.totalUnits).toBe(0);
      expect(typeof report.semanticRichness).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getSemanticsReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeSemanticsEngineState', () => {
    it('should reset all state', () => {
      let next = addSemanticUnit(state, 'u1', 'text');
      next = resetNarrativeSemanticsEngineState();
      expect(next.units.size).toBe(0);
      expect(next.totalUnits).toBe(0);
    });
  });
});