/**
 * V819 NarrativeUnderstandingEngine Tests — Direction E Iter 5/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeUnderstandingEngineState,
  addUnderstanding,
  addInterpretation,
  chooseInterpretation,
  getUnderstandingsByAspect,
  getUnderstandingReport,
  resetNarrativeUnderstandingEngineState,
  type NarrativeUnderstandingEngineState,
} from './NarrativeUnderstandingEngine';

describe('NarrativeUnderstandingEngine', () => {
  let state: NarrativeUnderstandingEngineState;

  beforeEach(() => { state = createNarrativeUnderstandingEngineState(); });

  describe('createNarrativeUnderstandingEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.understandings.size).toBe(0);
      expect(state.interpretations.size).toBe(0);
    });
  });

  describe('addUnderstanding', () => {
    it('should add understanding', () => {
      const next = addUnderstanding(state, 'u1', 'meaning', 'functional', 'the ring', 'represents power', 'probable', ['ev1']);
      expect(next.understandings.size).toBe(1);
      expect(next.totalUnderstandings).toBe(1);
    });
  });

  describe('addInterpretation', () => {
    it('should add interpretation', () => {
      const next = addInterpretation(state, 'i1', 'u1', 'interpretation text', 0.8, 'rationale');
      expect(next.totalInterpretations).toBe(1);
    });

    it('should clamp quality', () => {
      const next = addInterpretation(state, 'i1', 'u1', 'text', 1.5);
      expect(next.interpretations.get('i1')?.quality).toBe(1);
    });
  });

  describe('chooseInterpretation', () => {
    it('should choose', () => {
      let next = addInterpretation(state, 'i1', 'u1', 'text', 0.8);
      next = chooseInterpretation(next, 'i1');
      expect(next.interpretations.get('i1')?.chosen).toBe(true);
    });
  });

  describe('getUnderstandingsByAspect', () => {
    it('should filter by aspect', () => {
      let next = addUnderstanding(state, 'u1', 'meaning', 'functional', 's', 'i');
      next = addUnderstanding(next, 'u2', 'beauty', 'philosophical', 's', 'i');
      const meanings = getUnderstandingsByAspect(next, 'meaning');
      expect(meanings.length).toBe(1);
    });
  });

  describe('getUnderstandingReport', () => {
    it('should return comprehensive report', () => {
      const report = getUnderstandingReport(state);
      expect(report.totalUnderstandings).toBe(0);
      expect(typeof report.certaintyLevel).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getUnderstandingReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeUnderstandingEngineState', () => {
    it('should reset all state', () => {
      let next = addUnderstanding(state, 'u1', 'meaning', 'functional', 's', 'i');
      next = resetNarrativeUnderstandingEngineState();
      expect(next.understandings.size).toBe(0);
      expect(next.totalUnderstandings).toBe(0);
    });
  });
});