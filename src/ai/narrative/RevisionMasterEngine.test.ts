/**
 * V807 RevisionMasterEngine Tests — Direction D Iter 8/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createRevisionMasterEngineState,
  createRevisionTask,
  updateRevisionStatus,
  recordRevisionChange,
  getTasksByType,
  getRevisionMasterReport,
  resetRevisionMasterEngineState,
  type RevisionMasterEngineState,
} from './RevisionMasterEngine';

describe('RevisionMasterEngine', () => {
  let state: RevisionMasterEngineState;

  beforeEach(() => { state = createRevisionMasterEngineState(); });

  describe('createRevisionMasterEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.tasks.size).toBe(0);
      expect(state.changes.size).toBe(0);
    });
  });

  describe('createRevisionTask', () => {
    it('should create task', () => {
      const next = createRevisionTask(state, 't1', 'content', 'chapter', 'rework chapter 3', 2, 1);
      expect(next.tasks.size).toBe(1);
      expect(next.totalTasks).toBe(1);
    });
  });

  describe('updateRevisionStatus', () => {
    it('should update status', () => {
      let next = createRevisionTask(state, 't1', 'content', 'chapter', 'desc');
      next = updateRevisionStatus(next, 't1', 'in_progress');
      expect(next.tasks.get('t1')?.status).toBe('in_progress');
    });

    it('should count completed', () => {
      let next = createRevisionTask(state, 't1', 'content', 'chapter', 'desc');
      next = updateRevisionStatus(next, 't1', 'completed', 1.5);
      expect(next.completedTasks).toBe(1);
    });

    it('should count verified', () => {
      let next = createRevisionTask(state, 't1', 'content', 'chapter', 'desc');
      next = updateRevisionStatus(next, 't1', 'verified');
      expect(next.verifiedTasks).toBe(1);
    });
  });

  describe('recordRevisionChange', () => {
    it('should record change', () => {
      let next = createRevisionTask(state, 't1', 'content', 'chapter', 'desc');
      next = recordRevisionChange(next, 'c1', 't1', 'para 1', 'before', 'after', 'clarity');
      expect(next.totalChanges).toBe(1);
    });
  });

  describe('getTasksByType', () => {
    it('should filter by type', () => {
      let next = createRevisionTask(state, 't1', 'content', 'chapter', 'desc');
      next = createRevisionTask(next, 't2', 'style', 'paragraph', 'desc');
      const content = getTasksByType(next, 'content');
      expect(content.length).toBe(1);
    });
  });

  describe('getRevisionMasterReport', () => {
    it('should return comprehensive report', () => {
      const report = getRevisionMasterReport(state);
      expect(report.totalTasks).toBe(0);
      expect(typeof report.revisionCompleteness).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getRevisionMasterReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetRevisionMasterEngineState', () => {
    it('should reset all state', () => {
      let next = createRevisionTask(state, 't1', 'content', 'chapter', 'desc');
      next = resetRevisionMasterEngineState();
      expect(next.tasks.size).toBe(0);
      expect(next.totalTasks).toBe(0);
    });
  });
});