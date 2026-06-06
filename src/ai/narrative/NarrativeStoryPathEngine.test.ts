/**
 * V1293 NarrativeStoryPathEngine Tests — Direction I Iter 14/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStoryPathEngineState,
  addStoryPathNode,
  addStoryPathSegment,
  getStoryPathNodesByType,
  getStoryPathReport,
  resetNarrativeStoryPathEngineState,
  type NarrativeStoryPathEngineState,
} from './NarrativeStoryPathEngine';

describe('NarrativeStoryPathEngine', () => {
  let state: NarrativeStoryPathEngineState;

  beforeEach(() => { state = createNarrativeStoryPathEngineState(); });

  describe('createNarrativeStoryPathEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.paths.size).toBe(0);
      expect(state.segments.size).toBe(0);
    });
  });

  describe('addStoryPathNode', () => {
    it('should add path', () => {
      const next = addStoryPathNode(state, 'p1', 'quantum', 'insurmountable', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.paths.size).toBe(1);
      expect(next.totalPaths).toBe(1);
    });
  });

  describe('addStoryPathSegment', () => {
    it('should add segment', () => {
      let next = addStoryPathNode(state, 'p1', 'quantum', 'insurmountable', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addStoryPathSegment(next, 's1', ['p1']);
      expect(next.totalSegments).toBe(1);
    });
  });

  describe('getStoryPathNodesByType', () => {
    it('should filter by type', () => {
      let next = addStoryPathNode(state, 'p1', 'quantum', 'insurmountable', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addStoryPathNode(next, 'p2', 'straight', 'insurmountable', 'transcendent', 'desc', 0.95, 0.9, 1);
      const quantum = getStoryPathNodesByType(next, 'quantum');
      expect(quantum.length).toBe(1);
    });
  });

  describe('getStoryPathReport', () => {
    it('should return comprehensive report', () => {
      const report = getStoryPathReport(state);
      expect(report.totalPaths).toBe(0);
      expect(typeof report.storyPathMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStoryPathReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStoryPathEngineState', () => {
    it('should reset all state', () => {
      let next = addStoryPathNode(state, 'p1', 'quantum', 'insurmountable', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeStoryPathEngineState();
      expect(next.paths.size).toBe(0);
      expect(next.totalPaths).toBe(0);
    });
  });
});