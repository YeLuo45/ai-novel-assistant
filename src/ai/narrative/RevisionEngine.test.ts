/**
 * V711 RevisionEngine Tests — Direction D Iter 5/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createRevisionEngineState,
  createPlan,
  addRevision,
  updateRevisionStatus,
  getRevisionsByType,
  getRevisionsByPriority,
  acceptRevision,
  rejectRevision,
  getRevisionReport,
  resetRevisionEngineState,
  type RevisionEngineState,
} from './RevisionEngine';

describe('RevisionEngine', () => {
  let state: RevisionEngineState;

  beforeEach(() => { state = createRevisionEngineState(); });

  describe('createRevisionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.plans.size).toBe(0);
      expect(state.revisions.size).toBe(0);
    });

    it('should have default efficiency', () => {
      expect(state.revisionEfficiency).toBe(0.7);
    });
  });

  describe('createPlan', () => {
    it('should create plan', () => {
      const next = createPlan(state, 'p1', 'work1');
      expect(next.plans.size).toBe(1);
      expect(next.totalPlans).toBe(1);
    });
  });

  describe('addRevision', () => {
    it('should add revision', () => {
      let next = createPlan(state, 'p1', 'work1');
      next = addRevision(next, 'r1', 'p1', 'content', 'high', 'Scene 1', 'Improve pacing', 'Add more tension', 100);
      expect(next.revisions.size).toBe(1);
      expect(next.totalRevisions).toBe(1);
    });

    it('should add to plan', () => {
      let next = createPlan(state, 'p1', 'work1');
      next = addRevision(next, 'r1', 'p1', 'content', 'high', 'Scene 1', 'desc', 'suggestion', 100);
      const plan = next.plans.get('p1');
      expect(plan?.revisions.length).toBe(1);
    });

    it('should return state for unknown plan', () => {
      const next = addRevision(state, 'r1', 'unknown', 'content', 'high', 'loc', 'desc', 'sug', 0);
      expect(next.revisions.size).toBe(1);
    });
  });

  describe('updateRevisionStatus', () => {
    it('should update status', () => {
      let next = createPlan(state, 'p1', 'work1');
      next = addRevision(next, 'r1', 'p1', 'content', 'high', 'loc', 'desc', 'sug', 0);
      next = updateRevisionStatus(next, 'r1', 'completed', true);
      expect(next.revisions.get('r1')?.status).toBe('completed');
    });
  });

  describe('getRevisionsByType', () => {
    it('should filter by type', () => {
      let next = createPlan(state, 'p1', 'work1');
      next = addRevision(next, 'r1', 'p1', 'content', 'high', 'loc', 'desc', 'sug', 0);
      next = addRevision(next, 'r2', 'p1', 'style', 'medium', 'loc', 'desc', 'sug', 0);
      const content = getRevisionsByType(next, 'content');
      expect(content.length).toBe(1);
    });
  });

  describe('getRevisionsByPriority', () => {
    it('should filter by priority', () => {
      let next = createPlan(state, 'p1', 'work1');
      next = addRevision(next, 'r1', 'p1', 'content', 'high', 'loc', 'desc', 'sug', 0);
      next = addRevision(next, 'r2', 'p1', 'style', 'low', 'loc', 'desc', 'sug', 0);
      const high = getRevisionsByPriority(next, 'high');
      expect(high.length).toBe(1);
    });
  });

  describe('acceptRevision', () => {
    it('should accept revision', () => {
      let next = createPlan(state, 'p1', 'work1');
      next = addRevision(next, 'r1', 'p1', 'content', 'high', 'loc', 'desc', 'sug', 0);
      next = acceptRevision(next, 'r1');
      expect(next.revisions.get('r1')?.accepted).toBe(true);
    });
  });

  describe('rejectRevision', () => {
    it('should reject revision', () => {
      let next = createPlan(state, 'p1', 'work1');
      next = addRevision(next, 'r1', 'p1', 'content', 'high', 'loc', 'desc', 'sug', 0);
      next = rejectRevision(next, 'r1');
      expect(next.revisions.get('r1')?.status).toBe('rejected');
    });
  });

  describe('getRevisionReport', () => {
    it('should return comprehensive report', () => {
      const report = getRevisionReport(state);
      expect(report.totalRevisions).toBe(0);
      expect(typeof report.revisionEfficiency).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getRevisionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetRevisionEngineState', () => {
    it('should reset all state', () => {
      let next = createPlan(state, 'p1', 'work1');
      next = resetRevisionEngineState();
      expect(next.plans.size).toBe(0);
      expect(next.totalPlans).toBe(0);
    });
  });
});