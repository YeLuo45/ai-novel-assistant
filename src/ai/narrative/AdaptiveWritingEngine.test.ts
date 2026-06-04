/**
 * V705 AdaptiveWritingEngine Tests — Direction D Iter 2/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAdaptiveWritingState,
  createContext,
  addRule,
  toggleRule,
  setActiveContext,
  getContextsByType,
  getRulesByPriority,
  checkAdaptationCoverage,
  getAdaptationReport,
  resetAdaptiveWritingState,
  type AdaptiveWritingState,
} from './AdaptiveWritingEngine';

describe('AdaptiveWritingEngine', () => {
  let state: AdaptiveWritingState;

  beforeEach(() => { state = createAdaptiveWritingState(); });

  describe('createAdaptiveWritingState', () => {
    it('should initialize with defaults', () => {
      expect(state.contexts.size).toBe(0);
      expect(state.rules.size).toBe(0);
      expect(state.activeContext).toBeNull();
    });

    it('should have default reading level', () => {
      expect(state.averageReadingLevel).toBe(0.5);
    });
  });

  describe('createContext', () => {
    it('should create context', () => {
      const next = createContext(state, 'c1', 'novel', 'adult', 'moderate', 0.7, 0.6, 0.5);
      expect(next.contexts.size).toBe(1);
      expect(next.totalContexts).toBe(1);
    });

    it('should clamp values', () => {
      const next = createContext(state, 'c1', 'novel', 'adult', 'moderate', 1.5, -0.1, 0.5);
      const context = next.contexts.get('c1');
      expect(context?.vocabularyLevel).toBe(1);
      expect(context?.sentenceComplexity).toBe(0);
    });
  });

  describe('addRule', () => {
    it('should add rule', () => {
      const next = addRule(state, 'r1', 'passive voice', 'use active', 3, true);
      expect(next.rules.size).toBe(1);
      expect(next.totalRules).toBe(1);
    });

    it('should set enabled by default', () => {
      const next = addRule(state, 'r1', 'trigger', 'adjustment', 1);
      expect(next.rules.get('r1')?.enabled).toBe(true);
    });
  });

  describe('toggleRule', () => {
    it('should toggle rule', () => {
      let next = addRule(state, 'r1', 'trigger', 'adjustment', 1, true);
      next = toggleRule(next, 'r1', false);
      expect(next.rules.get('r1')?.enabled).toBe(false);
    });

    it('should return state for unknown rule', () => {
      const next = toggleRule(state, 'unknown', true);
      expect(next.enabledRules).toBe(0);
    });
  });

  describe('setActiveContext', () => {
    it('should set active context', () => {
      const next = setActiveContext(state, 'c1');
      expect(next.activeContext).toBe('c1');
    });
  });

  describe('getContextsByType', () => {
    it('should filter by type', () => {
      let next = createContext(state, 'c1', 'novel', 'adult');
      next = createContext(next, 'c2', 'essay', 'academic');
      const novels = getContextsByType(next, 'novel');
      expect(novels.length).toBe(1);
    });
  });

  describe('getRulesByPriority', () => {
    it('should filter and sort by priority', () => {
      let next = addRule(state, 'r1', 'trigger', 'adjustment', 1, true);
      next = addRule(next, 'r2', 'trigger', 'adjustment', 3, true);
      next = addRule(next, 'r3', 'trigger', 'adjustment', 2, false);
      const rules = getRulesByPriority(next, 1);
      expect(rules[0]?.ruleId).toBe('r2');
    });

    it('should exclude disabled rules', () => {
      let next = addRule(state, 'r1', 'trigger', 'adjustment', 1, true);
      next = addRule(next, 'r2', 'trigger', 'adjustment', 3, false);
      const rules = getRulesByPriority(next, 1);
      expect(rules.length).toBe(1);
    });
  });

  describe('checkAdaptationCoverage', () => {
    it('should return 0 for no contexts', () => {
      expect(checkAdaptationCoverage(state)).toBe(0);
    });

    it('should compute coverage', () => {
      let next = createContext(state, 'c1', 'novel', 'adult');
      next = addRule(next, 'r1', 'trigger', 'adjustment', 1, true);
      next = addRule(next, 'r2', 'trigger', 'adjustment', 1, true);
      next = addRule(next, 'r3', 'trigger', 'adjustment', 1, true);
      expect(checkAdaptationCoverage(next)).toBe(1);
    });
  });

  describe('getAdaptationReport', () => {
    it('should return comprehensive report', () => {
      const report = getAdaptationReport(state);
      expect(report.totalContexts).toBe(0);
      expect(typeof report.adaptationCoverage).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAdaptationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetAdaptiveWritingState', () => {
    it('should reset all state', () => {
      let next = createContext(state, 'c1', 'novel', 'adult');
      next = resetAdaptiveWritingState();
      expect(next.contexts.size).toBe(0);
      expect(next.totalContexts).toBe(0);
    });
  });
});