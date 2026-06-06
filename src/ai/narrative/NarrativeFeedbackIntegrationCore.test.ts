/**
 * V989 NarrativeFeedbackIntegrationCore Tests — Direction A Iter 12/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeFeedbackIntegrationCoreState,
  addFeedbackUnit,
  addIntegrationEvent,
  addIntegrationPattern,
  getEventsByIntegration,
  getIntegrationReport,
  resetNarrativeFeedbackIntegrationCoreState,
  type NarrativeFeedbackIntegrationCoreState,
} from './NarrativeFeedbackIntegrationCore';

describe('NarrativeFeedbackIntegrationCore', () => {
  let state: NarrativeFeedbackIntegrationCoreState;

  beforeEach(() => { state = createNarrativeFeedbackIntegrationCoreState(); });

  describe('createNarrativeFeedbackIntegrationCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.units.size).toBe(0);
      expect(state.events.size).toBe(0);
    });
  });

  describe('addFeedbackUnit', () => {
    it('should add unit', () => {
      const next = addFeedbackUnit(state, 'u1', 'reader', 'content', 0.7, 0.8, 1);
      expect(next.units.size).toBe(1);
      expect(next.totalUnits).toBe(1);
    });
  });

  describe('addIntegrationEvent', () => {
    it('should add event', () => {
      let next = addFeedbackUnit(state, 'u1', 'reader', 'content', 0.7, 0.8, 1);
      next = addIntegrationEvent(next, 'e1', 'u1', 'absorb', 'moderate', 0.5, 0.7, 'desc', 1);
      expect(next.totalEvents).toBe(1);
      expect(next.totalImprovement).toBeCloseTo(0.2, 5);
    });
  });

  describe('addIntegrationPattern', () => {
    it('should add pattern', () => {
      let next = addFeedbackUnit(state, 'u1', 'reader', 'content', 0.7, 0.8, 1);
      next = addIntegrationEvent(next, 'e1', 'u1', 'absorb', 'moderate', 0.5, 0.7, 'desc', 1);
      next = addIntegrationPattern(next, 'p1', 'main pattern', ['e1']);
      expect(next.totalPatterns).toBe(1);
    });
  });

  describe('getEventsByIntegration', () => {
    it('should filter by integration', () => {
      let next = addFeedbackUnit(state, 'u1', 'reader', 'content', 0.7, 0.8, 1);
      next = addIntegrationEvent(next, 'e1', 'u1', 'absorb', 'moderate', 0.5, 0.7, 'desc', 1);
      next = addIntegrationEvent(next, 'e2', 'u1', 'transform', 'moderate', 0.5, 0.7, 'desc', 1);
      const absorb = getEventsByIntegration(next, 'absorb');
      expect(absorb.length).toBe(1);
    });
  });

  describe('getIntegrationReport', () => {
    it('should return comprehensive report', () => {
      const report = getIntegrationReport(state);
      expect(report.totalEvents).toBe(0);
      expect(typeof report.integrationMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getIntegrationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeFeedbackIntegrationCoreState', () => {
    it('should reset all state', () => {
      let next = addFeedbackUnit(state, 'u1', 'reader', 'content', 0.7, 0.8, 1);
      next = resetNarrativeFeedbackIntegrationCoreState();
      expect(next.units.size).toBe(0);
      expect(next.totalUnits).toBe(0);
    });
  });
});