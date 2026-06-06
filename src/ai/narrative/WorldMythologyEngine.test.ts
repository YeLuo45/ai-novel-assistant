/**
 * V1027 WorldMythologyEngine Tests — Direction C Iter 1/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWorldMythologyEngineState,
  addMyth,
  addMythicEra,
  getMythsByType,
  getMythologyReport,
  resetWorldMythologyEngineState,
  type WorldMythologyEngineState,
} from './WorldMythologyEngine';

describe('WorldMythologyEngine', () => {
  let state: WorldMythologyEngineState;

  beforeEach(() => { state = createWorldMythologyEngineState(); });

  describe('createWorldMythologyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.myths.size).toBe(0);
      expect(state.eras.size).toBe(0);
    });
  });

  describe('addMyth', () => {
    it('should add myth', () => {
      const next = addMyth(state, 'm1', 'creation', 'universal', 'scripture', 'Origin', 'desc', 0.9, 0.8, 1);
      expect(next.myths.size).toBe(1);
      expect(next.totalMyths).toBe(1);
    });
  });

  describe('addMythicEra', () => {
    it('should add era', () => {
      let next = addMyth(state, 'm1', 'creation', 'universal', 'scripture', 'Origin', 'desc', 0.9, 0.8, 1);
      next = addMythicEra(next, 'e1', 'Dawn Era', ['m1']);
      expect(next.totalEras).toBe(1);
    });
  });

  describe('getMythsByType', () => {
    it('should filter by type', () => {
      let next = addMyth(state, 'm1', 'creation', 'universal', 'scripture', 'Origin', 'desc', 0.9, 0.8, 1);
      next = addMyth(next, 'm2', 'hero', 'universal', 'scripture', 'Hero', 'desc', 0.9, 0.8, 1);
      const creation = getMythsByType(next, 'creation');
      expect(creation.length).toBe(1);
    });
  });

  describe('getMythologyReport', () => {
    it('should return comprehensive report', () => {
      const report = getMythologyReport(state);
      expect(report.totalMyths).toBe(0);
      expect(typeof report.mythologyMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getMythologyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetWorldMythologyEngineState', () => {
    it('should reset all state', () => {
      let next = addMyth(state, 'm1', 'creation', 'universal', 'scripture', 'Origin', 'desc', 0.9, 0.8, 1);
      next = resetWorldMythologyEngineState();
      expect(next.myths.size).toBe(0);
      expect(next.totalMyths).toBe(0);
    });
  });
});