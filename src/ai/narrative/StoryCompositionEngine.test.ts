/**
 * V873 StoryCompositionEngine Tests — Direction B Iter 14/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createStoryCompositionEngineState,
  addCompositionPiece,
  createCompositionLayer,
  getPiecesByElement,
  getCompositionReport,
  resetStoryCompositionEngineState,
  type StoryCompositionEngineState,
} from './StoryCompositionEngine';

describe('StoryCompositionEngine', () => {
  let state: StoryCompositionEngineState;

  beforeEach(() => { state = createStoryCompositionEngineState(); });

  describe('createStoryCompositionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.pieces.size).toBe(0);
      expect(state.layers.size).toBe(0);
    });
  });

  describe('addCompositionPiece', () => {
    it('should add piece', () => {
      const next = addCompositionPiece(state, 'p1', 'opening', 'desc', 0, 500, 1, 0.7);
      expect(next.pieces.size).toBe(1);
      expect(next.totalPieces).toBe(1);
    });
  });

  describe('createCompositionLayer', () => {
    it('should create layer', () => {
      const next = createCompositionLayer(state, 'l1', 'plot layer', ['p1'], 0.7, 0.8);
      expect(next.totalLayers).toBe(1);
    });
  });

  describe('getPiecesByElement', () => {
    it('should filter by element', () => {
      let next = addCompositionPiece(state, 'p1', 'opening', 'desc', 0, 500, 1);
      next = addCompositionPiece(next, 'p2', 'climax', 'desc', 5, 1000, 10);
      const openings = getPiecesByElement(next, 'opening');
      expect(openings.length).toBe(1);
    });
  });

  describe('getCompositionReport', () => {
    it('should return comprehensive report', () => {
      const report = getCompositionReport(state);
      expect(report.totalPieces).toBe(0);
      expect(typeof report.compositionMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCompositionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetStoryCompositionEngineState', () => {
    it('should reset all state', () => {
      let next = addCompositionPiece(state, 'p1', 'opening', 'desc', 0, 500, 1);
      next = resetStoryCompositionEngineState();
      expect(next.pieces.size).toBe(0);
      expect(next.totalPieces).toBe(0);
    });
  });
});