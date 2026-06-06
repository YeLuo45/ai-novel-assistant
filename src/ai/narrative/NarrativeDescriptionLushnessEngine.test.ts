/**
 * V1155 NarrativeDescriptionLushnessEngine Tests — Direction F Iter 5/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeDescriptionLushnessEngineState,
  addDescriptionLushness,
  addDescriptionLushnessField,
  getDescriptionLushnessesByType,
  getDescriptionLushnessReport,
  resetNarrativeDescriptionLushnessEngineState,
  type NarrativeDescriptionLushnessEngineState,
} from './NarrativeDescriptionLushnessEngine';

describe('NarrativeDescriptionLushnessEngine', () => {
  let state: NarrativeDescriptionLushnessEngineState;

  beforeEach(() => { state = createNarrativeDescriptionLushnessEngineState(); });

  describe('createNarrativeDescriptionLushnessEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.lushnesses.size).toBe(0);
      expect(state.fields.size).toBe(0);
    });
  });

  describe('addDescriptionLushness', () => {
    it('should add lushness', () => {
      const next = addDescriptionLushness(state, 'l1', 'rich', 'granular', 'multi', 'desc', 0.9, 0.85, 1);
      expect(next.lushnesses.size).toBe(1);
      expect(next.totalLushnesses).toBe(1);
    });
  });

  describe('addDescriptionLushnessField', () => {
    it('should add field', () => {
      let next = addDescriptionLushness(state, 'l1', 'rich', 'granular', 'multi', 'desc', 0.9, 0.85, 1);
      next = addDescriptionLushnessField(next, 'f1', ['l1']);
      expect(next.totalFields).toBe(1);
    });
  });

  describe('getDescriptionLushnessesByType', () => {
    it('should filter by type', () => {
      let next = addDescriptionLushness(state, 'l1', 'rich', 'granular', 'multi', 'desc', 0.9, 0.85, 1);
      next = addDescriptionLushness(next, 'l2', 'sparse', 'granular', 'multi', 'desc', 0.9, 0.85, 1);
      const rich = getDescriptionLushnessesByType(next, 'rich');
      expect(rich.length).toBe(1);
    });
  });

  describe('getDescriptionLushnessReport', () => {
    it('should return comprehensive report', () => {
      const report = getDescriptionLushnessReport(state);
      expect(report.totalLushnesses).toBe(0);
      expect(typeof report.descriptionLushnessMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getDescriptionLushnessReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeDescriptionLushnessEngineState', () => {
    it('should reset all state', () => {
      let next = addDescriptionLushness(state, 'l1', 'rich', 'granular', 'multi', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeDescriptionLushnessEngineState();
      expect(next.lushnesses.size).toBe(0);
      expect(next.totalLushnesses).toBe(0);
    });
  });
});