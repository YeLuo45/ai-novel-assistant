/**
 * V849 StoryPacingEngine Tests — Direction B Iter 2/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createStoryPacingEngineState,
  addPacingSegment,
  createPacingCurve,
  getSegmentsByMode,
  getPacingReport,
  resetStoryPacingEngineState,
  type StoryPacingEngineState,
} from './StoryPacingEngine';

describe('StoryPacingEngine', () => {
  let state: StoryPacingEngineState;

  beforeEach(() => { state = createStoryPacingEngineState(); });

  describe('createStoryPacingEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.segments.size).toBe(0);
      expect(state.curves.size).toBe(0);
    });
  });

  describe('addPacingSegment', () => {
    it('should add segment', () => {
      const next = addPacingSegment(state, 's1', 'fast', 'action', 'setup', 0, 60, 0.8);
      expect(next.segments.size).toBe(1);
      expect(next.totalSegments).toBe(1);
    });

    it('should clamp intensity', () => {
      const next = addPacingSegment(state, 's1', 'fast', 'action', 'setup', 0, 60, 1.5);
      expect(next.segments.get('s1')?.intensity).toBe(1);
    });
  });

  describe('createPacingCurve', () => {
    it('should create curve', () => {
      let next = addPacingSegment(state, 's1', 'fast', 'action', 'setup', 0, 60, 0.5);
      next = addPacingSegment(next, 's2', 'slow', 'description', 'setup', 60, 120, 0.3);
      next = createPacingCurve(next, 'c1', 'opening', ['s1', 's2']);
      expect(next.totalCurves).toBe(1);
    });
  });

  describe('getSegmentsByMode', () => {
    it('should filter by mode', () => {
      let next = addPacingSegment(state, 's1', 'fast', 'action', 'setup', 0, 60, 0.5);
      next = addPacingSegment(next, 's2', 'slow', 'description', 'setup', 60, 120, 0.3);
      const fast = getSegmentsByMode(next, 'fast');
      expect(fast.length).toBe(1);
    });
  });

  describe('getPacingReport', () => {
    it('should return comprehensive report', () => {
      const report = getPacingReport(state);
      expect(report.totalSegments).toBe(0);
      expect(typeof report.rhythmScore).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getPacingReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetStoryPacingEngineState', () => {
    it('should reset all state', () => {
      let next = addPacingSegment(state, 's1', 'fast', 'action', 'setup', 0, 60, 0.5);
      next = resetStoryPacingEngineState();
      expect(next.segments.size).toBe(0);
      expect(next.totalSegments).toBe(0);
    });
  });
});