/**
 * V799 StyleRefinementEngine Tests — Direction D Iter 4/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createStyleRefinementEngineState,
  createStyleProfile,
  updateStyleMeasurement,
  applyStyleRefinement,
  verifyStyleRefinement,
  getProfilesByAspect,
  getStyleRefinementReport,
  resetStyleRefinementEngineState,
  type StyleRefinementEngineState,
} from './StyleRefinementEngine';

describe('StyleRefinementEngine', () => {
  let state: StyleRefinementEngineState;

  beforeEach(() => { state = createStyleRefinementEngineState(); });

  describe('createStyleRefinementEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.profiles.size).toBe(0);
      expect(state.refinements.size).toBe(0);
    });
  });

  describe('createStyleProfile', () => {
    it('should create profile', () => {
      const next = createStyleProfile(state, 'p1', 'voice', 0.5, 0.8);
      expect(next.profiles.size).toBe(1);
      expect(next.totalProfiles).toBe(1);
    });
  });

  describe('updateStyleMeasurement', () => {
    it('should update measurement', () => {
      let next = createStyleProfile(state, 'p1', 'voice', 0.5, 0.8);
      next = updateStyleMeasurement(next, 'p1', 0.7);
      expect(next.profiles.get('p1')?.samples).toBe(1);
      expect(next.profiles.get('p1')?.current).toBe(0.7);
    });
  });

  describe('applyStyleRefinement', () => {
    it('should apply refinement', () => {
      let next = createStyleProfile(state, 'p1', 'voice', 0.5, 0.8);
      next = applyStyleRefinement(next, 'r1', 'p1', 'intermediate', ['change tone'], 0.1);
      expect(next.totalRefinements).toBe(1);
    });

    it('should update profile current', () => {
      let next = createStyleProfile(state, 'p1', 'voice', 0.5, 0.8);
      next = applyStyleRefinement(next, 'r1', 'p1', 'intermediate', ['change'], 0.1);
      expect(next.profiles.get('p1')?.current).toBe(0.6);
    });
  });

  describe('verifyStyleRefinement', () => {
    it('should verify', () => {
      let next = createStyleProfile(state, 'p1', 'voice');
      next = applyStyleRefinement(next, 'r1', 'p1', 'intermediate', ['change'], 0.1);
      next = verifyStyleRefinement(next, 'r1', true);
      expect(next.refinements.get('r1')?.phase).toBe('verified');
    });
  });

  describe('getProfilesByAspect', () => {
    it('should filter by aspect', () => {
      let next = createStyleProfile(state, 'p1', 'voice');
      next = createStyleProfile(next, 'p2', 'tone');
      const voices = getProfilesByAspect(next, 'voice');
      expect(voices.length).toBe(1);
    });
  });

  describe('getStyleRefinementReport', () => {
    it('should return comprehensive report', () => {
      const report = getStyleRefinementReport(state);
      expect(report.totalProfiles).toBe(0);
      expect(typeof report.averageCoherence).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStyleRefinementReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetStyleRefinementEngineState', () => {
    it('should reset all state', () => {
      let next = createStyleProfile(state, 'p1', 'voice');
      next = resetStyleRefinementEngineState();
      expect(next.profiles.size).toBe(0);
      expect(next.totalProfiles).toBe(0);
    });
  });
});