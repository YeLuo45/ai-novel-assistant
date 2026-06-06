/**
 * V1259 NarrativeAudienceLoyaltyEngine Tests — Direction H Iter 17/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAudienceLoyaltyEngineState,
  addAudienceLoyalty,
  addAudienceLoyaltyPact,
  getAudienceLoyaltiesByType,
  getAudienceLoyaltyReport,
  resetNarrativeAudienceLoyaltyEngineState,
  type NarrativeAudienceLoyaltyEngineState,
} from './NarrativeAudienceLoyaltyEngine';

describe('NarrativeAudienceLoyaltyEngine', () => {
  let state: NarrativeAudienceLoyaltyEngineState;

  beforeEach(() => { state = createNarrativeAudienceLoyaltyEngineState(); });

  describe('createNarrativeAudienceLoyaltyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.loyalties.size).toBe(0);
      expect(state.pacts.size).toBe(0);
    });
  });

  describe('addAudienceLoyalty', () => {
    it('should add loyalty', () => {
      const next = addAudienceLoyalty(state, 'l1', 'transcendent', 'unbreakable', 'forged_in_fire', 'desc', 0.95, 0.9, 1);
      expect(next.loyalties.size).toBe(1);
      expect(next.totalLoyalties).toBe(1);
    });
  });

  describe('addAudienceLoyaltyPact', () => {
    it('should add pact', () => {
      let next = addAudienceLoyalty(state, 'l1', 'transcendent', 'unbreakable', 'forged_in_fire', 'desc', 0.95, 0.9, 1);
      next = addAudienceLoyaltyPact(next, 'p1', ['l1']);
      expect(next.totalPacts).toBe(1);
    });
  });

  describe('getAudienceLoyaltiesByType', () => {
    it('should filter by type', () => {
      let next = addAudienceLoyalty(state, 'l1', 'transcendent', 'unbreakable', 'forged_in_fire', 'desc', 0.95, 0.9, 1);
      next = addAudienceLoyalty(next, 'l2', 'emotional', 'unbreakable', 'forged_in_fire', 'desc', 0.95, 0.9, 1);
      const transcendent = getAudienceLoyaltiesByType(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getAudienceLoyaltyReport', () => {
    it('should return comprehensive report', () => {
      const report = getAudienceLoyaltyReport(state);
      expect(report.totalLoyalties).toBe(0);
      expect(typeof report.audienceLoyaltyMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAudienceLoyaltyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAudienceLoyaltyEngineState', () => {
    it('should reset all state', () => {
      let next = addAudienceLoyalty(state, 'l1', 'transcendent', 'unbreakable', 'forged_in_fire', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeAudienceLoyaltyEngineState();
      expect(next.loyalties.size).toBe(0);
      expect(next.totalLoyalties).toBe(0);
    });
  });
});