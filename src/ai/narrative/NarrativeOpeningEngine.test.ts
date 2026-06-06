/**
 * V1017 NarrativeOpeningEngine Tests — Direction B Iter 11/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeOpeningEngineState,
  addOpening,
  addOpeningStrategy,
  useOpeningStrategy,
  getOpeningsByType,
  getOpeningReport,
  resetNarrativeOpeningEngineState,
  type NarrativeOpeningEngineState,
} from './NarrativeOpeningEngine';

describe('NarrativeOpeningEngine', () => {
  let state: NarrativeOpeningEngineState;

  beforeEach(() => { state = createNarrativeOpeningEngineState(); });

  describe('createNarrativeOpeningEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.openings.size).toBe(0);
      expect(state.strategies.size).toBe(0);
    });
  });

  describe('addOpening', () => {
    it('should add opening', () => {
      const next = addOpening(state, 'o1', 'in_medias_res', 'strong', 'sparse', 'desc', 0.8, 0.9, 1);
      expect(next.openings.size).toBe(1);
      expect(next.totalOpenings).toBe(1);
    });
  });

  describe('addOpeningStrategy', () => {
    it('should add strategy', () => {
      let next = addOpening(state, 'o1', 'in_medias_res', 'strong', 'sparse', 'desc', 0.8, 0.9, 1);
      next = addOpeningStrategy(next, 's1', 'main strategy', 'o1');
      expect(next.totalStrategies).toBe(1);
    });
  });

  describe('useOpeningStrategy', () => {
    it('should use', () => {
      let next = addOpening(state, 'o1', 'in_medias_res', 'strong', 'sparse', 'desc', 0.8, 0.9, 1);
      next = addOpeningStrategy(next, 's1', 'name', 'o1');
      next = useOpeningStrategy(next, 's1');
      expect(next.strategies.get('s1')?.reuse).toBe(1);
    });
  });

  describe('getOpeningsByType', () => {
    it('should filter by type', () => {
      let next = addOpening(state, 'o1', 'in_medias_res', 'strong', 'sparse', 'desc', 0.8, 0.9, 1);
      next = addOpening(next, 'o2', 'flashback', 'strong', 'sparse', 'desc', 0.8, 0.9, 1);
      const imr = getOpeningsByType(next, 'in_medias_res');
      expect(imr.length).toBe(1);
    });
  });

  describe('getOpeningReport', () => {
    it('should return comprehensive report', () => {
      const report = getOpeningReport(state);
      expect(report.totalOpenings).toBe(0);
      expect(typeof report.openingMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getOpeningReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeOpeningEngineState', () => {
    it('should reset all state', () => {
      let next = addOpening(state, 'o1', 'in_medias_res', 'strong', 'sparse', 'desc', 0.8, 0.9, 1);
      next = resetNarrativeOpeningEngineState();
      expect(next.openings.size).toBe(0);
      expect(next.totalOpenings).toBe(0);
    });
  });
});