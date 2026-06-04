/**
 * V715 EnhancementEngine Tests — Direction D Iter 7/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createEnhancementEngineState,
  createEnhancementSession,
  suggestEnhancement,
  applyEnhancement,
  skipEnhancement,
  getEnhancementsByType,
  getHighImpactEnhancements,
  getEnhancementReport,
  resetEnhancementEngineState,
  type EnhancementEngineState,
} from './EnhancementEngine';

describe('EnhancementEngine', () => {
  let state: EnhancementEngineState;

  beforeEach(() => { state = createEnhancementEngineState(); });

  describe('createEnhancementEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.sessions.size).toBe(0);
      expect(state.totalEnhancements).toBe(0);
    });

    it('should have default coverage', () => {
      expect(state.enhancementCoverage).toBe(0);
    });
  });

  describe('createEnhancementSession', () => {
    it('should create session', () => {
      const next = createEnhancementSession(state, 's1', 'work1');
      expect(next.sessions.size).toBe(1);
    });
  });

  describe('suggestEnhancement', () => {
    it('should suggest enhancement', () => {
      let next = createEnhancementSession(state, 's1', 'work1');
      next = suggestEnhancement(next, 's1', 'e1', 'vocabulary', 'high', 'big', 'large', 'More precise word', 100, 0.7);
      expect(next.totalEnhancements).toBe(1);
    });

    it('should track type distribution', () => {
      let next = createEnhancementSession(state, 's1', 'work1');
      next = suggestEnhancement(next, 's1', 'e1', 'vocabulary', 'high', 'big', 'large', 'reason', 0, 0.7);
      expect(next.typeDistribution.get('vocabulary')).toBe(1);
    });

    it('should clamp impact', () => {
      let next = createEnhancementSession(state, 's1', 'work1');
      next = suggestEnhancement(next, 's1', 'e1', 'vocabulary', 'high', 'a', 'b', 'r', 0, 1.5);
      const session = next.sessions.get('s1');
      expect(session?.enhancements[0]?.impact).toBe(1);
    });
  });

  describe('applyEnhancement', () => {
    it('should apply enhancement', () => {
      let next = createEnhancementSession(state, 's1', 'work1');
      next = suggestEnhancement(next, 's1', 'e1', 'vocabulary', 'high', 'a', 'b', 'r', 0, 0.7);
      next = applyEnhancement(next, 'e1');
      const session = next.sessions.get('s1');
      expect(session?.enhancements[0]?.status).toBe('applied');
      expect(next.appliedEnhancements).toBe(1);
    });
  });

  describe('skipEnhancement', () => {
    it('should skip enhancement', () => {
      let next = createEnhancementSession(state, 's1', 'work1');
      next = suggestEnhancement(next, 's1', 'e1', 'vocabulary', 'high', 'a', 'b', 'r', 0, 0.7);
      next = skipEnhancement(next, 'e1');
      const session = next.sessions.get('s1');
      expect(session?.enhancements[0]?.status).toBe('skipped');
    });
  });

  describe('getEnhancementsByType', () => {
    it('should filter by type', () => {
      let next = createEnhancementSession(state, 's1', 'work1');
      next = suggestEnhancement(next, 's1', 'e1', 'vocabulary', 'high', 'a', 'b', 'r', 0, 0.7);
      next = suggestEnhancement(next, 's1', 'e2', 'imagery', 'high', 'a', 'b', 'r', 0, 0.7);
      const vocab = getEnhancementsByType(next, 'vocabulary');
      expect(vocab.length).toBe(1);
    });
  });

  describe('getHighImpactEnhancements', () => {
    it('should filter by impact threshold', () => {
      let next = createEnhancementSession(state, 's1', 'work1');
      next = suggestEnhancement(next, 's1', 'e1', 'vocabulary', 'high', 'a', 'b', 'r', 0, 0.9);
      next = suggestEnhancement(next, 's1', 'e2', 'vocabulary', 'low', 'a', 'b', 'r', 0, 0.3);
      const high = getHighImpactEnhancements(next, 0.7);
      expect(high.length).toBe(1);
    });
  });

  describe('getEnhancementReport', () => {
    it('should return comprehensive report', () => {
      const report = getEnhancementReport(state);
      expect(report.totalEnhancements).toBe(0);
      expect(typeof report.averageImpact).toBe('number');
    });

    it('should include type distribution', () => {
      let next = createEnhancementSession(state, 's1', 'work1');
      next = suggestEnhancement(next, 's1', 'e1', 'vocabulary', 'high', 'a', 'b', 'r', 0, 0.7);
      const report = getEnhancementReport(next);
      expect(report.typeDistribution.vocabulary).toBe(1);
    });

    it('should include recommendations for empty state', () => {
      const report = getEnhancementReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetEnhancementEngineState', () => {
    it('should reset all state', () => {
      let next = createEnhancementSession(state, 's1', 'work1');
      next = resetEnhancementEngineState();
      expect(next.sessions.size).toBe(0);
    });
  });
});