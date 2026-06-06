/**
 * V1139 NarrativeShareabilityEngine Tests — Direction E Iter 17/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeShareabilityEngineState,
  addShareability,
  addShareabilityNetwork,
  getShareabilitiesByMode,
  getShareabilityReport,
  resetNarrativeShareabilityEngineState,
  type NarrativeShareabilityEngineState,
} from './NarrativeShareabilityEngine';

describe('NarrativeShareabilityEngine', () => {
  let state: NarrativeShareabilityEngineState;

  beforeEach(() => { state = createNarrativeShareabilityEngineState(); });

  describe('createNarrativeShareabilityEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.shareabilities.size).toBe(0);
      expect(state.networks.size).toBe(0);
    });
  });

  describe('addShareability', () => {
    it('should add shareability', () => {
      const next = addShareability(state, 's1', 'quote', 'eager', 'public', 'desc', 0.9, 0.85, 1);
      expect(next.shareabilities.size).toBe(1);
      expect(next.totalShareabilities).toBe(1);
    });
  });

  describe('addShareabilityNetwork', () => {
    it('should add network', () => {
      let next = addShareability(state, 's1', 'quote', 'eager', 'public', 'desc', 0.9, 0.85, 1);
      next = addShareabilityNetwork(next, 'n1', ['s1']);
      expect(next.totalNetworks).toBe(1);
    });
  });

  describe('getShareabilitiesByMode', () => {
    it('should filter by mode', () => {
      let next = addShareability(state, 's1', 'quote', 'eager', 'public', 'desc', 0.9, 0.85, 1);
      next = addShareability(next, 's2', 'image', 'eager', 'public', 'desc', 0.9, 0.85, 1);
      const quote = getShareabilitiesByMode(next, 'quote');
      expect(quote.length).toBe(1);
    });
  });

  describe('getShareabilityReport', () => {
    it('should return comprehensive report', () => {
      const report = getShareabilityReport(state);
      expect(report.totalShareabilities).toBe(0);
      expect(typeof report.shareabilityMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getShareabilityReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeShareabilityEngineState', () => {
    it('should reset all state', () => {
      let next = addShareability(state, 's1', 'quote', 'eager', 'public', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeShareabilityEngineState();
      expect(next.shareabilities.size).toBe(0);
      expect(next.totalShareabilities).toBe(0);
    });
  });
});