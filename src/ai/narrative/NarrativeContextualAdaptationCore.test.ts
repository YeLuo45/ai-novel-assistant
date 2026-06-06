/**
 * V993 NarrativeContextualAdaptationCore Tests — Direction A Iter 14/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeContextualAdaptationCoreState,
  addContextDescriptor,
  addAdaptationAction,
  getActionsByStrategy,
  getContextualAdaptationReport,
  resetNarrativeContextualAdaptationCoreState,
  type NarrativeContextualAdaptationCoreState,
} from './NarrativeContextualAdaptationCore';

describe('NarrativeContextualAdaptationCore', () => {
  let state: NarrativeContextualAdaptationCoreState;

  beforeEach(() => { state = createNarrativeContextualAdaptationCoreState(); });

  describe('createNarrativeContextualAdaptationCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.contexts.size).toBe(0);
      expect(state.actions.size).toBe(0);
    });
  });

  describe('addContextDescriptor', () => {
    it('should add context', () => {
      const next = addContextDescriptor(state, 'c1', 'cultural', ['f1'], ['r1'], 'desc', 0.5);
      expect(next.contexts.size).toBe(1);
      expect(next.totalContexts).toBe(1);
    });
  });

  describe('addAdaptationAction', () => {
    it('should add action', () => {
      let next = addContextDescriptor(state, 'c1', 'cultural', ['f1'], ['r1'], 'desc', 0.5);
      next = addAdaptationAction(next, 'a1', 'c1', 'conforming', 'good', 0.5, 0.7, 'desc', 1);
      expect(next.totalActions).toBe(1);
    });
  });

  describe('getActionsByStrategy', () => {
    it('should filter by strategy', () => {
      let next = addContextDescriptor(state, 'c1', 'cultural', ['f1'], ['r1'], 'desc', 0.5);
      next = addAdaptationAction(next, 'a1', 'c1', 'conforming', 'good', 0.5, 0.7, 'desc', 1);
      next = addAdaptationAction(next, 'a2', 'c1', 'innovating', 'good', 0.5, 0.7, 'desc', 1);
      const conf = getActionsByStrategy(next, 'conforming');
      expect(conf.length).toBe(1);
    });
  });

  describe('getContextualAdaptationReport', () => {
    it('should return comprehensive report', () => {
      const report = getContextualAdaptationReport(state);
      expect(report.totalContexts).toBe(0);
      expect(typeof report.contextualAdaptationMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getContextualAdaptationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeContextualAdaptationCoreState', () => {
    it('should reset all state', () => {
      let next = addContextDescriptor(state, 'c1', 'cultural', ['f1'], ['r1'], 'desc', 0.5);
      next = resetNarrativeContextualAdaptationCoreState();
      expect(next.contexts.size).toBe(0);
      expect(next.totalContexts).toBe(0);
    });
  });
});