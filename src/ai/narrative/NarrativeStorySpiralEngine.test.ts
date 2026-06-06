/**
 * V1285 NarrativeStorySpiralEngine Tests — Direction I Iter 10/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStorySpiralEngineState,
  addStorySpiralNode,
  addStorySpiralLoop,
  getStorySpiralNodesByDirection,
  getStorySpiralReport,
  resetNarrativeStorySpiralEngineState,
  type NarrativeStorySpiralEngineState,
} from './NarrativeStorySpiralEngine';

describe('NarrativeStorySpiralEngine', () => {
  let state: NarrativeStorySpiralEngineState;

  beforeEach(() => { state = createNarrativeStorySpiralEngineState(); });

  describe('createNarrativeStorySpiralEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.spirals.size).toBe(0);
      expect(state.loops.size).toBe(0);
    });
  });

  describe('addStorySpiralNode', () => {
    it('should add spiral', () => {
      const next = addStorySpiralNode(state, 's1', 'galactic', 'infinitesimal', 'hyperbolic', 'desc', 0.95, 0.9, 1);
      expect(next.spirals.size).toBe(1);
      expect(next.totalSpirals).toBe(1);
    });
  });

  describe('addStorySpiralLoop', () => {
    it('should add loop', () => {
      let next = addStorySpiralNode(state, 's1', 'galactic', 'infinitesimal', 'hyperbolic', 'desc', 0.95, 0.9, 1);
      next = addStorySpiralLoop(next, 'l1', ['s1']);
      expect(next.totalLoops).toBe(1);
    });
  });

  describe('getStorySpiralNodesByDirection', () => {
    it('should filter by direction', () => {
      let next = addStorySpiralNode(state, 's1', 'galactic', 'infinitesimal', 'hyperbolic', 'desc', 0.95, 0.9, 1);
      next = addStorySpiralNode(next, 's2', 'ascending', 'infinitesimal', 'hyperbolic', 'desc', 0.95, 0.9, 1);
      const galactic = getStorySpiralNodesByDirection(next, 'galactic');
      expect(galactic.length).toBe(1);
    });
  });

  describe('getStorySpiralReport', () => {
    it('should return comprehensive report', () => {
      const report = getStorySpiralReport(state);
      expect(report.totalSpirals).toBe(0);
      expect(typeof report.storySpiralMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStorySpiralReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStorySpiralEngineState', () => {
    it('should reset all state', () => {
      let next = addStorySpiralNode(state, 's1', 'galactic', 'infinitesimal', 'hyperbolic', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeStorySpiralEngineState();
      expect(next.spirals.size).toBe(0);
      expect(next.totalSpirals).toBe(0);
    });
  });
});