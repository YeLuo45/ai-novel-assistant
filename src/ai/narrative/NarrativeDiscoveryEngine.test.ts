/**
 * V1143 NarrativeDiscoveryEngine Tests — Direction E Iter 19/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeDiscoveryEngineState,
  addDiscovery,
  addDiscoveryPath,
  getDiscoveriesByMode,
  getDiscoveryReport,
  resetNarrativeDiscoveryEngineState,
  type NarrativeDiscoveryEngineState,
} from './NarrativeDiscoveryEngine';

describe('NarrativeDiscoveryEngine', () => {
  let state: NarrativeDiscoveryEngineState;

  beforeEach(() => { state = createNarrativeDiscoveryEngineState(); });

  describe('createNarrativeDiscoveryEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.discoveries.size).toBe(0);
      expect(state.paths.size).toBe(0);
    });
  });

  describe('addDiscovery', () => {
    it('should add discovery', () => {
      const next = addDiscovery(state, 'd1', 'search', 'frictionless', 'excellent', 'desc', 0.9, 0.85, 1);
      expect(next.discoveries.size).toBe(1);
      expect(next.totalDiscoveries).toBe(1);
    });
  });

  describe('addDiscoveryPath', () => {
    it('should add path', () => {
      let next = addDiscovery(state, 'd1', 'search', 'frictionless', 'excellent', 'desc', 0.9, 0.85, 1);
      next = addDiscoveryPath(next, 'p1', ['d1']);
      expect(next.totalPaths).toBe(1);
    });
  });

  describe('getDiscoveriesByMode', () => {
    it('should filter by mode', () => {
      let next = addDiscovery(state, 'd1', 'search', 'frictionless', 'excellent', 'desc', 0.9, 0.85, 1);
      next = addDiscovery(next, 'd2', 'browse', 'frictionless', 'excellent', 'desc', 0.9, 0.85, 1);
      const search = getDiscoveriesByMode(next, 'search');
      expect(search.length).toBe(1);
    });
  });

  describe('getDiscoveryReport', () => {
    it('should return comprehensive report', () => {
      const report = getDiscoveryReport(state);
      expect(report.totalDiscoveries).toBe(0);
      expect(typeof report.discoveryMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getDiscoveryReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeDiscoveryEngineState', () => {
    it('should reset all state', () => {
      let next = addDiscovery(state, 'd1', 'search', 'frictionless', 'excellent', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeDiscoveryEngineState();
      expect(next.discoveries.size).toBe(0);
      expect(next.totalDiscoveries).toBe(0);
    });
  });
});