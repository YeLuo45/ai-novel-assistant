/**
 * V919 AdaptiveContextEngine Tests — Direction D Iter 7/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAdaptiveContextEngineState,
  addContextElement,
  addContextAdaptation,
  getElementsByAspect,
  getContextReport,
  resetAdaptiveContextEngineState,
  type AdaptiveContextEngineState,
} from './AdaptiveContextEngine';

describe('AdaptiveContextEngine', () => {
  let state: AdaptiveContextEngineState;

  beforeEach(() => { state = createAdaptiveContextEngineState(); });

  describe('createAdaptiveContextEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.elements.size).toBe(0);
      expect(state.adaptations.size).toBe(0);
    });
  });

  describe('addContextElement', () => {
    it('should add element', () => {
      const next = addContextElement(state, 'e1', 'cultural', 'medieval setting', 'central', 1, 0.8);
      expect(next.elements.size).toBe(1);
      expect(next.totalElements).toBe(1);
    });
  });

  describe('addContextAdaptation', () => {
    it('should add adaptation', () => {
      let next = addContextElement(state, 'e1', 'cultural', 'desc', 'central', 1);
      next = addContextAdaptation(next, 'a1', 'e1', 'embrace', 0.8, 'desc', 2);
      expect(next.totalAdaptations).toBe(1);
    });
  });

  describe('getElementsByAspect', () => {
    it('should filter by aspect', () => {
      let next = addContextElement(state, 'e1', 'cultural', 'desc', 'central', 1);
      next = addContextElement(next, 'e2', 'historical', 'desc', 'central', 1);
      const cultural = getElementsByAspect(next, 'cultural');
      expect(cultural.length).toBe(1);
    });
  });

  describe('getContextReport', () => {
    it('should return comprehensive report', () => {
      const report = getContextReport(state);
      expect(report.totalElements).toBe(0);
      expect(typeof report.contextMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getContextReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetAdaptiveContextEngineState', () => {
    it('should reset all state', () => {
      let next = addContextElement(state, 'e1', 'cultural', 'desc', 'central', 1);
      next = resetAdaptiveContextEngineState();
      expect(next.elements.size).toBe(0);
      expect(next.totalElements).toBe(0);
    });
  });
});