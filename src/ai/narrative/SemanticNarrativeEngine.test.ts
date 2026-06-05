/**
 * V723 SemanticNarrativeEngine Tests — Direction E Iter 2/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSemanticNarrativeState,
  addSemanticNode,
  addSemanticRelation,
  getNodesByType,
  getRelationsFromNode,
  getRelationsToNode,
  getSemanticNeighborhood,
  computeSemanticSimilarity,
  getSemanticReport,
  resetSemanticNarrativeState,
  type SemanticNarrativeState,
} from './SemanticNarrativeEngine';

describe('SemanticNarrativeEngine', () => {
  let state: SemanticNarrativeState;

  beforeEach(() => { state = createSemanticNarrativeState(); });

  describe('createSemanticNarrativeState', () => {
    it('should initialize with defaults', () => {
      expect(state.nodes.size).toBe(0);
      expect(state.relations.size).toBe(0);
    });
  });

  describe('addSemanticNode', () => {
    it('should add node', () => {
      const next = addSemanticNode(state, 'n1', 'entity', 'Hero', 'subject', 0.8, 'deep', [0.1, 0.2, 0.3]);
      expect(next.nodes.size).toBe(1);
      expect(next.totalNodes).toBe(1);
    });

    it('should track type distribution', () => {
      let next = addSemanticNode(state, 'n1', 'entity', 'Hero', 'subject');
      next = addSemanticNode(next, 'n2', 'action', 'fights', 'predicate');
      expect(next.typeDistribution.get('entity')).toBe(1);
      expect(next.typeDistribution.get('action')).toBe(1);
    });
  });

  describe('addSemanticRelation', () => {
    it('should add relation', () => {
      let next = addSemanticNode(state, 'n1', 'entity', 'Hero', 'subject');
      next = addSemanticNode(next, 'n2', 'entity', 'Villain', 'object');
      next = addSemanticRelation(next, 'r1', 'n1', 'n2', 'opposes', 0.9, 'main conflict');
      expect(next.relations.size).toBe(1);
    });
  });

  describe('getNodesByType', () => {
    it('should filter by type', () => {
      let next = addSemanticNode(state, 'n1', 'entity', 'Hero', 'subject');
      next = addSemanticNode(next, 'n2', 'action', 'fights', 'predicate');
      const entities = getNodesByType(next, 'entity');
      expect(entities.length).toBe(1);
    });
  });

  describe('getRelationsFromNode', () => {
    it('should return outgoing relations', () => {
      let next = addSemanticNode(state, 'n1', 'entity', 'A', 'subject');
      next = addSemanticNode(next, 'n2', 'entity', 'B', 'object');
      next = addSemanticRelation(next, 'r1', 'n1', 'n2', 'rel');
      const relations = getRelationsFromNode(next, 'n1');
      expect(relations.length).toBe(1);
    });
  });

  describe('getRelationsToNode', () => {
    it('should return incoming relations', () => {
      let next = addSemanticNode(state, 'n1', 'entity', 'A', 'subject');
      next = addSemanticNode(next, 'n2', 'entity', 'B', 'object');
      next = addSemanticRelation(next, 'r1', 'n1', 'n2', 'rel');
      const relations = getRelationsToNode(next, 'n2');
      expect(relations.length).toBe(1);
    });
  });

  describe('getSemanticNeighborhood', () => {
    it('should return neighborhood at depth 1', () => {
      let next = addSemanticNode(state, 'n1', 'entity', 'A', 'subject');
      next = addSemanticNode(next, 'n2', 'entity', 'B', 'object');
      next = addSemanticRelation(next, 'r1', 'n1', 'n2', 'rel');
      const neighborhood = getSemanticNeighborhood(next, 'n1', 1);
      expect(neighborhood.length).toBe(2);
    });

    it('should respect depth parameter', () => {
      let next = addSemanticNode(state, 'n1', 'entity', 'A', 'subject');
      next = addSemanticNode(next, 'n2', 'entity', 'B', 'object');
      next = addSemanticNode(next, 'n3', 'entity', 'C', 'object');
      next = addSemanticRelation(next, 'r1', 'n1', 'n2', 'rel');
      next = addSemanticRelation(next, 'r2', 'n2', 'n3', 'rel');
      const deep = getSemanticNeighborhood(next, 'n1', 2);
      expect(deep.length).toBe(3);
    });
  });

  describe('computeSemanticSimilarity', () => {
    it('should return 0 for missing nodes', () => {
      expect(computeSemanticSimilarity(state, 'n1', 'n2')).toBe(0);
    });

    it('should return high similarity for identical embeddings', () => {
      let next = addSemanticNode(state, 'n1', 'entity', 'A', 'subject', 0.5, 'surface', [0.1, 0.2, 0.3]);
      next = addSemanticNode(next, 'n2', 'entity', 'B', 'subject', 0.5, 'surface', [0.1, 0.2, 0.3]);
      const similarity = computeSemanticSimilarity(next, 'n1', 'n2');
      expect(similarity).toBeCloseTo(1, 1);
    });

    it('should return low similarity for different embeddings', () => {
      let next = addSemanticNode(state, 'n1', 'entity', 'A', 'subject', 0.5, 'surface', [0, 0, 0]);
      next = addSemanticNode(next, 'n2', 'entity', 'B', 'subject', 0.5, 'surface', [1, 1, 1]);
      const similarity = computeSemanticSimilarity(next, 'n1', 'n2');
      expect(similarity).toBeLessThan(0.5);
    });
  });

  describe('getSemanticReport', () => {
    it('should return comprehensive report', () => {
      const report = getSemanticReport(state);
      expect(report.totalNodes).toBe(0);
      expect(typeof report.semanticDensity).toBe('number');
    });

    it('should include type distribution', () => {
      let next = addSemanticNode(state, 'n1', 'entity', 'A', 'subject');
      const report = getSemanticReport(next);
      expect(report.typeDistribution.entity).toBe(1);
    });

    it('should include recommendations for empty state', () => {
      const report = getSemanticReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetSemanticNarrativeState', () => {
    it('should reset all state', () => {
      let next = addSemanticNode(state, 'n1', 'entity', 'A', 'subject');
      next = resetSemanticNarrativeState();
      expect(next.nodes.size).toBe(0);
      expect(next.totalNodes).toBe(0);
    });
  });
});