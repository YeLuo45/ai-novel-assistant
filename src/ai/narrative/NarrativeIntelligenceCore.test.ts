/**
 * V957 NarrativeIntelligenceCore Tests — Direction E Iter 11/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeIntelligenceCoreState,
  addIntelligenceFacet,
  addIntelligenceProfile,
  getFacetsByType,
  getIntelligenceCoreReport,
  resetNarrativeIntelligenceCoreState,
  type NarrativeIntelligenceCoreState,
} from './NarrativeIntelligenceCore';

describe('NarrativeIntelligenceCore', () => {
  let state: NarrativeIntelligenceCoreState;

  beforeEach(() => { state = createNarrativeIntelligenceCoreState(); });

  describe('createNarrativeIntelligenceCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.facets.size).toBe(0);
      expect(state.profiles.size).toBe(0);
    });
  });

  describe('addIntelligenceFacet', () => {
    it('should add facet', () => {
      const next = addIntelligenceFacet(state, 'f1', 'emotional', 'high', 'character', 'desc', 0.8, 1);
      expect(next.facets.size).toBe(1);
      expect(next.totalFacets).toBe(1);
    });
  });

  describe('addIntelligenceProfile', () => {
    it('should add profile', () => {
      let next = addIntelligenceFacet(state, 'f1', 'emotional', 'high', 'character', 'desc', 0.8, 1);
      next = addIntelligenceProfile(next, 'p1', 'Main Character', ['f1']);
      expect(next.totalProfiles).toBe(1);
    });
  });

  describe('getFacetsByType', () => {
    it('should filter by type', () => {
      let next = addIntelligenceFacet(state, 'f1', 'emotional', 'high', 'character', 'desc', 0.8, 1);
      next = addIntelligenceFacet(next, 'f2', 'social', 'high', 'character', 'desc', 0.8, 1);
      const emotional = getFacetsByType(next, 'emotional');
      expect(emotional.length).toBe(1);
    });
  });

  describe('getIntelligenceCoreReport', () => {
    it('should return comprehensive report', () => {
      const report = getIntelligenceCoreReport(state);
      expect(report.totalFacets).toBe(0);
      expect(typeof report.intelligenceMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getIntelligenceCoreReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeIntelligenceCoreState', () => {
    it('should reset all state', () => {
      let next = addIntelligenceFacet(state, 'f1', 'emotional', 'high', 'character', 'desc', 0.8, 1);
      next = resetNarrativeIntelligenceCoreState();
      expect(next.facets.size).toBe(0);
      expect(next.totalFacets).toBe(0);
    });
  });
});