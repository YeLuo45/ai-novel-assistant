/**
 * V941 NarrativeConceptEngine Tests — Direction E Iter 3/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeConceptEngineState,
  addConcept,
  matureConcept,
  addConceptRelation,
  getConceptsByType,
  getConceptReport,
  resetNarrativeConceptEngineState,
  type NarrativeConceptEngineState,
} from './NarrativeConceptEngine';

describe('NarrativeConceptEngine', () => {
  let state: NarrativeConceptEngineState;

  beforeEach(() => { state = createNarrativeConceptEngineState(); });

  describe('createNarrativeConceptEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.concepts.size).toBe(0);
      expect(state.relations.size).toBe(0);
    });
  });

  describe('addConcept', () => {
    it('should add concept', () => {
      const next = addConcept(state, 'c1', 'thematic', 'love', 'desc', 1, 'universal', 0.8);
      expect(next.concepts.size).toBe(1);
      expect(next.totalConcepts).toBe(1);
    });
  });

  describe('matureConcept', () => {
    it('should mature', () => {
      let next = addConcept(state, 'c1', 'thematic', 'love', 'desc', 1);
      next = matureConcept(next, 'c1', 'crystallized');
      expect(next.concepts.get('c1')?.maturity).toBe('crystallized');
    });
  });

  describe('addConceptRelation', () => {
    it('should add relation', () => {
      const next = addConceptRelation(state, 'r1', 'c1', 'c2', 'analogy', 0.7);
      expect(next.totalRelations).toBe(1);
    });
  });

  describe('getConceptsByType', () => {
    it('should filter by type', () => {
      let next = addConcept(state, 'c1', 'thematic', 'love', 'desc', 1);
      next = addConcept(next, 'c2', 'moral', 'good', 'desc', 1);
      const thematic = getConceptsByType(next, 'thematic');
      expect(thematic.length).toBe(1);
    });
  });

  describe('getConceptReport', () => {
    it('should return comprehensive report', () => {
      const report = getConceptReport(state);
      expect(report.totalConcepts).toBe(0);
      expect(typeof report.conceptualMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getConceptReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeConceptEngineState', () => {
    it('should reset all state', () => {
      let next = addConcept(state, 'c1', 'thematic', 'love', 'desc', 1);
      next = resetNarrativeConceptEngineState();
      expect(next.concepts.size).toBe(0);
      expect(next.totalConcepts).toBe(0);
    });
  });
});