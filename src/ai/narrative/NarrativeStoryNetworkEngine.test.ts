/**
 * V1271 NarrativeStoryNetworkEngine Tests — Direction I Iter 3/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStoryNetworkEngineState,
  addStoryNetworkNode,
  addStoryNetworkCluster,
  getStoryNetworkNodesByType,
  getStoryNetworkReport,
  resetNarrativeStoryNetworkEngineState,
  type NarrativeStoryNetworkEngineState,
} from './NarrativeStoryNetworkEngine';

describe('NarrativeStoryNetworkEngine', () => {
  let state: NarrativeStoryNetworkEngineState;

  beforeEach(() => { state = createNarrativeStoryNetworkEngineState(); });

  describe('createNarrativeStoryNetworkEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.nodes.size).toBe(0);
      expect(state.clusters.size).toBe(0);
    });
  });

  describe('addStoryNetworkNode', () => {
    it('should add node', () => {
      const next = addStoryNetworkNode(state, 'n1', 'transcendent', 'overwhelming', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.nodes.size).toBe(1);
      expect(next.totalNodes).toBe(1);
    });
  });

  describe('addStoryNetworkCluster', () => {
    it('should add cluster', () => {
      let next = addStoryNetworkNode(state, 'n1', 'transcendent', 'overwhelming', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addStoryNetworkCluster(next, 'c1', ['n1']);
      expect(next.totalClusters).toBe(1);
    });
  });

  describe('getStoryNetworkNodesByType', () => {
    it('should filter by type', () => {
      let next = addStoryNetworkNode(state, 'n1', 'transcendent', 'overwhelming', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addStoryNetworkNode(next, 'n2', 'character', 'overwhelming', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getStoryNetworkNodesByType(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getStoryNetworkReport', () => {
    it('should return comprehensive report', () => {
      const report = getStoryNetworkReport(state);
      expect(report.totalNodes).toBe(0);
      expect(typeof report.storyNetworkMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStoryNetworkReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStoryNetworkEngineState', () => {
    it('should reset all state', () => {
      let next = addStoryNetworkNode(state, 'n1', 'transcendent', 'overwhelming', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeStoryNetworkEngineState();
      expect(next.nodes.size).toBe(0);
      expect(next.totalNodes).toBe(0);
    });
  });
});