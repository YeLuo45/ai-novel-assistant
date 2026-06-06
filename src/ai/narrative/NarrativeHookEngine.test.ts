/**
 * V1007 NarrativeHookEngine Tests — Direction B Iter 6/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeHookEngineState,
  addHook,
  createHookSequence,
  getHooksByType,
  getHookReport,
  resetNarrativeHookEngineState,
  type NarrativeHookEngineState,
} from './NarrativeHookEngine';

describe('NarrativeHookEngine', () => {
  let state: NarrativeHookEngineState;

  beforeEach(() => { state = createNarrativeHookEngineState(); });

  describe('createNarrativeHookEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.hooks.size).toBe(0);
      expect(state.sequences.size).toBe(0);
    });
  });

  describe('addHook', () => {
    it('should add hook', () => {
      const next = addHook(state, 'h1', 'mystery', 'compelling', 'chapter_start', 'desc', 0.8, 0.7, 1);
      expect(next.hooks.size).toBe(1);
      expect(next.totalHooks).toBe(1);
    });
  });

  describe('createHookSequence', () => {
    it('should create sequence', () => {
      let next = addHook(state, 'h1', 'mystery', 'compelling', 'chapter_start', 'desc', 0.8, 0.7, 1);
      next = addHook(next, 'h2', 'revelation', 'strong', 'chapter_start', 'desc', 0.6, 0.7, 1);
      next = createHookSequence(next, 's1', ['h1', 'h2']);
      expect(next.totalSequences).toBe(1);
    });
  });

  describe('getHooksByType', () => {
    it('should filter by type', () => {
      let next = addHook(state, 'h1', 'mystery', 'compelling', 'chapter_start', 'desc', 0.8, 0.7, 1);
      next = addHook(next, 'h2', 'action', 'strong', 'chapter_start', 'desc', 0.6, 0.7, 1);
      const mystery = getHooksByType(next, 'mystery');
      expect(mystery.length).toBe(1);
    });
  });

  describe('getHookReport', () => {
    it('should return comprehensive report', () => {
      const report = getHookReport(state);
      expect(report.totalHooks).toBe(0);
      expect(typeof report.hookMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getHookReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeHookEngineState', () => {
    it('should reset all state', () => {
      let next = addHook(state, 'h1', 'mystery', 'compelling', 'chapter_start', 'desc', 0.8, 0.7, 1);
      next = resetNarrativeHookEngineState();
      expect(next.hooks.size).toBe(0);
      expect(next.totalHooks).toBe(0);
    });
  });
});