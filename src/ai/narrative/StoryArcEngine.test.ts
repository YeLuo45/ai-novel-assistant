/**
 * V861 StoryArcEngine Tests — Direction B Iter 8/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createStoryArcEngineState,
  createStoryArc,
  advanceArcPhase,
  addArcBeat,
  completeStoryArc,
  getArcsByType,
  getStoryArcReport,
  resetStoryArcEngineState,
  type StoryArcEngineState,
} from './StoryArcEngine';

describe('StoryArcEngine', () => {
  let state: StoryArcEngineState;

  beforeEach(() => { state = createStoryArcEngineState(); });

  describe('createStoryArcEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.arcs.size).toBe(0);
      expect(state.beats.size).toBe(0);
    });
  });

  describe('createStoryArc', () => {
    it('should create arc', () => {
      const next = createStoryArc(state, 'a1', 'character', 'Hero arc', 1);
      expect(next.arcs.size).toBe(1);
      expect(next.totalArcs).toBe(1);
    });
  });

  describe('advanceArcPhase', () => {
    it('should advance', () => {
      let next = createStoryArc(state, 'a1', 'character', 'Hero arc', 1);
      next = advanceArcPhase(next, 'a1', 'crisis', 0.8);
      expect(next.arcs.get('a1')?.currentPhase).toBe('crisis');
    });
  });

  describe('addArcBeat', () => {
    it('should add beat', () => {
      let next = createStoryArc(state, 'a1', 'character', 'Hero arc', 1);
      next = addArcBeat(next, 'b1', 'a1', 'hero decides', 5, 'turn', 0.7);
      expect(next.totalBeats).toBe(1);
    });

    it('should update arc milestones', () => {
      let next = createStoryArc(state, 'a1', 'character', 'Hero arc', 1);
      next = addArcBeat(next, 'b1', 'a1', 'hero decides', 5, 'turn');
      expect(next.arcs.get('a1')?.milestones.length).toBe(1);
    });
  });

  describe('completeStoryArc', () => {
    it('should complete', () => {
      let next = createStoryArc(state, 'a1', 'character', 'Hero arc', 1);
      next = completeStoryArc(next, 'a1', 20);
      expect(next.arcs.get('a1')?.endChapter).toBe(20);
      expect(next.completedArcs).toBe(1);
    });
  });

  describe('getArcsByType', () => {
    it('should filter by type', () => {
      let next = createStoryArc(state, 'a1', 'character', 'Hero arc', 1);
      next = createStoryArc(next, 'a2', 'plot', 'Main plot', 1);
      const characterArcs = getArcsByType(next, 'character');
      expect(characterArcs.length).toBe(1);
    });
  });

  describe('getStoryArcReport', () => {
    it('should return comprehensive report', () => {
      const report = getStoryArcReport(state);
      expect(report.totalArcs).toBe(0);
      expect(typeof report.momentum).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStoryArcReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetStoryArcEngineState', () => {
    it('should reset all state', () => {
      let next = createStoryArc(state, 'a1', 'character', 'Hero arc', 1);
      next = resetStoryArcEngineState();
      expect(next.arcs.size).toBe(0);
      expect(next.totalArcs).toBe(0);
    });
  });
});