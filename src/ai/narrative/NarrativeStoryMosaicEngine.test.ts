/**
 * V1281 NarrativeStoryMosaicEngine Tests — Direction I Iter 8/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStoryMosaicEngineState,
  addStoryMosaicFragment,
  addStoryMosaicSection,
  getStoryMosaicFragmentsByFragment,
  getStoryMosaicReport,
  resetNarrativeStoryMosaicEngineState,
  type NarrativeStoryMosaicEngineState,
} from './NarrativeStoryMosaicEngine';

describe('NarrativeStoryMosaicEngine', () => {
  let state: NarrativeStoryMosaicEngineState;

  beforeEach(() => { state = createNarrativeStoryMosaicEngineState(); });

  describe('createNarrativeStoryMosaicEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.fragments.size).toBe(0);
      expect(state.sections.size).toBe(0);
    });
  });

  describe('addStoryMosaicFragment', () => {
    it('should add fragment', () => {
      const next = addStoryMosaicFragment(state, 'f1', 'vision', 'seamless', 'spiral', 'desc', 0.95, 0.9, 1);
      expect(next.fragments.size).toBe(1);
      expect(next.totalFragments).toBe(1);
    });
  });

  describe('addStoryMosaicSection', () => {
    it('should add section', () => {
      let next = addStoryMosaicFragment(state, 'f1', 'vision', 'seamless', 'spiral', 'desc', 0.95, 0.9, 1);
      next = addStoryMosaicSection(next, 's1', ['f1']);
      expect(next.totalSections).toBe(1);
    });
  });

  describe('getStoryMosaicFragmentsByFragment', () => {
    it('should filter by fragment', () => {
      let next = addStoryMosaicFragment(state, 'f1', 'vision', 'seamless', 'spiral', 'desc', 0.95, 0.9, 1);
      next = addStoryMosaicFragment(next, 'f2', 'scene', 'seamless', 'spiral', 'desc', 0.95, 0.9, 1);
      const vision = getStoryMosaicFragmentsByFragment(next, 'vision');
      expect(vision.length).toBe(1);
    });
  });

  describe('getStoryMosaicReport', () => {
    it('should return comprehensive report', () => {
      const report = getStoryMosaicReport(state);
      expect(report.totalFragments).toBe(0);
      expect(typeof report.storyMosaicMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStoryMosaicReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStoryMosaicEngineState', () => {
    it('should reset all state', () => {
      let next = addStoryMosaicFragment(state, 'f1', 'vision', 'seamless', 'spiral', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeStoryMosaicEngineState();
      expect(next.fragments.size).toBe(0);
      expect(next.totalFragments).toBe(0);
    });
  });
});