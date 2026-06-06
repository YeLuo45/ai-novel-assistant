/**
 * V1277 NarrativeStoryMeshEngine Tests — Direction I Iter 6/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStoryMeshEngineState,
  addStoryMeshInteraction,
  addStoryMeshLayer,
  getStoryMeshInteractionsByType,
  getStoryMeshReport,
  resetNarrativeStoryMeshEngineState,
  type NarrativeStoryMeshEngineState,
} from './NarrativeStoryMeshEngine';

describe('NarrativeStoryMeshEngine', () => {
  let state: NarrativeStoryMeshEngineState;

  beforeEach(() => { state = createNarrativeStoryMeshEngineState(); });

  describe('createNarrativeStoryMeshEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.interactions.size).toBe(0);
      expect(state.layers.size).toBe(0);
    });
  });

  describe('addStoryMeshInteraction', () => {
    it('should add interaction', () => {
      const next = addStoryMeshInteraction(state, 'i1', 'transcendent', 'overwhelming', 'paradoxical', 'desc', 0.95, 0.9, 1);
      expect(next.interactions.size).toBe(1);
      expect(next.totalInteractions).toBe(1);
    });
  });

  describe('addStoryMeshLayer', () => {
    it('should add layer', () => {
      let next = addStoryMeshInteraction(state, 'i1', 'transcendent', 'overwhelming', 'paradoxical', 'desc', 0.95, 0.9, 1);
      next = addStoryMeshLayer(next, 'l1', ['i1']);
      expect(next.totalLayers).toBe(1);
    });
  });

  describe('getStoryMeshInteractionsByType', () => {
    it('should filter by type', () => {
      let next = addStoryMeshInteraction(state, 'i1', 'transcendent', 'overwhelming', 'paradoxical', 'desc', 0.95, 0.9, 1);
      next = addStoryMeshInteraction(next, 'i2', 'conflict', 'overwhelming', 'paradoxical', 'desc', 0.95, 0.9, 1);
      const transcendent = getStoryMeshInteractionsByType(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getStoryMeshReport', () => {
    it('should return comprehensive report', () => {
      const report = getStoryMeshReport(state);
      expect(report.totalInteractions).toBe(0);
      expect(typeof report.storyMeshMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStoryMeshReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStoryMeshEngineState', () => {
    it('should reset all state', () => {
      let next = addStoryMeshInteraction(state, 'i1', 'transcendent', 'overwhelming', 'paradoxical', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeStoryMeshEngineState();
      expect(next.interactions.size).toBe(0);
      expect(next.totalInteractions).toBe(0);
    });
  });
});