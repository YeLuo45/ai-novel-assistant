/**
 * V881 CharacterNetworkEngine Tests — Direction C Iter 3/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCharacterNetworkEngineState,
  addNetworkNode,
  addNetworkEdge,
  evolveNetworkEdge,
  getNodesByType,
  getNetworkReport,
  resetCharacterNetworkEngineState,
  type CharacterNetworkEngineState,
} from './CharacterNetworkEngine';

describe('CharacterNetworkEngine', () => {
  let state: CharacterNetworkEngineState;

  beforeEach(() => { state = createCharacterNetworkEngineState(); });

  describe('createCharacterNetworkEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.nodes.size).toBe(0);
      expect(state.edges.size).toBe(0);
    });
  });

  describe('addNetworkNode', () => {
    it('should add node', () => {
      const next = addNetworkNode(state, 'n1', 'c1', 'protagonist', 0.9);
      expect(next.nodes.size).toBe(1);
      expect(next.totalNodes).toBe(1);
    });
  });

  describe('addNetworkEdge', () => {
    it('should add edge', () => {
      let next = addNetworkNode(state, 'n1', 'c1', 'protagonist');
      next = addNetworkNode(next, 'n2', 'c2', 'ally');
      next = addNetworkEdge(next, 'e1', 'n1', 'n2', 'friendship', 0.7);
      expect(next.totalEdges).toBe(1);
    });

    it('should update connections count', () => {
      let next = addNetworkNode(state, 'n1', 'c1', 'protagonist');
      next = addNetworkNode(next, 'n2', 'c2', 'ally');
      next = addNetworkEdge(next, 'e1', 'n1', 'n2', 'friendship');
      expect(next.nodes.get('n1')?.connections).toBe(1);
    });
  });

  describe('evolveNetworkEdge', () => {
    it('should evolve', () => {
      let next = addNetworkNode(state, 'n1', 'c1', 'protagonist');
      next = addNetworkNode(next, 'n2', 'c2', 'ally');
      next = addNetworkEdge(next, 'e1', 'n1', 'n2', 'friendship');
      next = evolveNetworkEdge(next, 'e1', 0.3);
      expect(next.edges.get('e1')?.evolution).toBe(0.3);
    });
  });

  describe('getNodesByType', () => {
    it('should filter by type', () => {
      let next = addNetworkNode(state, 'n1', 'c1', 'protagonist');
      next = addNetworkNode(next, 'n2', 'c2', 'antagonist');
      const protagonists = getNodesByType(next, 'protagonist');
      expect(protagonists.length).toBe(1);
    });
  });

  describe('getNetworkReport', () => {
    it('should return comprehensive report', () => {
      const report = getNetworkReport(state);
      expect(report.totalNodes).toBe(0);
      expect(typeof report.networkComplexity).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getNetworkReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetCharacterNetworkEngineState', () => {
    it('should reset all state', () => {
      let next = addNetworkNode(state, 'n1', 'c1', 'protagonist');
      next = resetCharacterNetworkEngineState();
      expect(next.nodes.size).toBe(0);
      expect(next.totalNodes).toBe(0);
    });
  });
});