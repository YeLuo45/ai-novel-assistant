/**
 * V1263 NarrativeAudienceCommunityEngine Tests — Direction H Iter 19/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAudienceCommunityEngineState,
  addAudienceCommunity,
  addAudienceCommunityNetwork,
  getAudienceCommunitiesByType,
  getAudienceCommunityReport,
  resetNarrativeAudienceCommunityEngineState,
  type NarrativeAudienceCommunityEngineState,
} from './NarrativeAudienceCommunityEngine';

describe('NarrativeAudienceCommunityEngine', () => {
  let state: NarrativeAudienceCommunityEngineState;

  beforeEach(() => { state = createNarrativeAudienceCommunityEngineState(); });

  describe('createNarrativeAudienceCommunityEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.communities.size).toBe(0);
      expect(state.networks.size).toBe(0);
    });
  });

  describe('addAudienceCommunity', () => {
    it('should add community', () => {
      const next = addAudienceCommunity(state, 'c1', 'transcendent', 'unbreakable', 'explosive', 'desc', 0.95, 0.9, 1);
      expect(next.communities.size).toBe(1);
      expect(next.totalCommunities).toBe(1);
    });
  });

  describe('addAudienceCommunityNetwork', () => {
    it('should add network', () => {
      let next = addAudienceCommunity(state, 'c1', 'transcendent', 'unbreakable', 'explosive', 'desc', 0.95, 0.9, 1);
      next = addAudienceCommunityNetwork(next, 'n1', ['c1']);
      expect(next.totalNetworks).toBe(1);
    });
  });

  describe('getAudienceCommunitiesByType', () => {
    it('should filter by type', () => {
      let next = addAudienceCommunity(state, 'c1', 'transcendent', 'unbreakable', 'explosive', 'desc', 0.95, 0.9, 1);
      next = addAudienceCommunity(next, 'c2', 'fan', 'unbreakable', 'explosive', 'desc', 0.95, 0.9, 1);
      const transcendent = getAudienceCommunitiesByType(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getAudienceCommunityReport', () => {
    it('should return comprehensive report', () => {
      const report = getAudienceCommunityReport(state);
      expect(report.totalCommunities).toBe(0);
      expect(typeof report.audienceCommunityMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAudienceCommunityReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAudienceCommunityEngineState', () => {
    it('should reset all state', () => {
      let next = addAudienceCommunity(state, 'c1', 'transcendent', 'unbreakable', 'explosive', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeAudienceCommunityEngineState();
      expect(next.communities.size).toBe(0);
      expect(next.totalCommunities).toBe(0);
    });
  });
});