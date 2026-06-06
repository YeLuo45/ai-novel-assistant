/**
 * V1033 NarrativeLinguisticsEngine Tests — Direction C Iter 4/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeLinguisticsEngineState,
  addLinguisticChoice,
  addLinguisticProfile,
  getChoicesByFeature,
  getLinguisticsReport,
  resetNarrativeLinguisticsEngineState,
  type NarrativeLinguisticsEngineState,
} from './NarrativeLinguisticsEngine';

describe('NarrativeLinguisticsEngine', () => {
  let state: NarrativeLinguisticsEngineState;

  beforeEach(() => { state = createNarrativeLinguisticsEngineState(); });

  describe('createNarrativeLinguisticsEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.choices.size).toBe(0);
      expect(state.profiles.size).toBe(0);
    });
  });

  describe('addLinguisticChoice', () => {
    it('should add choice', () => {
      const next = addLinguisticChoice(state, 'c1', 'dialect', 'characterization', 'lexical', 'desc', 0.8, 0.7, 1);
      expect(next.choices.size).toBe(1);
      expect(next.totalChoices).toBe(1);
    });
  });

  describe('addLinguisticProfile', () => {
    it('should add profile', () => {
      let next = addLinguisticChoice(state, 'c1', 'dialect', 'characterization', 'lexical', 'desc', 0.8, 0.7, 1);
      next = addLinguisticProfile(next, 'p1', 'char1', ['c1']);
      expect(next.totalProfiles).toBe(1);
    });
  });

  describe('getChoicesByFeature', () => {
    it('should filter by feature', () => {
      let next = addLinguisticChoice(state, 'c1', 'dialect', 'characterization', 'lexical', 'desc', 0.8, 0.7, 1);
      next = addLinguisticChoice(next, 'c2', 'jargon', 'characterization', 'lexical', 'desc', 0.8, 0.7, 1);
      const dialect = getChoicesByFeature(next, 'dialect');
      expect(dialect.length).toBe(1);
    });
  });

  describe('getLinguisticsReport', () => {
    it('should return comprehensive report', () => {
      const report = getLinguisticsReport(state);
      expect(report.totalChoices).toBe(0);
      expect(typeof report.linguisticsMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getLinguisticsReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeLinguisticsEngineState', () => {
    it('should reset all state', () => {
      let next = addLinguisticChoice(state, 'c1', 'dialect', 'characterization', 'lexical', 'desc', 0.8, 0.7, 1);
      next = resetNarrativeLinguisticsEngineState();
      expect(next.choices.size).toBe(0);
      expect(next.totalChoices).toBe(0);
    });
  });
});