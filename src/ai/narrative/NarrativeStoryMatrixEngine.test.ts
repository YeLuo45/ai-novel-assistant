/**
 * V1267 NarrativeStoryMatrixEngine Tests — Direction I Iter 1/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStoryMatrixEngineState,
  addStoryMatrixCell,
  addStoryMatrixRow,
  getStoryMatrixCellsByRow,
  getStoryMatrixReport,
  resetNarrativeStoryMatrixEngineState,
  type NarrativeStoryMatrixEngineState,
} from './NarrativeStoryMatrixEngine';

describe('NarrativeStoryMatrixEngine', () => {
  let state: NarrativeStoryMatrixEngineState;

  beforeEach(() => { state = createNarrativeStoryMatrixEngineState(); });

  describe('createNarrativeStoryMatrixEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.cells.size).toBe(0);
      expect(state.rows.size).toBe(0);
    });
  });

  describe('addStoryMatrixCell', () => {
    it('should add cell', () => {
      const next = addStoryMatrixCell(state, 'c1', 'plot', 'character', 'complete', 'desc', 0.95, 0.9, 1);
      expect(next.cells.size).toBe(1);
      expect(next.totalCells).toBe(1);
    });
  });

  describe('addStoryMatrixRow', () => {
    it('should add row', () => {
      let next = addStoryMatrixCell(state, 'c1', 'plot', 'character', 'complete', 'desc', 0.95, 0.9, 1);
      next = addStoryMatrixRow(next, 'r1', ['c1']);
      expect(next.totalRows).toBe(1);
    });
  });

  describe('getStoryMatrixCellsByRow', () => {
    it('should filter by row', () => {
      let next = addStoryMatrixCell(state, 'c1', 'plot', 'character', 'complete', 'desc', 0.95, 0.9, 1);
      next = addStoryMatrixCell(next, 'c2', 'character', 'theme', 'complete', 'desc', 0.95, 0.9, 1);
      const plotCells = getStoryMatrixCellsByRow(next, 'plot');
      expect(plotCells.length).toBe(1);
    });
  });

  describe('getStoryMatrixReport', () => {
    it('should return comprehensive report', () => {
      const report = getStoryMatrixReport(state);
      expect(report.totalCells).toBe(0);
      expect(typeof report.storyMatrixMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStoryMatrixReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStoryMatrixEngineState', () => {
    it('should reset all state', () => {
      let next = addStoryMatrixCell(state, 'c1', 'plot', 'character', 'complete', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeStoryMatrixEngineState();
      expect(next.cells.size).toBe(0);
      expect(next.totalCells).toBe(0);
    });
  });
});