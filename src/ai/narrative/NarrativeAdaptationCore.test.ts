/**
 * V825 NarrativeAdaptationCore Tests — Direction E Iter 8/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAdaptationCoreState,
  detectAdaptation,
  applyAdaptation,
  verifyAdaptation,
  addAdaptationContext,
  getAdaptationsByType,
  getAdaptationCoreReport,
  resetNarrativeAdaptationCoreState,
  type NarrativeAdaptationCoreState,
} from './NarrativeAdaptationCore';

describe('NarrativeAdaptationCore', () => {
  let state: NarrativeAdaptationCoreState;

  beforeEach(() => { state = createNarrativeAdaptationCoreState(); });

  describe('createNarrativeAdaptationCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.adaptations.size).toBe(0);
      expect(state.contexts.size).toBe(0);
    });
  });

  describe('detectAdaptation', () => {
    it('should detect', () => {
      const next = detectAdaptation(state, 'a1', 'feedback', 'chapter 3', 'pacing too slow', 0.7);
      expect(next.adaptations.size).toBe(1);
      expect(next.totalAdaptations).toBe(1);
    });

    it('should clamp impact', () => {
      const next = detectAdaptation(state, 'a1', 'feedback', 'target', 'desc', 1.5);
      expect(next.adaptations.get('a1')?.impact).toBe(1);
    });
  });

  describe('applyAdaptation', () => {
    it('should apply', () => {
      let next = detectAdaptation(state, 'a1', 'feedback', 't', 'd');
      next = applyAdaptation(next, 'a1', 'expand', 'before', 'after');
      expect(next.adaptations.get('a1')?.status).toBe('applying');
      expect(next.adaptations.get('a1')?.after).toBe('after');
    });
  });

  describe('verifyAdaptation', () => {
    it('should verify', () => {
      let next = detectAdaptation(state, 'a1', 'feedback', 't', 'd');
      next = applyAdaptation(next, 'a1', 'expand', 'b', 'a');
      next = verifyAdaptation(next, 'a1', true);
      expect(next.adaptations.get('a1')?.status).toBe('verified');
      expect(next.verifiedAdaptations).toBe(1);
    });

    it('should mark as reverted', () => {
      let next = detectAdaptation(state, 'a1', 'feedback', 't', 'd');
      next = applyAdaptation(next, 'a1', 'expand', 'b', 'a');
      next = verifyAdaptation(next, 'a1', false);
      expect(next.adaptations.get('a1')?.status).toBe('reverted');
    });
  });

  describe('addAdaptationContext', () => {
    it('should add context', () => {
      const next = addAdaptationContext(state, 'c1', ['low tension'], 'expand');
      expect(next.totalContexts).toBe(1);
    });
  });

  describe('getAdaptationsByType', () => {
    it('should filter by type', () => {
      let next = detectAdaptation(state, 'a1', 'feedback', 't', 'd');
      next = applyAdaptation(next, 'a1', 'expand', 'b', 'a');
      next = detectAdaptation(next, 'a2', 'metric', 't', 'd');
      next = applyAdaptation(next, 'a2', 'contract', 'b', 'a');
      const expands = getAdaptationsByType(next, 'expand');
      expect(expands.length).toBe(1);
    });
  });

  describe('getAdaptationCoreReport', () => {
    it('should return comprehensive report', () => {
      const report = getAdaptationCoreReport(state);
      expect(report.totalAdaptations).toBe(0);
      expect(typeof report.responsiveness).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAdaptationCoreReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAdaptationCoreState', () => {
    it('should reset all state', () => {
      let next = detectAdaptation(state, 'a1', 'feedback', 't', 'd');
      next = resetNarrativeAdaptationCoreState();
      expect(next.adaptations.size).toBe(0);
      expect(next.totalAdaptations).toBe(0);
    });
  });
});