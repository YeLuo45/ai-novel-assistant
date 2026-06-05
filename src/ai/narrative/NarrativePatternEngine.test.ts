/**
 * V731 NarrativePatternEngine Tests — Direction E Iter 6/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativePatternEngineState,
  addPattern,
  recordMatch,
  getPatternsByType,
  getMatchesForPattern,
  getDominantPattern,
  getPatternReport,
  resetNarrativePatternEngineState,
  type NarrativePatternEngineState,
} from './NarrativePatternEngine';

describe('NarrativePatternEngine', () => {
  let state: NarrativePatternEngineState;

  beforeEach(() => { state = createNarrativePatternEngineState(); });

  describe('createNarrativePatternEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.patterns.size).toBe(0);
      expect(state.matches.size).toBe(0);
    });

    it('should have default strength', () => {
      expect(state.averageStrength).toBe(0.5);
    });
  });

  describe('addPattern', () => {
    it('should add pattern', () => {
      const next = addPattern(state, 'p1', 'motif', 'Light vs Dark', 'Recurring light/dark theme', 'global', 'strong');
      expect(next.patterns.size).toBe(1);
      expect(next.totalPatterns).toBe(1);
    });

    it('should track type distribution', () => {
      let next = addPattern(state, 'p1', 'motif', 'P1', 'desc');
      next = addPattern(next, 'p2', 'archetype', 'P2', 'desc');
      expect(next.typeDistribution.get('motif')).toBe(1);
      expect(next.typeDistribution.get('archetype')).toBe(1);
    });
  });

  describe('recordMatch', () => {
    it('should record match', () => {
      let next = addPattern(state, 'p1', 'motif', 'Light', 'desc');
      next = recordMatch(next, 'm1', 'p1', 'matched text', 100, 0.9);
      expect(next.totalMatches).toBe(1);
    });

    it('should increment pattern occurrences', () => {
      let next = addPattern(state, 'p1', 'motif', 'Light', 'desc');
      next = recordMatch(next, 'm1', 'p1', 'text', 100);
      expect(next.patterns.get('p1')?.occurrences).toBe(1);
    });

    it('should handle unknown pattern', () => {
      const next = recordMatch(state, 'm1', 'unknown', 'text', 100);
      expect(next.totalMatches).toBe(1);
    });
  });

  describe('getPatternsByType', () => {
    it('should filter by type', () => {
      let next = addPattern(state, 'p1', 'motif', 'P1', 'desc');
      next = addPattern(next, 'p2', 'archetype', 'P2', 'desc');
      const motifs = getPatternsByType(next, 'motif');
      expect(motifs.length).toBe(1);
    });
  });

  describe('getMatchesForPattern', () => {
    it('should return matches', () => {
      let next = addPattern(state, 'p1', 'motif', 'P1', 'desc');
      next = recordMatch(next, 'm1', 'p1', 'text', 100);
      next = recordMatch(next, 'm2', 'p1', 'text2', 200);
      const matches = getMatchesForPattern(next, 'p1');
      expect(matches.length).toBe(2);
    });

    it('should return empty for unknown pattern', () => {
      const matches = getMatchesForPattern(state, 'unknown');
      expect(matches).toEqual([]);
    });
  });

  describe('getDominantPattern', () => {
    it('should return null for empty state', () => {
      const dominant = getDominantPattern(state);
      expect(dominant).toBeNull();
    });

    it('should return pattern with most occurrences', () => {
      let next = addPattern(state, 'p1', 'motif', 'P1', 'desc');
      next = addPattern(next, 'p2', 'archetype', 'P2', 'desc');
      next = recordMatch(next, 'm1', 'p1', 'text', 100);
      next = recordMatch(next, 'm2', 'p2', 'text', 200);
      next = recordMatch(next, 'm3', 'p2', 'text', 300);
      const dominant = getDominantPattern(next);
      expect(dominant?.patternId).toBe('p2');
    });
  });

  describe('getPatternReport', () => {
    it('should return comprehensive report', () => {
      const report = getPatternReport(state);
      expect(report.totalPatterns).toBe(0);
      expect(typeof report.patternCoverage).toBe('number');
    });

    it('should include type distribution', () => {
      let next = addPattern(state, 'p1', 'motif', 'P1', 'desc');
      const report = getPatternReport(next);
      expect(report.typeDistribution.motif).toBe(1);
    });

    it('should include recommendations for empty state', () => {
      const report = getPatternReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativePatternEngineState', () => {
    it('should reset all state', () => {
      let next = addPattern(state, 'p1', 'motif', 'P1', 'desc');
      next = resetNarrativePatternEngineState();
      expect(next.patterns.size).toBe(0);
      expect(next.totalPatterns).toBe(0);
    });
  });
});