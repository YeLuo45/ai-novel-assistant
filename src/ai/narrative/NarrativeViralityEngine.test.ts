/**
 * V1137 NarrativeViralityEngine Tests — Direction E Iter 16/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeViralityEngineState,
  addVirality,
  addViralityWave,
  getViralitiesByType,
  getViralityReport,
  resetNarrativeViralityEngineState,
  type NarrativeViralityEngineState,
} from './NarrativeViralityEngine';

describe('NarrativeViralityEngine', () => {
  let state: NarrativeViralityEngineState;

  beforeEach(() => { state = createNarrativeViralityEngineState(); });

  describe('createNarrativeViralityEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.viralities.size).toBe(0);
      expect(state.waves.size).toBe(0);
    });
  });

  describe('addVirality', () => {
    it('should add virality', () => {
      const next = addVirality(state, 'v1', 'quote', 'viral', 'universal', 'desc', 0.9, 0.85, 1);
      expect(next.viralities.size).toBe(1);
      expect(next.totalViralities).toBe(1);
    });
  });

  describe('addViralityWave', () => {
    it('should add wave', () => {
      let next = addVirality(state, 'v1', 'quote', 'viral', 'universal', 'desc', 0.9, 0.85, 1);
      next = addViralityWave(next, 'w1', ['v1']);
      expect(next.totalWaves).toBe(1);
    });
  });

  describe('getViralitiesByType', () => {
    it('should filter by type', () => {
      let next = addVirality(state, 'v1', 'quote', 'viral', 'universal', 'desc', 0.9, 0.85, 1);
      next = addVirality(next, 'v2', 'scene', 'viral', 'universal', 'desc', 0.9, 0.85, 1);
      const quote = getViralitiesByType(next, 'quote');
      expect(quote.length).toBe(1);
    });
  });

  describe('getViralityReport', () => {
    it('should return comprehensive report', () => {
      const report = getViralityReport(state);
      expect(report.totalViralities).toBe(0);
      expect(typeof report.viralityMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getViralityReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeViralityEngineState', () => {
    it('should reset all state', () => {
      let next = addVirality(state, 'v1', 'quote', 'viral', 'universal', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeViralityEngineState();
      expect(next.viralities.size).toBe(0);
      expect(next.totalViralities).toBe(0);
    });
  });
});