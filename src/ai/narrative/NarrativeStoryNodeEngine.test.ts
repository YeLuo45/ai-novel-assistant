/**
 * V1297 NarrativeStoryNodeEngine Tests — Direction I Iter 16/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStoryNodeEngineState,
  addStoryNode,
  addStoryNodeCluster,
  getStoryNodesByType,
  getStoryNodeReport,
  resetNarrativeStoryNodeEngineState,
  type NarrativeStoryNodeEngineState,
} from './NarrativeStoryNodeEngine';

describe('NarrativeStoryNodeEngine', () => {
  let state: NarrativeStoryNodeEngineState;

  beforeEach(() => { state = createNarrativeStoryNodeEngineState(); });

  describe('createNarrativeStoryNodeEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.nodes.size).toBe(0);
      expect(state.clusters.size).toBe(0);
    });
  });

  describe('addStoryNode', () => {
    it('should add node', () => {
      const next = addStoryNode(state, 'n1', 'transcendent', 'epochal', 'infinite', 'desc', 0.95, 0.9, 1);
      expect(next.nodes.size).toBe(1);
      expect(next.totalNodes).toBe(1);
    });
  });

  describe('addStoryNodeCluster', () => {
    it('should add cluster', () => {
      let next = addStoryNode(state, 'n1', 'transcendent', 'epochal', 'infinite', 'desc', 0.95, 0.9, 1);
      next = addStoryNodeCluster(next, 'c1', ['n1']);
      expect(next.totalClusters).toBe(1);
    });
  });

  describe('getStoryNodesByType', () => {
    it('should filter by type', () => {
      let next = addStoryNode(state, 'n1', 'transcendent', 'epochal', 'infinite', 'desc', 0.95, 0.9, 1);
      next = addStoryNode(next, 'n2', 'event', 'epochal', 'infinite', 'desc', 0.95, 0.9, 1);
      const transcendent = getStoryNodesByType(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getStoryNodeReport', () => {
    it('should return comprehensive report', () => {
      const report = getStoryNodeReport(state);
      expect(report.totalNodes).toBe(0);
      expect(typeof report.storyNodeMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStoryNodeReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStoryNodeEngineState', () => {
    it('should reset all state', () => {
      let next = addStoryNode(state, 'n1', 'transcendent', 'epochal', 'infinite', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeStoryNodeEngineState();
      expect(next.nodes.size).toBe(0);
      expect(next.totalNodes).toBe(0);
    });
  });
});