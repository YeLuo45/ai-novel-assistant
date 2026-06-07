/**
 * V1339 NarrativeWorldChemistryEngine Tests — Direction J Iter 17/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWorldChemistryEngineState,
  addWorldChemistryEntry,
  addWorldChemistryCompound,
  getWorldChemistryEntriesByElement,
  getWorldChemistryReport,
  resetNarrativeWorldChemistryEngineState,
  type NarrativeWorldChemistryEngineState,
} from './NarrativeWorldChemistryEngine';

describe('NarrativeWorldChemistryEngine', () => {
  let state: NarrativeWorldChemistryEngineState;

  beforeEach(() => { state = createNarrativeWorldChemistryEngineState(); });

  describe('createNarrativeWorldChemistryEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.compounds.size).toBe(0);
    });
  });

  describe('addWorldChemistryEntry', () => {
    it('should add entry', () => {
      const next = addWorldChemistryEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addWorldChemistryCompound', () => {
    it('should add compound', () => {
      let next = addWorldChemistryEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldChemistryCompound(next, 'c1', ['e1']);
      expect(next.totalCompounds).toBe(1);
    });
  });

  describe('getWorldChemistryEntriesByElement', () => {
    it('should filter by element', () => {
      let next = addWorldChemistryEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldChemistryEntry(next, 'e2', 'fire', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getWorldChemistryEntriesByElement(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getWorldChemistryReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldChemistryReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.worldChemistryMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldChemistryReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeWorldChemistryEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldChemistryEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeWorldChemistryEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});