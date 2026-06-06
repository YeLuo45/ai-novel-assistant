/**
 * V947 NarrativeAnalysisEngine Tests — Direction E Iter 6/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAnalysisEngineState,
  addAnalysisUnit,
  createAnalysisFramework,
  getUnitsByType,
  getAnalysisReport,
  resetNarrativeAnalysisEngineState,
  type NarrativeAnalysisEngineState,
} from './NarrativeAnalysisEngine';

describe('NarrativeAnalysisEngine', () => {
  let state: NarrativeAnalysisEngineState;

  beforeEach(() => { state = createNarrativeAnalysisEngineState(); });

  describe('createNarrativeAnalysisEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.units.size).toBe(0);
      expect(state.frameworks.size).toBe(0);
    });
  });

  describe('addAnalysisUnit', () => {
    it('should add unit', () => {
      const next = addAnalysisUnit(state, 'u1', 'thematic', 'close_reading', 'deep', 'text', ['finding1'], 0.8, 1);
      expect(next.units.size).toBe(1);
      expect(next.totalUnits).toBe(1);
      expect(next.totalFindings).toBe(1);
    });
  });

  describe('createAnalysisFramework', () => {
    it('should create framework', () => {
      let next = addAnalysisUnit(state, 'u1', 'thematic', 'close_reading', 'deep', 'text', ['f1'], 0.8, 1);
      next = createAnalysisFramework(next, 'f1', 'thematic framework', ['u1']);
      expect(next.totalFrameworks).toBe(1);
    });
  });

  describe('getUnitsByType', () => {
    it('should filter by type', () => {
      let next = addAnalysisUnit(state, 'u1', 'thematic', 'close_reading', 'deep', 'text', ['f'], 0.8, 1);
      next = addAnalysisUnit(next, 'u2', 'structural', 'formalist', 'deep', 'text', ['f'], 0.8, 1);
      const thematic = getUnitsByType(next, 'thematic');
      expect(thematic.length).toBe(1);
    });
  });

  describe('getAnalysisReport', () => {
    it('should return comprehensive report', () => {
      const report = getAnalysisReport(state);
      expect(report.totalUnits).toBe(0);
      expect(typeof report.analysisMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAnalysisReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAnalysisEngineState', () => {
    it('should reset all state', () => {
      let next = addAnalysisUnit(state, 'u1', 'thematic', 'close_reading', 'deep', 'text', ['f'], 0.8, 1);
      next = resetNarrativeAnalysisEngineState();
      expect(next.units.size).toBe(0);
      expect(next.totalUnits).toBe(0);
    });
  });
});