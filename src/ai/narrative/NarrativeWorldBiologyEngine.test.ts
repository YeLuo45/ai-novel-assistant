/**
 * V1341 NarrativeWorldBiologyEngine Tests — Direction J Iter 18/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWorldBiologyEngineState,
  addWorldBiologyEntry,
  addWorldBiologyTaxonomy,
  getWorldBiologyEntriesByLifeform,
  getWorldBiologyReport,
  resetNarrativeWorldBiologyEngineState,
  type NarrativeWorldBiologyEngineState,
} from './NarrativeWorldBiologyEngine';

describe('NarrativeWorldBiologyEngine', () => {
  let state: NarrativeWorldBiologyEngineState;

  beforeEach(() => { state = createNarrativeWorldBiologyEngineState(); });

  describe('createNarrativeWorldBiologyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.taxonomies.size).toBe(0);
    });
  });

  describe('addWorldBiologyEntry', () => {
    it('should add entry', () => {
      const next = addWorldBiologyEntry(state, 'e1', 'transcendent', 'infinite', 'omniscient', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addWorldBiologyTaxonomy', () => {
    it('should add taxonomy', () => {
      let next = addWorldBiologyEntry(state, 'e1', 'transcendent', 'infinite', 'omniscient', 'desc', 0.95, 0.9, 1);
      next = addWorldBiologyTaxonomy(next, 't1', ['e1']);
      expect(next.totalTaxonomies).toBe(1);
    });
  });

  describe('getWorldBiologyEntriesByLifeform', () => {
    it('should filter by lifeform', () => {
      let next = addWorldBiologyEntry(state, 'e1', 'transcendent', 'infinite', 'omniscient', 'desc', 0.95, 0.9, 1);
      next = addWorldBiologyEntry(next, 'e2', 'plant', 'infinite', 'omniscient', 'desc', 0.95, 0.9, 1);
      const transcendent = getWorldBiologyEntriesByLifeform(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getWorldBiologyReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldBiologyReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.worldBiologyMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldBiologyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeWorldBiologyEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldBiologyEntry(state, 'e1', 'transcendent', 'infinite', 'omniscient', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeWorldBiologyEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});