/**
 * V879 WorldGeographyEngine Tests — Direction C Iter 2/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWorldGeographyEngineState,
  addRegion,
  addRegionConnection,
  addRegionHazard,
  getRegionsByType,
  getGeographyReport,
  resetWorldGeographyEngineState,
  type WorldGeographyEngineState,
} from './WorldGeographyEngine';

describe('WorldGeographyEngine', () => {
  let state: WorldGeographyEngineState;

  beforeEach(() => { state = createWorldGeographyEngineState(); });

  describe('createWorldGeographyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.regions.size).toBe(0);
      expect(state.connections.size).toBe(0);
    });
  });

  describe('addRegion', () => {
    it('should add region', () => {
      const next = addRegion(state, 'r1', 'Eldoria', 'continent', 'temperate', 'plains', 'description', 1000, 100000);
      expect(next.regions.size).toBe(1);
      expect(next.totalRegions).toBe(1);
    });
  });

  describe('addRegionConnection', () => {
    it('should add connection', () => {
      const next = addRegionConnection(state, 'c1', 'r1', 'r2', 'road', true, 0.2);
      expect(next.totalConnections).toBe(1);
    });
  });

  describe('addRegionHazard', () => {
    it('should add hazard', () => {
      let next = addRegion(state, 'r1', 'name', 'continent', 'temperate', 'plains', 'desc', 1000);
      next = addRegionHazard(next, 'r1', 'dragons');
      expect(next.regions.get('r1')?.hazards.length).toBe(1);
    });
  });

  describe('getRegionsByType', () => {
    it('should filter by type', () => {
      let next = addRegion(state, 'r1', 'name', 'continent', 'temperate', 'plains', 'desc', 1000);
      next = addRegion(next, 'r2', 'name', 'city', 'temperate', 'plains', 'desc', 100);
      const continents = getRegionsByType(next, 'continent');
      expect(continents.length).toBe(1);
    });
  });

  describe('getGeographyReport', () => {
    it('should return comprehensive report', () => {
      const report = getGeographyReport(state);
      expect(report.totalRegions).toBe(0);
      expect(typeof report.geographyRichness).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getGeographyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetWorldGeographyEngineState', () => {
    it('should reset all state', () => {
      let next = addRegion(state, 'r1', 'name', 'continent', 'temperate', 'plains', 'desc', 1000);
      next = resetWorldGeographyEngineState();
      expect(next.regions.size).toBe(0);
      expect(next.totalRegions).toBe(0);
    });
  });
});