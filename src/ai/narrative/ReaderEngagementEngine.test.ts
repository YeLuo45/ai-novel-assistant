/**
 * V681 ReaderEngagementEngine Tests — Direction C Iter 8/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createReaderEngagementState,
  addEngagementHook,
  resolveEngagementHook,
  addEngagementEvent,
  getHooksByType,
  getEngagementLevel,
  getEngagementRecommendations,
  getEngagementReport,
  resetReaderEngagementState,
  type ReaderEngagementState,
} from './ReaderEngagementEngine';

describe('ReaderEngagementEngine', () => {
  let state: ReaderEngagementState;

  beforeEach(() => { state = createReaderEngagementState(); });

  describe('createReaderEngagementState', () => {
    it('should initialize with defaults', () => {
      expect(state.hooks.size).toBe(0);
      expect(state.engagementCurve).toEqual([]);
      expect(state.totalHooks).toBe(0);
    });

    it('should have default engagement', () => {
      expect(state.averageEngagement).toBe(0.5);
    });
  });

  describe('addEngagementHook', () => {
    it('should add hook', () => {
      const next = addEngagementHook(state, 'h1', 'curiosity', 'Who is the murderer?', 100, 0.8);
      expect(next.hooks.size).toBe(1);
      expect(next.totalHooks).toBe(1);
    });

    it('should clamp strength', () => {
      const next = addEngagementHook(state, 'h1', 'curiosity', 'Hook', 100, 1.5);
      expect(next.hooks.get('h1')?.strength).toBe(1);
    });

    it('should set resolved to false', () => {
      const next = addEngagementHook(state, 'h1', 'curiosity', 'Hook', 100);
      expect(next.hooks.get('h1')?.resolved).toBe(false);
    });
  });

  describe('resolveEngagementHook', () => {
    it('should resolve hook', () => {
      let next = addEngagementHook(state, 'h1', 'curiosity', 'Hook', 100);
      next = resolveEngagementHook(next, 'h1', 500);
      expect(next.hooks.get('h1')?.resolved).toBe(true);
      expect(next.hooks.get('h1')?.resolutionPosition).toBe(500);
    });

    it('should return state for unknown hook', () => {
      const next = resolveEngagementHook(state, 'unknown', 100);
      expect(next.totalHooks).toBe(0);
    });
  });

  describe('addEngagementEvent', () => {
    it('should add event', () => {
      const next = addEngagementEvent(state, 'scene1', 0.7, 'climax', 100);
      expect(next.engagementCurve.length).toBe(1);
    });

    it('should accumulate events', () => {
      let next = addEngagementEvent(state, 'scene1', 0.7, 'climax', 100);
      next = addEngagementEvent(next, 'scene2', 0.5, 'build', 200);
      expect(next.engagementCurve.length).toBe(2);
    });
  });

  describe('getHooksByType', () => {
    it('should filter by type', () => {
      let next = addEngagementHook(state, 'h1', 'curiosity', 'Hook 1', 100);
      next = addEngagementHook(next, 'h2', 'mystery', 'Hook 2', 200);
      const curiosityHooks = getHooksByType(next, 'curiosity');
      expect(curiosityHooks.length).toBe(1);
    });
  });

  describe('getEngagementLevel', () => {
    it('should return low for low engagement', () => {
      let next = addEngagementEvent(state, 'scene1', 0.3, 'calm', 100);
      expect(getEngagementLevel(next)).toBe('low');
    });

    it('should return high for high engagement', () => {
      let next = addEngagementEvent(state, 'scene1', 0.7, 'climax', 100);
      expect(getEngagementLevel(next)).toBe('high');
    });

    it('should return peak for very high engagement', () => {
      let next = addEngagementEvent(state, 'scene1', 0.9, 'climax', 100);
      expect(getEngagementLevel(next)).toBe('peak');
    });
  });

  describe('getEngagementRecommendations', () => {
    it('should return empty for new state', () => {
      const recs = getEngagementRecommendations(state);
      expect(Array.isArray(recs)).toBe(true);
    });

    it('should warn about too many unresolved hooks', () => {
      let next = state;
      for (let i = 0; i < 12; i++) {
        next = addEngagementHook(next, `h${i}`, 'curiosity', `Hook ${i}`, i * 100);
      }
      const recs = getEngagementRecommendations(next);
      expect(recs.some(r => r.includes('unresolved hooks'))).toBe(true);
    });
  });

  describe('getEngagementReport', () => {
    it('should return comprehensive report', () => {
      const report = getEngagementReport(state);
      expect(typeof report.averageEngagement).toBe('number');
      expect(typeof report.peakEngagement).toBe('number');
    });
  });

  describe('resetReaderEngagementState', () => {
    it('should reset all state', () => {
      let next = addEngagementHook(state, 'h1', 'curiosity', 'Hook', 100);
      next = addEngagementEvent(next, 'scene1', 0.7, 'climax', 100);
      next = resetReaderEngagementState();
      expect(next.hooks.size).toBe(0);
      expect(next.engagementCurve.length).toBe(0);
    });
  });
});