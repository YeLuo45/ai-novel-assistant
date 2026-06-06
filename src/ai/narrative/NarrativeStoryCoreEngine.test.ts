/**
 * V1303 NarrativeStoryCoreEngine Tests — Direction I Iter 19/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStoryCoreEngineState,
  addStoryCoreNode,
  addStoryCoreEssence,
  getStoryCoreNodesByElement,
  getStoryCoreReport,
  resetNarrativeStoryCoreEngineState,
  type NarrativeStoryCoreEngineState,
} from './NarrativeStoryCoreEngine';

describe('NarrativeStoryCoreEngine', () => {
  let state: NarrativeStoryCoreEngineState;

  beforeEach(() => { state = createNarrativeStoryCoreEngineState(); });

  describe('createNarrativeStoryCoreEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.cores.size).toBe(0);
      expect(state.essences.size).toBe(0);
    });
  });

  describe('addStoryCoreNode', () => {
    it('should add core', () => {
      const next = addStoryCoreNode(state, 'c1', 'transcendent', 'abyssal', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.cores.size).toBe(1);
      expect(next.totalCores).toBe(1);
    });
  });

  describe('addStoryCoreEssence', () => {
    it('should add essence', () => {
      let next = addStoryCoreNode(state, 'c1', 'transcendent', 'abyssal', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addStoryCoreEssence(next, 'e1', ['c1']);
      expect(next.totalEssences).toBe(1);
    });
  });

  describe('getStoryCoreNodesByElement', () => {
    it('should filter by element', () => {
      let next = addStoryCoreNode(state, 'c1', 'transcendent', 'abyssal', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addStoryCoreNode(next, 'c2', 'theme', 'abyssal', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getStoryCoreNodesByElement(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getStoryCoreReport', () => {
    it('should return comprehensive report', () => {
      const report = getStoryCoreReport(state);
      expect(report.totalCores).toBe(0);
      expect(typeof report.storyCoreMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStoryCoreReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStoryCoreEngineState', () => {
    it('should reset all state', () => {
      let next = addStoryCoreNode(state, 'c1', 'transcendent', 'abyssal', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeStoryCoreEngineState();
      expect(next.cores.size).toBe(0);
      expect(next.totalCores).toBe(0);
    });
  });
});