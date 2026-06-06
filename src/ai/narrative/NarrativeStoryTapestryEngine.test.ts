/**
 * V1279 NarrativeStoryTapestryEngine Tests — Direction I Iter 7/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStoryTapestryEngineState,
  addStoryTapestryThread,
  addStoryTapestryPanel,
  getStoryTapestryThreadsByThread,
  getStoryTapestryReport,
  resetNarrativeStoryTapestryEngineState,
  type NarrativeStoryTapestryEngineState,
} from './NarrativeStoryTapestryEngine';

describe('NarrativeStoryTapestryEngine', () => {
  let state: NarrativeStoryTapestryEngineState;

  beforeEach(() => { state = createNarrativeStoryTapestryEngineState(); });

  describe('createNarrativeStoryTapestryEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.threads.size).toBe(0);
      expect(state.panels.size).toBe(0);
    });
  });

  describe('addStoryTapestryThread', () => {
    it('should add thread', () => {
      const next = addStoryTapestryThread(state, 't1', 'meta', 'opulent', 'kaleidoscopic', 'desc', 0.95, 0.9, 1);
      expect(next.threads.size).toBe(1);
      expect(next.totalThreads).toBe(1);
    });
  });

  describe('addStoryTapestryPanel', () => {
    it('should add panel', () => {
      let next = addStoryTapestryThread(state, 't1', 'meta', 'opulent', 'kaleidoscopic', 'desc', 0.95, 0.9, 1);
      next = addStoryTapestryPanel(next, 'p1', ['t1']);
      expect(next.totalPanels).toBe(1);
    });
  });

  describe('getStoryTapestryThreadsByThread', () => {
    it('should filter by thread', () => {
      let next = addStoryTapestryThread(state, 't1', 'meta', 'opulent', 'kaleidoscopic', 'desc', 0.95, 0.9, 1);
      next = addStoryTapestryThread(next, 't2', 'narrative', 'opulent', 'kaleidoscopic', 'desc', 0.95, 0.9, 1);
      const meta = getStoryTapestryThreadsByThread(next, 'meta');
      expect(meta.length).toBe(1);
    });
  });

  describe('getStoryTapestryReport', () => {
    it('should return comprehensive report', () => {
      const report = getStoryTapestryReport(state);
      expect(report.totalThreads).toBe(0);
      expect(typeof report.storyTapestryMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStoryTapestryReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStoryTapestryEngineState', () => {
    it('should reset all state', () => {
      let next = addStoryTapestryThread(state, 't1', 'meta', 'opulent', 'kaleidoscopic', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeStoryTapestryEngineState();
      expect(next.threads.size).toBe(0);
      expect(next.totalThreads).toBe(0);
    });
  });
});