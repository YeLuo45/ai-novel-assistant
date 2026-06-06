/**
 * V1049 NarrativeAestheticsEngine Tests — Direction C Iter 12/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAestheticsEngineState,
  addAestheticElement,
  addAestheticComposition,
  getElementsByPrinciple,
  getAestheticsReport,
  resetNarrativeAestheticsEngineState,
  type NarrativeAestheticsEngineState,
} from './NarrativeAestheticsEngine';

describe('NarrativeAestheticsEngine', () => {
  let state: NarrativeAestheticsEngineState;

  beforeEach(() => { state = createNarrativeAestheticsEngineState(); });

  describe('createNarrativeAestheticsEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.elements.size).toBe(0);
      expect(state.compositions.size).toBe(0);
    });
  });

  describe('addAestheticElement', () => {
    it('should add element', () => {
      const next = addAestheticElement(state, 'e1', 'unity', 'classical', 'sublime', 'desc', 0.8, 0.9, 1);
      expect(next.elements.size).toBe(1);
      expect(next.totalElements).toBe(1);
    });
  });

  describe('addAestheticComposition', () => {
    it('should add composition', () => {
      let next = addAestheticElement(state, 'e1', 'unity', 'classical', 'sublime', 'desc', 0.8, 0.9, 1);
      next = addAestheticComposition(next, 'c1', 'main', ['e1']);
      expect(next.totalCompositions).toBe(1);
    });
  });

  describe('getElementsByPrinciple', () => {
    it('should filter by principle', () => {
      let next = addAestheticElement(state, 'e1', 'unity', 'classical', 'sublime', 'desc', 0.8, 0.9, 1);
      next = addAestheticElement(next, 'e2', 'variety', 'classical', 'sublime', 'desc', 0.8, 0.9, 1);
      const unity = getElementsByPrinciple(next, 'unity');
      expect(unity.length).toBe(1);
    });
  });

  describe('getAestheticsReport', () => {
    it('should return comprehensive report', () => {
      const report = getAestheticsReport(state);
      expect(report.totalElements).toBe(0);
      expect(typeof report.aestheticsMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAestheticsReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAestheticsEngineState', () => {
    it('should reset all state', () => {
      let next = addAestheticElement(state, 'e1', 'unity', 'classical', 'sublime', 'desc', 0.8, 0.9, 1);
      next = resetNarrativeAestheticsEngineState();
      expect(next.elements.size).toBe(0);
      expect(next.totalElements).toBe(0);
    });
  });
});