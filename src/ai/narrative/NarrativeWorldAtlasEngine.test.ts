/**
 * V1307 NarrativeWorldAtlasEngine Tests — Direction J Iter 1/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWorldAtlasEngineState,
  addWorldAtlasEntry,
  addWorldAtlasSection,
  getWorldAtlasEntriesByRegion,
  getWorldAtlasReport,
  resetNarrativeWorldAtlasEngineState,
  type NarrativeWorldAtlasEngineState,
} from './NarrativeWorldAtlasEngine';

describe('NarrativeWorldAtlasEngine', () => {
  let state: NarrativeWorldAtlasEngineState;

  beforeEach(() => { state = createNarrativeWorldAtlasEngineState(); });

  describe('createNarrativeWorldAtlasEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.sections.size).toBe(0);
    });
  });

  describe('addWorldAtlasEntry', () => {
    it('should add entry', () => {
      const next = addWorldAtlasEntry(state, 'e1', 'celestial', 'cosmic', 'immersive', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addWorldAtlasSection', () => {
    it('should add section', () => {
      let next = addWorldAtlasEntry(state, 'e1', 'celestial', 'cosmic', 'immersive', 'desc', 0.95, 0.9, 1);
      next = addWorldAtlasSection(next, 's1', ['e1']);
      expect(next.totalSections).toBe(1);
    });
  });

  describe('getWorldAtlasEntriesByRegion', () => {
    it('should filter by region', () => {
      let next = addWorldAtlasEntry(state, 'e1', 'celestial', 'cosmic', 'immersive', 'desc', 0.95, 0.9, 1);
      next = addWorldAtlasEntry(next, 'e2', 'kingdom', 'cosmic', 'immersive', 'desc', 0.95, 0.9, 1);
      const celestial = getWorldAtlasEntriesByRegion(next, 'celestial');
      expect(celestial.length).toBe(1);
    });
  });

  describe('getWorldAtlasReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldAtlasReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.worldAtlasMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldAtlasReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeWorldAtlasEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldAtlasEntry(state, 'e1', 'celestial', 'cosmic', 'immersive', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeWorldAtlasEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});