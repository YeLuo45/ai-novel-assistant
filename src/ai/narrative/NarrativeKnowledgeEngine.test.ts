/**
 * V655 NarrativeKnowledgeEngine Tests — Direction E Iter 4/9
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeKnowledgeState,
  addKnowledgeNode,
  connectKnowledgeNodes,
  queryKnowledge,
  getConceptSubgraph,
  getKnowledgeReport,
  resetNarrativeKnowledgeState,
  type NarrativeKnowledgeState,
} from './NarrativeKnowledgeEngine';

describe('NarrativeKnowledgeEngine', () => {
  let state: NarrativeKnowledgeState;

  beforeEach(() => { state = createNarrativeKnowledgeState(); });

  describe('createNarrativeKnowledgeState', () => {
    it('should initialize with empty nodes', () => {
      expect(state.nodes.size).toBe(0);
      expect(state.activeConcepts.size).toBe(0);
    });

    it('should have default knowledge density', () => {
      expect(state.knowledgeDensity).toBe(0.5);
    });
  });

  describe('addKnowledgeNode', () => {
    it('should add concept node', () => {
      const next = addKnowledgeNode(state, 'c1', 'concept', 'Courage', {}, 0.8);
      expect(next.nodes.size).toBe(1);
      expect(next.nodes.get('c1')?.type).toBe('concept');
    });

    it('should add entity node with properties', () => {
      const next = addKnowledgeNode(state, 'e1', 'entity', 'Hero', { role: 'protagonist' }, 0.9);
      expect(next.nodes.get('e1')?.properties.role).toBe('protagonist');
    });

    it('should add to active concepts', () => {
      const next = addKnowledgeNode(state, 'c1', 'concept', 'Truth', {}, 0.7);
      expect(next.activeConcepts.has('c1')).toBe(true);
    });

    it('should use default weight', () => {
      const next = addKnowledgeNode(state, 'c1', 'concept', 'Default');
      expect(next.nodes.get('c1')?.weight).toBe(0.5);
    });
  });

  describe('connectKnowledgeNodes', () => {
    it('should connect two nodes', () => {
      let next = addKnowledgeNode(state, 'c1', 'concept', 'Courage');
      next = addKnowledgeNode(next, 'c2', 'concept', 'Heroism');
      next = connectKnowledgeNodes(next, 'c1', 'c2');
      expect(next.nodes.get('c1')?.connections).toContain('c2');
      expect(next.nodes.get('c2')?.connections).toContain('c1');
    });

    it('should return state if node not found', () => {
      const next = connectKnowledgeNodes(state, 'unknown', 'other');
      expect(next.nodes.size).toBe(0);
    });
  });

  describe('queryKnowledge', () => {
    it('should return empty for unknown target', () => {
      const result = queryKnowledge(state, { targetId: 'unknown', depth: 2, relationshipType: null });
      expect(result.nodes).toEqual([]);
      expect(result.confidence).toBe(0);
    });

    it('should return target node', () => {
      let next = addKnowledgeNode(state, 'c1', 'concept', 'Courage', {}, 0.8);
      const result = queryKnowledge(next, { targetId: 'c1', depth: 1, relationshipType: null });
      expect(result.nodes.length).toBeGreaterThan(0);
      expect(result.nodes[0]?.nodeId).toBe('c1');
    });

    it('should respect depth parameter', () => {
      let next = addKnowledgeNode(state, 'c1', 'concept', 'Level 0');
      next = addKnowledgeNode(next, 'c2', 'concept', 'Level 1');
      next = addKnowledgeNode(next, 'c3', 'concept', 'Level 2');
      next = connectKnowledgeNodes(next, 'c1', 'c2');
      next = connectKnowledgeNodes(next, 'c2', 'c3');
      const result = queryKnowledge(next, { targetId: 'c1', depth: 1, relationshipType: null });
      expect(result.pathLength).toBeLessThanOrEqual(1);
    });
  });

  describe('getConceptSubgraph', () => {
    it('should return subgraph around concept', () => {
      let next = addKnowledgeNode(state, 'c1', 'concept', 'Core');
      next = addKnowledgeNode(next, 'c2', 'concept', 'Related');
      next = connectKnowledgeNodes(next, 'c1', 'c2');
      const subgraph = getConceptSubgraph(next, 'c1');
      expect(subgraph.length).toBeGreaterThan(0);
    });
  });

  describe('getKnowledgeReport', () => {
    it('should return comprehensive report', () => {
      const report = getKnowledgeReport(state);
      expect(report.nodeCount).toBe(0);
      expect(typeof report.knowledgeDensity).toBe('number');
    });

    it('should count nodes and connections', () => {
      let next = addKnowledgeNode(state, 'c1', 'concept', 'One');
      next = addKnowledgeNode(next, 'c2', 'concept', 'Two');
      next = connectKnowledgeNodes(next, 'c1', 'c2');
      const report = getKnowledgeReport(next);
      expect(report.nodeCount).toBe(2);
      expect(report.connectionCount).toBe(1);
    });

    it('should include recommendations', () => {
      const report = getKnowledgeReport(state);
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeKnowledgeState', () => {
    it('should reset all knowledge', () => {
      let next = addKnowledgeNode(state, 'c1', 'concept', 'Courage', {}, 0.8);
      next = addKnowledgeNode(next, 'c2', 'concept', 'Truth', {}, 0.7);
      next = connectKnowledgeNodes(next, 'c1', 'c2');
      next = resetNarrativeKnowledgeState();
      expect(next.nodes.size).toBe(0);
      expect(next.totalConnections).toBe(0);
    });
  });
});