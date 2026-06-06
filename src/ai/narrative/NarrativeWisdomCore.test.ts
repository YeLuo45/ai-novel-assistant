/**
 * V945 NarrativeWisdomCore Tests — Direction E Iter 5/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWisdomCoreState,
  addWisdomPearl,
  createWisdomStream,
  getPearlsByDomain,
  getWisdomReport,
  resetNarrativeWisdomCoreState,
  type NarrativeWisdomCoreState,
} from './NarrativeWisdomCore';

describe('NarrativeWisdomCore', () => {
  let state: NarrativeWisdomCoreState;

  beforeEach(() => { state = createNarrativeWisdomCoreState(); });

  describe('createNarrativeWisdomCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.pearls.size).toBe(0);
      expect(state.streams.size).toBe(0);
    });
  });

  describe('addWisdomPearl', () => {
    it('should add pearl', () => {
      const next = addWisdomPearl(state, 'p1', 'craft', 'profound', 'practical', 'insight', 0.8, 1);
      expect(next.pearls.size).toBe(1);
      expect(next.totalPearls).toBe(1);
    });
  });

  describe('createWisdomStream', () => {
    it('should create stream', () => {
      let next = addWisdomPearl(state, 'p1', 'craft', 'profound', 'practical', 'insight', 0.8, 1);
      next = createWisdomStream(next, 's1', 'craft wisdom', ['p1']);
      expect(next.totalStreams).toBe(1);
    });
  });

  describe('getPearlsByDomain', () => {
    it('should filter by domain', () => {
      let next = addWisdomPearl(state, 'p1', 'craft', 'profound', 'practical', 'insight', 0.8, 1);
      next = addWisdomPearl(next, 'p2', 'truth', 'deep', 'transformative', 'insight', 0.8, 1);
      const craft = getPearlsByDomain(next, 'craft');
      expect(craft.length).toBe(1);
    });
  });

  describe('getWisdomReport', () => {
    it('should return comprehensive report', () => {
      const report = getWisdomReport(state);
      expect(report.totalPearls).toBe(0);
      expect(typeof report.wisdomMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWisdomReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeWisdomCoreState', () => {
    it('should reset all state', () => {
      let next = addWisdomPearl(state, 'p1', 'craft', 'profound', 'practical', 'insight', 0.8, 1);
      next = resetNarrativeWisdomCoreState();
      expect(next.pearls.size).toBe(0);
      expect(next.totalPearls).toBe(0);
    });
  });
});