/**
 * V1095 NarrativeAlignmentEngine Tests — Direction D Iter 15/20 (Round 6)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAlignmentEngineState,
  addAlignment,
  addAlignmentPattern,
  getAlignmentsByType,
  getAlignmentReport,
  resetNarrativeAlignmentEngineState,
  type NarrativeAlignmentEngineState,
} from './NarrativeAlignmentEngine';

describe('NarrativeAlignmentEngine', () => {
  let state: NarrativeAlignmentEngineState;

  beforeEach(() => { state = createNarrativeAlignmentEngineState(); });

  describe('createNarrativeAlignmentEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.alignments.size).toBe(0);
      expect(state.patterns.size).toBe(0);
    });
  });

  describe('addAlignment', () => {
    it('should add alignment', () => {
      const next = addAlignment(state, 'a1', 'thematic', 'precise', 'arc', 'desc', 0.8, 0.9, 1);
      expect(next.alignments.size).toBe(1);
      expect(next.totalAlignments).toBe(1);
    });
  });

  describe('addAlignmentPattern', () => {
    it('should add pattern', () => {
      let next = addAlignment(state, 'a1', 'thematic', 'precise', 'arc', 'desc', 0.8, 0.9, 1);
      next = addAlignmentPattern(next, 'p1', ['a1']);
      expect(next.totalPatterns).toBe(1);
    });
  });

  describe('getAlignmentsByType', () => {
    it('should filter by type', () => {
      let next = addAlignment(state, 'a1', 'thematic', 'precise', 'arc', 'desc', 0.8, 0.9, 1);
      next = addAlignment(next, 'a2', 'tonal', 'precise', 'arc', 'desc', 0.8, 0.9, 1);
      const thematic = getAlignmentsByType(next, 'thematic');
      expect(thematic.length).toBe(1);
    });
  });

  describe('getAlignmentReport', () => {
    it('should return comprehensive report', () => {
      const report = getAlignmentReport(state);
      expect(report.totalAlignments).toBe(0);
      expect(typeof report.alignmentMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAlignmentReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAlignmentEngineState', () => {
    it('should reset all state', () => {
      let next = addAlignment(state, 'a1', 'thematic', 'precise', 'arc', 'desc', 0.8, 0.9, 1);
      next = resetNarrativeAlignmentEngineState();
      expect(next.alignments.size).toBe(0);
      expect(next.totalAlignments).toBe(0);
    });
  });
});