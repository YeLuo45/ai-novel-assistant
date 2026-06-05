/**
 * V821 NarrativeKnowledgeCore Tests — Direction E Iter 6/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeKnowledgeCoreState,
  addKnowledge,
  useKnowledge,
  queryKnowledge,
  getItemsByType,
  getKnowledgeCoreReport,
  resetNarrativeKnowledgeCoreState,
  type NarrativeKnowledgeCoreState,
} from './NarrativeKnowledgeCore';

describe('NarrativeKnowledgeCore', () => {
  let state: NarrativeKnowledgeCoreState;

  beforeEach(() => { state = createNarrativeKnowledgeCoreState(); });

  describe('createNarrativeKnowledgeCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.items.size).toBe(0);
      expect(state.queries.size).toBe(0);
    });
  });

  describe('addKnowledge', () => {
    it('should add knowledge', () => {
      const next = addKnowledge(state, 'k1', 'fact', 'Hero saves day', 'manual', 'high', ['hero']);
      expect(next.items.size).toBe(1);
      expect(next.totalItems).toBe(1);
    });
  });

  describe('useKnowledge', () => {
    it('should increment usage', () => {
      let next = addKnowledge(state, 'k1', 'fact', 'content');
      next = useKnowledge(next, 'k1');
      expect(next.items.get('k1')?.usageCount).toBe(1);
    });
  });

  describe('queryKnowledge', () => {
    it('should query', () => {
      let next = addKnowledge(state, 'k1', 'fact', 'content');
      next = queryKnowledge(next, 'q1', 'hero', ['k1']);
      expect(next.totalQueries).toBe(1);
    });
  });

  describe('getItemsByType', () => {
    it('should filter by type', () => {
      let next = addKnowledge(state, 'k1', 'fact', 'content');
      next = addKnowledge(next, 'k2', 'rule', 'content');
      const facts = getItemsByType(next, 'fact');
      expect(facts.length).toBe(1);
    });
  });

  describe('getKnowledgeCoreReport', () => {
    it('should return comprehensive report', () => {
      const report = getKnowledgeCoreReport(state);
      expect(report.totalItems).toBe(0);
      expect(typeof report.coverageScore).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getKnowledgeCoreReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeKnowledgeCoreState', () => {
    it('should reset all state', () => {
      let next = addKnowledge(state, 'k1', 'fact', 'content');
      next = resetNarrativeKnowledgeCoreState();
      expect(next.items.size).toBe(0);
      expect(next.totalItems).toBe(0);
    });
  });
});