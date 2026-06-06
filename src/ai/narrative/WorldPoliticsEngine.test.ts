/**
 * V1059 WorldPoliticsEngine Tests — Direction C Iter 17/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWorldPoliticsEngineState,
  addPoliticalElement,
  addPoliticalFaction,
  getElementsBySystem,
  getPoliticsReport,
  resetWorldPoliticsEngineState,
  type WorldPoliticsEngineState,
} from './WorldPoliticsEngine';

describe('WorldPoliticsEngine', () => {
  let state: WorldPoliticsEngineState;

  beforeEach(() => { state = createWorldPoliticsEngineState(); });

  describe('createWorldPoliticsEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.elements.size).toBe(0);
      expect(state.factions.size).toBe(0);
    });
  });

  describe('addPoliticalElement', () => {
    it('should add element', () => {
      const next = addPoliticalElement(state, 'e1', 'monarchy', 'dominance', 'national', 'desc', 0.7, 0.8, 1);
      expect(next.elements.size).toBe(1);
      expect(next.totalElements).toBe(1);
    });
  });

  describe('addPoliticalFaction', () => {
    it('should add faction', () => {
      let next = addPoliticalElement(state, 'e1', 'monarchy', 'dominance', 'national', 'desc', 0.7, 0.8, 1);
      next = addPoliticalFaction(next, 'f1', 'royal court', ['e1']);
      expect(next.totalFactions).toBe(1);
    });
  });

  describe('getElementsBySystem', () => {
    it('should filter by system', () => {
      let next = addPoliticalElement(state, 'e1', 'monarchy', 'dominance', 'national', 'desc', 0.7, 0.8, 1);
      next = addPoliticalElement(next, 'e2', 'democracy', 'dominance', 'national', 'desc', 0.7, 0.8, 1);
      const monarchy = getElementsBySystem(next, 'monarchy');
      expect(monarchy.length).toBe(1);
    });
  });

  describe('getPoliticsReport', () => {
    it('should return comprehensive report', () => {
      const report = getPoliticsReport(state);
      expect(report.totalElements).toBe(0);
      expect(typeof report.politicsMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getPoliticsReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetWorldPoliticsEngineState', () => {
    it('should reset all state', () => {
      let next = addPoliticalElement(state, 'e1', 'monarchy', 'dominance', 'national', 'desc', 0.7, 0.8, 1);
      next = resetWorldPoliticsEngineState();
      expect(next.elements.size).toBe(0);
      expect(next.totalElements).toBe(0);
    });
  });
});