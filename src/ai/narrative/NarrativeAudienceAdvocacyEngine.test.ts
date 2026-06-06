/**
 * V1261 NarrativeAudienceAdvocacyEngine Tests — Direction H Iter 18/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAudienceAdvocacyEngineState,
  addAudienceAdvocacy,
  addAudienceAdvocacyCampaign,
  getAudienceAdvocaciesByType,
  getAudienceAdvocacyReport,
  resetNarrativeAudienceAdvocacyEngineState,
  type NarrativeAudienceAdvocacyEngineState,
} from './NarrativeAudienceAdvocacyEngine';

describe('NarrativeAudienceAdvocacyEngine', () => {
  let state: NarrativeAudienceAdvocacyEngineState;

  beforeEach(() => { state = createNarrativeAudienceAdvocacyEngineState(); });

  describe('createNarrativeAudienceAdvocacyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.advocacies.size).toBe(0);
      expect(state.campaigns.size).toBe(0);
    });
  });

  describe('addAudienceAdvocacy', () => {
    it('should add advocacy', () => {
      const next = addAudienceAdvocacy(state, 'a1', 'transcendent', 'crusading', 'universal', 'desc', 0.95, 0.9, 1);
      expect(next.advocacies.size).toBe(1);
      expect(next.totalAdvocacies).toBe(1);
    });
  });

  describe('addAudienceAdvocacyCampaign', () => {
    it('should add campaign', () => {
      let next = addAudienceAdvocacy(state, 'a1', 'transcendent', 'crusading', 'universal', 'desc', 0.95, 0.9, 1);
      next = addAudienceAdvocacyCampaign(next, 'c1', ['a1']);
      expect(next.totalCampaigns).toBe(1);
    });
  });

  describe('getAudienceAdvocaciesByType', () => {
    it('should filter by type', () => {
      let next = addAudienceAdvocacy(state, 'a1', 'transcendent', 'crusading', 'universal', 'desc', 0.95, 0.9, 1);
      next = addAudienceAdvocacy(next, 'a2', 'enthusiastic', 'crusading', 'universal', 'desc', 0.95, 0.9, 1);
      const transcendent = getAudienceAdvocaciesByType(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getAudienceAdvocacyReport', () => {
    it('should return comprehensive report', () => {
      const report = getAudienceAdvocacyReport(state);
      expect(report.totalAdvocacies).toBe(0);
      expect(typeof report.audienceAdvocacyMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAudienceAdvocacyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAudienceAdvocacyEngineState', () => {
    it('should reset all state', () => {
      let next = addAudienceAdvocacy(state, 'a1', 'transcendent', 'crusading', 'universal', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeAudienceAdvocacyEngineState();
      expect(next.advocacies.size).toBe(0);
      expect(next.totalAdvocacies).toBe(0);
    });
  });
});