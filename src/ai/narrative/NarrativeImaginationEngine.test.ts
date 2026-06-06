/**
 * V955 NarrativeImaginationEngine Tests — Direction E Iter 10/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeImaginationEngineState,
  addImaginationImage,
  createImaginationScenario,
  getImagesByType,
  getImaginationReport,
  resetNarrativeImaginationEngineState,
  type NarrativeImaginationEngineState,
} from './NarrativeImaginationEngine';

describe('NarrativeImaginationEngine', () => {
  let state: NarrativeImaginationEngineState;

  beforeEach(() => { state = createNarrativeImaginationEngineState(); });

  describe('createNarrativeImaginationEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.images.size).toBe(0);
      expect(state.scenarios.size).toBe(0);
    });
  });

  describe('addImaginationImage', () => {
    it('should add image', () => {
      const next = addImaginationImage(state, 'i1', 'visual', 'vivid', 'creation', 'desc', 0.8, 0.7, 1);
      expect(next.images.size).toBe(1);
      expect(next.totalImages).toBe(1);
    });
  });

  describe('createImaginationScenario', () => {
    it('should create scenario', () => {
      let next = addImaginationImage(state, 'i1', 'visual', 'vivid', 'creation', 'desc', 0.8, 0.7, 1);
      next = createImaginationScenario(next, 's1', 'vivid scene', ['i1']);
      expect(next.totalScenarios).toBe(1);
    });
  });

  describe('getImagesByType', () => {
    it('should filter by type', () => {
      let next = addImaginationImage(state, 'i1', 'visual', 'vivid', 'creation', 'desc', 0.8, 0.7, 1);
      next = addImaginationImage(next, 'i2', 'auditory', 'vivid', 'creation', 'desc', 0.8, 0.7, 1);
      const visual = getImagesByType(next, 'visual');
      expect(visual.length).toBe(1);
    });
  });

  describe('getImaginationReport', () => {
    it('should return comprehensive report', () => {
      const report = getImaginationReport(state);
      expect(report.totalImages).toBe(0);
      expect(typeof report.imaginationMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getImaginationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeImaginationEngineState', () => {
    it('should reset all state', () => {
      let next = addImaginationImage(state, 'i1', 'visual', 'vivid', 'creation', 'desc', 0.8, 0.7, 1);
      next = resetNarrativeImaginationEngineState();
      expect(next.images.size).toBe(0);
      expect(next.totalImages).toBe(0);
    });
  });
});