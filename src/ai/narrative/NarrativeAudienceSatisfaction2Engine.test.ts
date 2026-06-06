/**
 * V1243 NarrativeAudienceSatisfaction2Engine Tests — Direction H Iter 9/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAudienceSatisfaction2EngineState,
  addAudienceSatisfactionDetail,
  addAudienceSatisfactionProfile,
  getAudienceSatisfactionDetailsByDimension,
  getAudienceSatisfaction2Report,
  resetNarrativeAudienceSatisfaction2EngineState,
  type NarrativeAudienceSatisfaction2EngineState,
} from './NarrativeAudienceSatisfaction2Engine';

describe('NarrativeAudienceSatisfaction2Engine', () => {
  let state: NarrativeAudienceSatisfaction2EngineState;

  beforeEach(() => { state = createNarrativeAudienceSatisfaction2EngineState(); });

  describe('createNarrativeAudienceSatisfaction2EngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.details.size).toBe(0);
      expect(state.profiles.size).toBe(0);
    });
  });

  describe('addAudienceSatisfactionDetail', () => {
    it('should add detail', () => {
      const next = addAudienceSatisfactionDetail(state, 'd1', 'meaning', 'transcendent', 'permanent', 'desc', 0.95, 0.9, 1);
      expect(next.details.size).toBe(1);
      expect(next.totalDetails).toBe(1);
    });
  });

  describe('addAudienceSatisfactionProfile', () => {
    it('should add profile', () => {
      let next = addAudienceSatisfactionDetail(state, 'd1', 'meaning', 'transcendent', 'permanent', 'desc', 0.95, 0.9, 1);
      next = addAudienceSatisfactionProfile(next, 'p1', ['d1']);
      expect(next.totalProfiles).toBe(1);
    });
  });

  describe('getAudienceSatisfactionDetailsByDimension', () => {
    it('should filter by dimension', () => {
      let next = addAudienceSatisfactionDetail(state, 'd1', 'meaning', 'transcendent', 'permanent', 'desc', 0.95, 0.9, 1);
      next = addAudienceSatisfactionDetail(next, 'd2', 'plot', 'transcendent', 'permanent', 'desc', 0.95, 0.9, 1);
      const meaning = getAudienceSatisfactionDetailsByDimension(next, 'meaning');
      expect(meaning.length).toBe(1);
    });
  });

  describe('getAudienceSatisfaction2Report', () => {
    it('should return comprehensive report', () => {
      const report = getAudienceSatisfaction2Report(state);
      expect(report.totalDetails).toBe(0);
      expect(typeof report.audienceSatisfaction2Mastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAudienceSatisfaction2Report(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAudienceSatisfaction2EngineState', () => {
    it('should reset all state', () => {
      let next = addAudienceSatisfactionDetail(state, 'd1', 'meaning', 'transcendent', 'permanent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeAudienceSatisfaction2EngineState();
      expect(next.details.size).toBe(0);
      expect(next.totalDetails).toBe(0);
    });
  });
});