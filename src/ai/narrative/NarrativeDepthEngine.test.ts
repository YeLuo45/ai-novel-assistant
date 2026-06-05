/**
 * V783 NarrativeDepthEngine Tests — Direction C Iter 5/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeDepthEngineState,
  addDepthMarker,
  discoverDepthMarker,
  addSubtextElement,
  getMarkersByLayer,
  getSubtextsByComplexity,
  getDepthReport,
  resetNarrativeDepthEngineState,
  type NarrativeDepthEngineState,
} from './NarrativeDepthEngine';

describe('NarrativeDepthEngine', () => {
  let state: NarrativeDepthEngineState;

  beforeEach(() => { state = createNarrativeDepthEngineState(); });

  describe('createNarrativeDepthEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.markers.size).toBe(0);
      expect(state.subtexts.size).toBe(0);
    });
  });

  describe('addDepthMarker', () => {
    it('should add marker', () => {
      const next = addDepthMarker(state, 'm1', 'symbolic', 'Chapter 1', 'A recurring symbol', 'deep', 0.8);
      expect(next.markers.size).toBe(1);
      expect(next.totalMarkers).toBe(1);
    });

    it('should clamp impact', () => {
      const next = addDepthMarker(state, 'm1', 'symbolic', 'loc', 'desc', 'deep', 1.5);
      expect(next.markers.get('m1')?.impact).toBe(1);
    });
  });

  describe('discoverDepthMarker', () => {
    it('should discover', () => {
      let next = addDepthMarker(state, 'm1', 'symbolic', 'loc', 'desc');
      next = discoverDepthMarker(next, 'm1');
      expect(next.markers.get('m1')?.discovered).toBe(true);
      expect(next.discoveredMarkers).toBe(1);
    });
  });

  describe('addSubtextElement', () => {
    it('should add subtext', () => {
      const next = addSubtextElement(state, 's1', 'It is a fine day', 'Hidden meaning', 'symbolic', 'nuanced', 0.8);
      expect(next.subtexts.size).toBe(1);
      expect(next.totalSubtexts).toBe(1);
    });
  });

  describe('getMarkersByLayer', () => {
    it('should filter by layer', () => {
      let next = addDepthMarker(state, 'm1', 'symbolic', 'loc', 'desc');
      next = addDepthMarker(next, 'm2', 'archetypal', 'loc', 'desc');
      const symbolic = getMarkersByLayer(next, 'symbolic');
      expect(symbolic.length).toBe(1);
    });
  });

  describe('getSubtextsByComplexity', () => {
    it('should filter by complexity', () => {
      let next = addSubtextElement(state, 's1', 'text', 'sub', 'symbolic', 'simple');
      next = addSubtextElement(next, 's2', 'text', 'sub', 'symbolic', 'nuanced');
      const nuanced = getSubtextsByComplexity(next, 'nuanced');
      expect(nuanced.length).toBe(1);
    });
  });

  describe('getDepthReport', () => {
    it('should return comprehensive report', () => {
      const report = getDepthReport(state);
      expect(report.totalMarkers).toBe(0);
      expect(typeof report.depthScore).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getDepthReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeDepthEngineState', () => {
    it('should reset all state', () => {
      let next = addDepthMarker(state, 'm1', 'symbolic', 'loc', 'desc');
      next = resetNarrativeDepthEngineState();
      expect(next.markers.size).toBe(0);
      expect(next.totalMarkers).toBe(0);
    });
  });
});