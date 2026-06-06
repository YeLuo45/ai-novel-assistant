/**
 * V1301 NarrativeStorySpineEngine Tests — Direction I Iter 18/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStorySpineEngineState,
  addStorySpineNode,
  addStorySpineSection,
  getStorySpineNodesByVertebra,
  getStorySpineReport,
  resetNarrativeStorySpineEngineState,
  type NarrativeStorySpineEngineState,
} from './NarrativeStorySpineEngine';

describe('NarrativeStorySpineEngine', () => {
  let state: NarrativeStorySpineEngineState;

  beforeEach(() => { state = createNarrativeStorySpineEngineState(); });

  describe('createNarrativeStorySpineEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.spines.size).toBe(0);
      expect(state.sections.size).toBe(0);
    });
  });

  describe('addStorySpineNode', () => {
    it('should add spine', () => {
      const next = addStorySpineNode(state, 's1', 'transcendent', 'fluid', 'infallible', 'desc', 0.95, 0.9, 1);
      expect(next.spines.size).toBe(1);
      expect(next.totalSpines).toBe(1);
    });
  });

  describe('addStorySpineSection', () => {
    it('should add section', () => {
      let next = addStorySpineNode(state, 's1', 'transcendent', 'fluid', 'infallible', 'desc', 0.95, 0.9, 1);
      next = addStorySpineSection(next, 'sec1', ['s1']);
      expect(next.totalSections).toBe(1);
    });
  });

  describe('getStorySpineNodesByVertebra', () => {
    it('should filter by vertebra', () => {
      let next = addStorySpineNode(state, 's1', 'transcendent', 'fluid', 'infallible', 'desc', 0.95, 0.9, 1);
      next = addStorySpineNode(next, 's2', 'plot_point', 'fluid', 'infallible', 'desc', 0.95, 0.9, 1);
      const transcendent = getStorySpineNodesByVertebra(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getStorySpineReport', () => {
    it('should return comprehensive report', () => {
      const report = getStorySpineReport(state);
      expect(report.totalSpines).toBe(0);
      expect(typeof report.storySpineMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStorySpineReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStorySpineEngineState', () => {
    it('should reset all state', () => {
      let next = addStorySpineNode(state, 's1', 'transcendent', 'fluid', 'infallible', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeStorySpineEngineState();
      expect(next.spines.size).toBe(0);
      expect(next.totalSpines).toBe(0);
    });
  });
});