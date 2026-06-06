/**
 * V1273 NarrativeStoryWebEngine Tests — Direction I Iter 4/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStoryWebEngineState,
  addStoryWebThread,
  addStoryWebSection,
  getStoryWebThreadsByThread,
  getStoryWebReport,
  resetNarrativeStoryWebEngineState,
  type NarrativeStoryWebEngineState,
} from './NarrativeStoryWebEngine';

describe('NarrativeStoryWebEngine', () => {
  let state: NarrativeStoryWebEngineState;

  beforeEach(() => { state = createNarrativeStoryWebEngineState(); });

  describe('createNarrativeStoryWebEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.threads.size).toBe(0);
      expect(state.sections.size).toBe(0);
    });
  });

  describe('addStoryWebThread', () => {
    it('should add thread', () => {
      const next = addStoryWebThread(state, 't1', 'meta', 'overwhelming', 'inextricable', 'desc', 0.95, 0.9, 1);
      expect(next.threads.size).toBe(1);
      expect(next.totalThreads).toBe(1);
    });
  });

  describe('addStoryWebSection', () => {
    it('should add section', () => {
      let next = addStoryWebThread(state, 't1', 'meta', 'overwhelming', 'inextricable', 'desc', 0.95, 0.9, 1);
      next = addStoryWebSection(next, 's1', ['t1']);
      expect(next.totalSections).toBe(1);
    });
  });

  describe('getStoryWebThreadsByThread', () => {
    it('should filter by thread', () => {
      let next = addStoryWebThread(state, 't1', 'meta', 'overwhelming', 'inextricable', 'desc', 0.95, 0.9, 1);
      next = addStoryWebThread(next, 't2', 'primary', 'overwhelming', 'inextricable', 'desc', 0.95, 0.9, 1);
      const meta = getStoryWebThreadsByThread(next, 'meta');
      expect(meta.length).toBe(1);
    });
  });

  describe('getStoryWebReport', () => {
    it('should return comprehensive report', () => {
      const report = getStoryWebReport(state);
      expect(report.totalThreads).toBe(0);
      expect(typeof report.storyWebMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStoryWebReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStoryWebEngineState', () => {
    it('should reset all state', () => {
      let next = addStoryWebThread(state, 't1', 'meta', 'overwhelming', 'inextricable', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeStoryWebEngineState();
      expect(next.threads.size).toBe(0);
      expect(next.totalThreads).toBe(0);
    });
  });
});