/**
 * V673 SceneTransitionEngine Tests — Direction C Iter 4/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSceneTransitionState,
  addTransition,
  getTransitionsBetweenScenes,
  getTransitionsByType,
  getTransitionFlow,
  getTransitionReport,
  resetSceneTransitionState,
  type SceneTransitionState,
} from './SceneTransitionEngine';

describe('SceneTransitionEngine', () => {
  let state: SceneTransitionState;

  beforeEach(() => { state = createSceneTransitionState(); });

  describe('createSceneTransitionState', () => {
    it('should initialize with defaults', () => {
      expect(state.transitions.size).toBe(0);
      expect(state.totalTransitions).toBe(0);
    });

    it('should have default quality and flow', () => {
      expect(state.averageQuality).toBe(0.6);
      expect(state.flowScore).toBe(0.7);
    });
  });

  describe('addTransition', () => {
    it('should add transition', () => {
      const next = addTransition(state, 't1', 's1', 's2', 'cut', 50);
      expect(next.transitions.size).toBe(1);
      expect(next.totalTransitions).toBe(1);
    });

    it('should compute quality for match_cut', () => {
      const next = addTransition(state, 't1', 's1', 's2', 'match_cut', 100);
      expect(next.transitions.get('t1')?.quality).toBe('excellent');
    });

    it('should compute quality for time_jump', () => {
      const next = addTransition(state, 't1', 's1', 's2', 'time_jump', 1000);
      expect(next.transitions.get('t1')?.quality).toBe('acceptable');
    });

    it('should compute quality for fast cut', () => {
      const next = addTransition(state, 't1', 's1', 's2', 'cut', 50);
      expect(next.transitions.get('t1')?.quality).toBe('good');
    });

    it('should compute continuity', () => {
      const next = addTransition(state, 't1', 's1', 's2', 'match_cut', 100);
      expect(next.transitions.get('t1')?.emotionalContinuity).toBe(0.95);
    });

    it('should set thematic echo', () => {
      const next = addTransition(state, 't1', 's1', 's2', 'dissolve', 1000, 'echoing death');
      expect(next.transitions.get('t1')?.thematicEcho).toBe('echoing death');
    });
  });

  describe('getTransitionsBetweenScenes', () => {
    it('should find transitions', () => {
      let next = addTransition(state, 't1', 's1', 's2', 'cut', 50);
      next = addTransition(next, 't2', 's2', 's3', 'cut', 50);
      const found = getTransitionsBetweenScenes(next, 's1', 's2');
      expect(found.length).toBe(1);
    });

    it('should return empty for no transitions', () => {
      const found = getTransitionsBetweenScenes(state, 's1', 's2');
      expect(found).toEqual([]);
    });
  });

  describe('getTransitionsByType', () => {
    it('should filter by type', () => {
      let next = addTransition(state, 't1', 's1', 's2', 'cut', 50);
      next = addTransition(next, 't2', 's2', 's3', 'fade', 1000);
      const cuts = getTransitionsByType(next, 'cut');
      expect(cuts.length).toBe(1);
    });
  });

  describe('getTransitionFlow', () => {
    it('should return all transitions', () => {
      let next = addTransition(state, 't1', 's1', 's2', 'cut', 50);
      next = addTransition(next, 't2', 's2', 's3', 'cut', 50);
      const flow = getTransitionFlow(next);
      expect(flow.length).toBe(2);
    });
  });

  describe('getTransitionReport', () => {
    it('should return comprehensive report', () => {
      const report = getTransitionReport(state);
      expect(typeof report.averageQuality).toBe('number');
      expect(typeof report.flowScore).toBe('number');
    });

    it('should include recommendations for low quality', () => {
      const report = getTransitionReport(state);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('resetSceneTransitionState', () => {
    it('should reset all state', () => {
      let next = addTransition(state, 't1', 's1', 's2', 'cut', 50);
      next = resetSceneTransitionState();
      expect(next.transitions.size).toBe(0);
      expect(next.totalTransitions).toBe(0);
    });
  });
});