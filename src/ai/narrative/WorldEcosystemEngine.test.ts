/**
 * V895 WorldEcosystemEngine Tests — Direction C Iter 10/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWorldEcosystemEngineState,
  addSpecies,
  createEcosystem,
  getSpeciesByBiome,
  getEcosystemReport,
  resetWorldEcosystemEngineState,
  type WorldEcosystemEngineState,
} from './WorldEcosystemEngine';

describe('WorldEcosystemEngine', () => {
  let state: WorldEcosystemEngineState;

  beforeEach(() => { state = createWorldEcosystemEngineState(); });

  describe('createWorldEcosystemEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.species.size).toBe(0);
      expect(state.ecosystems.size).toBe(0);
    });
  });

  describe('addSpecies', () => {
    it('should add species', () => {
      const next = addSpecies(state, 's1', 'Rabbit', 'consumer', 100, 'forest');
      expect(next.species.size).toBe(1);
      expect(next.totalSpecies).toBe(1);
    });
  });

  describe('createEcosystem', () => {
    it('should create ecosystem', () => {
      let next = addSpecies(state, 's1', 'Rabbit', 'consumer', 100, 'forest');
      next = addSpecies(next, 's2', 'Grass', 'producer', 10000, 'forest');
      next = createEcosystem(next, 'e1', 'Forest', 'forest', ['s1', 's2'], 's2', 's1');
      expect(next.totalEcosystems).toBe(1);
    });
  });

  describe('getSpeciesByBiome', () => {
    it('should filter by biome', () => {
      let next = addSpecies(state, 's1', 'Rabbit', 'consumer', 100, 'forest');
      next = addSpecies(next, 's2', 'Camel', 'consumer', 50, 'desert');
      const forest = getSpeciesByBiome(next, 'forest');
      expect(forest.length).toBe(1);
    });
  });

  describe('getEcosystemReport', () => {
    it('should return comprehensive report', () => {
      const report = getEcosystemReport(state);
      expect(report.totalSpecies).toBe(0);
      expect(typeof report.biodiversity).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getEcosystemReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetWorldEcosystemEngineState', () => {
    it('should reset all state', () => {
      let next = addSpecies(state, 's1', 'Rabbit', 'consumer', 100, 'forest');
      next = resetWorldEcosystemEngineState();
      expect(next.species.size).toBe(0);
      expect(next.totalSpecies).toBe(0);
    });
  });
});