/**
 * V1057 NarrativePoeticsEngine Tests — Direction C Iter 16/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativePoeticsEngineState,
  addNarrativePoetic,
  addPoeticLayer,
  getPoeticsByDevice,
  getPoeticsReport,
  resetNarrativePoeticsEngineState,
  type NarrativePoeticsEngineState,
} from './NarrativePoeticsEngine';

describe('NarrativePoeticsEngine', () => {
  let state: NarrativePoeticsEngineState;

  beforeEach(() => { state = createNarrativePoeticsEngineState(); });

  describe('createNarrativePoeticsEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.poetics.size).toBe(0);
      expect(state.layers.size).toBe(0);
    });
  });

  describe('addNarrativePoetic', () => {
    it('should add poetic', () => {
      const next = addNarrativePoetic(state, 'p1', 'imagery', 'lyric', 'multivalent', 'desc', 0.8, 0.9, 1);
      expect(next.poetics.size).toBe(1);
      expect(next.totalPoetics).toBe(1);
    });
  });

  describe('addPoeticLayer', () => {
    it('should add layer', () => {
      let next = addNarrativePoetic(state, 'p1', 'imagery', 'lyric', 'multivalent', 'desc', 0.8, 0.9, 1);
      next = addPoeticLayer(next, 'l1', ['p1']);
      expect(next.totalLayers).toBe(1);
    });
  });

  describe('getPoeticsByDevice', () => {
    it('should filter by device', () => {
      let next = addNarrativePoetic(state, 'p1', 'imagery', 'lyric', 'multivalent', 'desc', 0.8, 0.9, 1);
      next = addNarrativePoetic(next, 'p2', 'symbol', 'lyric', 'multivalent', 'desc', 0.8, 0.9, 1);
      const imagery = getPoeticsByDevice(next, 'imagery');
      expect(imagery.length).toBe(1);
    });
  });

  describe('getPoeticsReport', () => {
    it('should return comprehensive report', () => {
      const report = getPoeticsReport(state);
      expect(report.totalPoetics).toBe(0);
      expect(typeof report.poeticsMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getPoeticsReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativePoeticsEngineState', () => {
    it('should reset all state', () => {
      let next = addNarrativePoetic(state, 'p1', 'imagery', 'lyric', 'multivalent', 'desc', 0.8, 0.9, 1);
      next = resetNarrativePoeticsEngineState();
      expect(next.poetics.size).toBe(0);
      expect(next.totalPoetics).toBe(0);
    });
  });
});