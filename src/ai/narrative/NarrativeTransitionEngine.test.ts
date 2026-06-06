/**
 * V1021 NarrativeTransitionEngine Tests — Direction B Iter 13/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTransitionEngineState,
  addTransition,
  createTransitionSequence,
  getTransitionsByType,
  getTransitionReport,
  resetNarrativeTransitionEngineState,
  type NarrativeTransitionEngineState,
} from './NarrativeTransitionEngine';

describe('NarrativeTransitionEngine', () => {
  let state: NarrativeTransitionEngineState;

  beforeEach(() => { state = createNarrativeTransitionEngineState(); });

  describe('createNarrativeTransitionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.transitions.size).toBe(0);
      expect(state.sequences.size).toBe(0);
    });
  });

  describe('addTransition', () => {
    it('should add transition', () => {
      const next = addTransition(state, 't1', 'cut', 'smooth', 'time', 'desc', 0.7, 0.8, 1);
      expect(next.transitions.size).toBe(1);
      expect(next.totalTransitions).toBe(1);
    });
  });

  describe('createTransitionSequence', () => {
    it('should create sequence', () => {
      let next = addTransition(state, 't1', 'cut', 'smooth', 'time', 'desc', 0.7, 0.8, 1);
      next = addTransition(next, 't2', 'dissolve', 'smooth', 'time', 'desc', 0.7, 0.8, 1);
      next = createTransitionSequence(next, 's1', ['t1', 't2']);
      expect(next.totalSequences).toBe(1);
    });
  });

  describe('getTransitionsByType', () => {
    it('should filter by type', () => {
      let next = addTransition(state, 't1', 'cut', 'smooth', 'time', 'desc', 0.7, 0.8, 1);
      next = addTransition(next, 't2', 'dissolve', 'smooth', 'time', 'desc', 0.7, 0.8, 1);
      const cuts = getTransitionsByType(next, 'cut');
      expect(cuts.length).toBe(1);
    });
  });

  describe('getTransitionReport', () => {
    it('should return comprehensive report', () => {
      const report = getTransitionReport(state);
      expect(report.totalTransitions).toBe(0);
      expect(typeof report.transitionMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTransitionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTransitionEngineState', () => {
    it('should reset all state', () => {
      let next = addTransition(state, 't1', 'cut', 'smooth', 'time', 'desc', 0.7, 0.8, 1);
      next = resetNarrativeTransitionEngineState();
      expect(next.transitions.size).toBe(0);
      expect(next.totalTransitions).toBe(0);
    });
  });
});