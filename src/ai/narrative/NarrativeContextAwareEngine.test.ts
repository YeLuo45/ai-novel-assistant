/**
 * V981 NarrativeContextAwareEngine Tests — Direction A Iter 8/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeContextAwareEngineState,
  addContextElement,
  createContextFrame,
  getElementsByLayer,
  getContextAwareReport,
  resetNarrativeContextAwareEngineState,
  type NarrativeContextAwareEngineState,
} from './NarrativeContextAwareEngine';

describe('NarrativeContextAwareEngine', () => {
  let state: NarrativeContextAwareEngineState;

  beforeEach(() => { state = createNarrativeContextAwareEngineState(); });

  describe('createNarrativeContextAwareEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.elements.size).toBe(0);
      expect(state.frames.size).toBe(0);
    });
  });

  describe('addContextElement', () => {
    it('should add element', () => {
      const next = addContextElement(state, 'e1', 'immediate', 'clear', 'relevant', 'desc', 0.7, 0.8, 1);
      expect(next.elements.size).toBe(1);
      expect(next.totalElements).toBe(1);
    });
  });

  describe('createContextFrame', () => {
    it('should create frame', () => {
      let next = addContextElement(state, 'e1', 'immediate', 'clear', 'relevant', 'desc', 0.7, 0.8, 1);
      next = createContextFrame(next, 'f1', 'main frame', ['e1']);
      expect(next.totalFrames).toBe(1);
    });
  });

  describe('getElementsByLayer', () => {
    it('should filter by layer', () => {
      let next = addContextElement(state, 'e1', 'immediate', 'clear', 'relevant', 'desc', 0.7, 0.8, 1);
      next = addContextElement(next, 'e2', 'global', 'clear', 'relevant', 'desc', 0.7, 0.8, 1);
      const immediate = getElementsByLayer(next, 'immediate');
      expect(immediate.length).toBe(1);
    });
  });

  describe('getContextAwareReport', () => {
    it('should return comprehensive report', () => {
      const report = getContextAwareReport(state);
      expect(report.totalElements).toBe(0);
      expect(typeof report.contextAwarenessMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getContextAwareReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeContextAwareEngineState', () => {
    it('should reset all state', () => {
      let next = addContextElement(state, 'e1', 'immediate', 'clear', 'relevant', 'desc', 0.7, 0.8, 1);
      next = resetNarrativeContextAwareEngineState();
      expect(next.elements.size).toBe(0);
      expect(next.totalElements).toBe(0);
    });
  });
});