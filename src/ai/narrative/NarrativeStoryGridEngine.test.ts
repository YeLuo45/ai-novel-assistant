/**
 * V1269 NarrativeStoryGridEngine Tests — Direction I Iter 2/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStoryGridEngineState,
  addStoryGridCell,
  addStoryGridAxis,
  getStoryGridCellsByScene,
  getStoryGridReport,
  resetNarrativeStoryGridEngineState,
  type NarrativeStoryGridEngineState,
} from './NarrativeStoryGridEngine';

describe('NarrativeStoryGridEngine', () => {
  let state: NarrativeStoryGridEngineState;

  beforeEach(() => { state = createNarrativeStoryGridEngineState(); });

  describe('createNarrativeStoryGridEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.cells.size).toBe(0);
      expect(state.axes.size).toBe(0);
    });
  });

  describe('addStoryGridCell', () => {
    it('should add cell', () => {
      const next = addStoryGridCell(state, 'c1', 'climax', 'transcendent', 'symphonic', 'desc', 0.95, 0.9, 1);
      expect(next.cells.size).toBe(1);
      expect(next.totalCells).toBe(1);
    });
  });

  describe('addStoryGridAxis', () => {
    it('should add axis', () => {
      let next = addStoryGridCell(state, 'c1', 'climax', 'transcendent', 'symphonic', 'desc', 0.95, 0.9, 1);
      next = addStoryGridAxis(next, 'a1', ['c1']);
      expect(next.totalAxes).toBe(1);
    });
  });

  describe('getStoryGridCellsByScene', () => {
    it('should filter by scene', () => {
      let next = addStoryGridCell(state, 'c1', 'climax', 'transcendent', 'symphonic', 'desc', 0.95, 0.9, 1);
      next = addStoryGridCell(next, 'c2', 'setup', 'transcendent', 'symphonic', 'desc', 0.95, 0.9, 1);
      const climax = getStoryGridCellsByScene(next, 'climax');
      expect(climax.length).toBe(1);
    });
  });

  describe('getStoryGridReport', () => {
    it('should return comprehensive report', () => {
      const report = getStoryGridReport(state);
      expect(report.totalCells).toBe(0);
      expect(typeof report.storyGridMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStoryGridReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStoryGridEngineState', () => {
    it('should reset all state', () => {
      let next = addStoryGridCell(state, 'c1', 'climax', 'transcendent', 'symphonic', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeStoryGridEngineState();
      expect(next.cells.size).toBe(0);
      expect(next.totalCells).toBe(0);
    });
  });
});