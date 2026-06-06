/**
 * V1077 NarrativeAnchoringEngine Tests — Direction D Iter 6/20 (Round 6)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAnchoringEngineState,
  addAnchor,
  addAnchorCluster,
  getAnchorsByType,
  getAnchoringReport,
  resetNarrativeAnchoringEngineState,
  type NarrativeAnchoringEngineState,
} from './NarrativeAnchoringEngine';

describe('NarrativeAnchoringEngine', () => {
  let state: NarrativeAnchoringEngineState;

  beforeEach(() => { state = createNarrativeAnchoringEngineState(); });

  describe('createNarrativeAnchoringEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.anchors.size).toBe(0);
      expect(state.clusters.size).toBe(0);
    });
  });

  describe('addAnchor', () => {
    it('should add anchor', () => {
      const next = addAnchor(state, 'a1', 'image', 'compelling', 'leitmotif', 'desc', 0.9, 0.85, 1);
      expect(next.anchors.size).toBe(1);
      expect(next.totalAnchors).toBe(1);
    });
  });

  describe('addAnchorCluster', () => {
    it('should add cluster', () => {
      let next = addAnchor(state, 'a1', 'image', 'compelling', 'leitmotif', 'desc', 0.9, 0.85, 1);
      next = addAnchorCluster(next, 'c1', 'main', ['a1']);
      expect(next.totalClusters).toBe(1);
    });
  });

  describe('getAnchorsByType', () => {
    it('should filter by type', () => {
      let next = addAnchor(state, 'a1', 'image', 'compelling', 'leitmotif', 'desc', 0.9, 0.85, 1);
      next = addAnchor(next, 'a2', 'phrase', 'compelling', 'leitmotif', 'desc', 0.9, 0.85, 1);
      const image = getAnchorsByType(next, 'image');
      expect(image.length).toBe(1);
    });
  });

  describe('getAnchoringReport', () => {
    it('should return comprehensive report', () => {
      const report = getAnchoringReport(state);
      expect(report.totalAnchors).toBe(0);
      expect(typeof report.anchoringMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAnchoringReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAnchoringEngineState', () => {
    it('should reset all state', () => {
      let next = addAnchor(state, 'a1', 'image', 'compelling', 'leitmotif', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeAnchoringEngineState();
      expect(next.anchors.size).toBe(0);
      expect(next.totalAnchors).toBe(0);
    });
  });
});