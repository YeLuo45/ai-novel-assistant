/**
 * V927 AdaptiveRevisionEngine Tests — Direction D Iter 11/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAdaptiveRevisionEngineState,
  addRevision,
  addRevisionStrategy,
  useRevisionStrategy,
  getRevisionsByFocus,
  getRevisionReport,
  resetAdaptiveRevisionEngineState,
  type AdaptiveRevisionEngineState,
} from './AdaptiveRevisionEngine';

describe('AdaptiveRevisionEngine', () => {
  let state: AdaptiveRevisionEngineState;

  beforeEach(() => { state = createAdaptiveRevisionEngineState(); });

  describe('createAdaptiveRevisionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.revisions.size).toBe(0);
      expect(state.strategies.size).toBe(0);
    });
  });

  describe('addRevision', () => {
    it('should add revision', () => {
      const next = addRevision(state, 'r1', 'moderate', 'prose', 'desc', 'minor_change', 0.2, 1);
      expect(next.revisions.size).toBe(1);
      expect(next.totalImprovement).toBeCloseTo(0.2, 5);
    });
  });

  describe('addRevisionStrategy', () => {
    it('should add strategy', () => {
      let next = addRevision(state, 'r1', 'moderate', 'prose', 'desc', 'minor_change', 0.2, 1);
      next = addRevisionStrategy(next, 's1', 'prose polish', ['r1']);
      expect(next.totalStrategies).toBe(1);
    });
  });

  describe('useRevisionStrategy', () => {
    it('should use', () => {
      let next = addRevision(state, 'r1', 'moderate', 'prose', 'desc', 'minor_change', 0.2, 1);
      next = addRevisionStrategy(next, 's1', 'name', ['r1']);
      next = useRevisionStrategy(next, 's1');
      expect(next.strategies.get('s1')?.usage).toBe(1);
    });
  });

  describe('getRevisionsByFocus', () => {
    it('should filter by focus', () => {
      let next = addRevision(state, 'r1', 'moderate', 'prose', 'desc', 'minor_change', 0.2, 1);
      next = addRevision(next, 'r2', 'moderate', 'plot', 'desc', 'minor_change', 0.2, 1);
      const prose = getRevisionsByFocus(next, 'prose');
      expect(prose.length).toBe(1);
    });
  });

  describe('getRevisionReport', () => {
    it('should return comprehensive report', () => {
      const report = getRevisionReport(state);
      expect(report.totalRevisions).toBe(0);
      expect(typeof report.adaptiveMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getRevisionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetAdaptiveRevisionEngineState', () => {
    it('should reset all state', () => {
      let next = addRevision(state, 'r1', 'moderate', 'prose', 'desc', 'minor_change', 0.2, 1);
      next = resetAdaptiveRevisionEngineState();
      expect(next.revisions.size).toBe(0);
      expect(next.totalRevisions).toBe(0);
    });
  });
});