/**
 * V803 ContentEnhancementEngine Tests — Direction D Iter 6/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createContentEnhancementEngineState,
  identifyOpportunity,
  setOpportunityPriority,
  applyEnhancement,
  rejectOpportunity,
  getOpportunitiesByType,
  getContentEnhancementReport,
  resetContentEnhancementEngineState,
  type ContentEnhancementEngineState,
} from './ContentEnhancementEngine';

describe('ContentEnhancementEngine', () => {
  let state: ContentEnhancementEngineState;

  beforeEach(() => { state = createContentEnhancementEngineState(); });

  describe('createContentEnhancementEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.opportunities.size).toBe(0);
      expect(state.results.size).toBe(0);
    });
  });

  describe('identifyOpportunity', () => {
    it('should identify opportunity', () => {
      const next = identifyOpportunity(state, 'o1', 'detail', 'Chapter 1', 'Add sensory details', 0.7, 0.3, 'high');
      expect(next.opportunities.size).toBe(1);
      expect(next.totalOpportunities).toBe(1);
    });

    it('should clamp scores', () => {
      const next = identifyOpportunity(state, 'o1', 'detail', 'loc', 'desc', 1.5, -0.5);
      expect(next.opportunities.get('o1')?.valueScore).toBe(1);
      expect(next.opportunities.get('o1')?.effortScore).toBe(0);
    });
  });

  describe('setOpportunityPriority', () => {
    it('should set priority', () => {
      let next = identifyOpportunity(state, 'o1', 'detail', 'loc', 'desc');
      next = setOpportunityPriority(next, 'o1', 'critical');
      expect(next.opportunities.get('o1')?.priority).toBe('critical');
    });
  });

  describe('applyEnhancement', () => {
    it('should apply enhancement', () => {
      let next = identifyOpportunity(state, 'o1', 'detail', 'loc', 'desc');
      next = applyEnhancement(next, 'r1', 'o1', 'original', 'enhanced', 0.3);
      expect(next.totalResults).toBe(1);
    });

    it('should update opportunity status', () => {
      let next = identifyOpportunity(state, 'o1', 'detail', 'loc', 'desc');
      next = applyEnhancement(next, 'r1', 'o1', 'original', 'enhanced', 0.3);
      expect(next.opportunities.get('o1')?.status).toBe('completed');
    });
  });

  describe('rejectOpportunity', () => {
    it('should reject', () => {
      let next = identifyOpportunity(state, 'o1', 'detail', 'loc', 'desc');
      next = rejectOpportunity(next, 'o1');
      expect(next.opportunities.get('o1')?.status).toBe('rejected');
    });
  });

  describe('getOpportunitiesByType', () => {
    it('should filter by type', () => {
      let next = identifyOpportunity(state, 'o1', 'detail', 'loc', 'desc');
      next = identifyOpportunity(next, 'o2', 'depth', 'loc', 'desc');
      const details = getOpportunitiesByType(next, 'detail');
      expect(details.length).toBe(1);
    });
  });

  describe('getContentEnhancementReport', () => {
    it('should return comprehensive report', () => {
      const report = getContentEnhancementReport(state);
      expect(report.totalOpportunities).toBe(0);
      expect(typeof report.completionRate).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getContentEnhancementReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetContentEnhancementEngineState', () => {
    it('should reset all state', () => {
      let next = identifyOpportunity(state, 'o1', 'detail', 'loc', 'desc');
      next = resetContentEnhancementEngineState();
      expect(next.opportunities.size).toBe(0);
      expect(next.totalOpportunities).toBe(0);
    });
  });
});