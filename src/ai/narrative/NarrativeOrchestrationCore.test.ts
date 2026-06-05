/**
 * V735 NarrativeOrchestrationCore Tests — Direction E Iter 8/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeOrchestrationCoreState,
  createWorkflow,
  addOrchestrationTask,
  updateOrchestrationTaskStatus,
  advanceWorkflowPhase,
  getReadyTasks,
  getOrchestrationReport,
  resetNarrativeOrchestrationCoreState,
  type NarrativeOrchestrationCoreState,
} from './NarrativeOrchestrationCore';

describe('NarrativeOrchestrationCore', () => {
  let state: NarrativeOrchestrationCoreState;

  beforeEach(() => { state = createNarrativeOrchestrationCoreState(); });

  describe('createNarrativeOrchestrationCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.workflows.size).toBe(0);
      expect(state.tasks.size).toBe(0);
    });

    it('should have default efficiency', () => {
      expect(state.orchestrationEfficiency).toBe(0.7);
    });
  });

  describe('createWorkflow', () => {
    it('should create workflow', () => {
      const next = createWorkflow(state, 'w1', 'Main workflow');
      expect(next.workflows.size).toBe(1);
      expect(next.totalWorkflows).toBe(1);
    });
  });

  describe('addOrchestrationTask', () => {
    it('should add task', () => {
      let next = createWorkflow(state, 'w1', 'Workflow');
      next = addOrchestrationTask(next, 'w1', 't1', 'Task 1', 'reasoning', 'high');
      expect(next.tasks.size).toBe(1);
      expect(next.totalTasks).toBe(1);
    });

    it('should add to workflow', () => {
      let next = createWorkflow(state, 'w1', 'Workflow');
      next = addOrchestrationTask(next, 'w1', 't1', 'Task 1', 'memory');
      const workflow = next.workflows.get('w1');
      expect(workflow?.tasks.length).toBe(1);
    });

    it('should return state for unknown workflow', () => {
      const next = addOrchestrationTask(state, 'unknown', 't1', 'Task', 'memory');
      expect(next.tasks.size).toBe(1);
    });
  });

  describe('updateOrchestrationTaskStatus', () => {
    it('should update status', () => {
      let next = createWorkflow(state, 'w1', 'Workflow');
      next = addOrchestrationTask(next, 'w1', 't1', 'Task 1', 'memory');
      next = updateOrchestrationTaskStatus(next, 't1', 'in_progress', 0.5);
      expect(next.tasks.get('t1')?.status).toBe('in_progress');
    });

    it('should increment completed', () => {
      let next = createWorkflow(state, 'w1', 'Workflow');
      next = addOrchestrationTask(next, 'w1', 't1', 'Task 1', 'memory');
      next = updateOrchestrationTaskStatus(next, 't1', 'completed', 1.0);
      expect(next.completedTasks).toBe(1);
    });

    it('should increment failed', () => {
      let next = createWorkflow(state, 'w1', 'Workflow');
      next = addOrchestrationTask(next, 'w1', 't1', 'Task 1', 'memory');
      next = updateOrchestrationTaskStatus(next, 't1', 'failed');
      expect(next.failedTasks).toBe(1);
    });
  });

  describe('advanceWorkflowPhase', () => {
    it('should advance phase', () => {
      let next = createWorkflow(state, 'w1', 'Workflow');
      next = advanceWorkflowPhase(next, 'w1', 'dispatching');
      expect(next.workflows.get('w1')?.phase).toBe('dispatching');
    });

    it('should mark completed when completing', () => {
      let next = createWorkflow(state, 'w1', 'Workflow');
      next = advanceWorkflowPhase(next, 'w1', 'completing');
      expect(next.workflows.get('w1')?.status).toBe('completed');
    });

    it('should return state for unknown workflow', () => {
      const next = advanceWorkflowPhase(state, 'unknown', 'dispatching');
      expect(next.totalWorkflows).toBe(0);
    });
  });

  describe('getReadyTasks', () => {
    it('should return tasks with no unmet dependencies', () => {
      let next = createWorkflow(state, 'w1', 'Workflow');
      next = addOrchestrationTask(next, 'w1', 't1', 'Task 1', 'memory');
      next = addOrchestrationTask(next, 'w1', 't2', 'Task 2', 'reasoning', 'medium', ['t1']);
      const ready = getReadyTasks(next, 'w1');
      expect(ready.length).toBe(1);
      expect(ready[0]?.taskId).toBe('t1');
    });

    it('should return empty for unknown workflow', () => {
      const ready = getReadyTasks(state, 'unknown');
      expect(ready).toEqual([]);
    });
  });

  describe('getOrchestrationReport', () => {
    it('should return comprehensive report', () => {
      const report = getOrchestrationReport(state);
      expect(report.totalTasks).toBe(0);
      expect(typeof report.orchestrationEfficiency).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getOrchestrationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeOrchestrationCoreState', () => {
    it('should reset all state', () => {
      let next = createWorkflow(state, 'w1', 'Workflow');
      next = resetNarrativeOrchestrationCoreState();
      expect(next.workflows.size).toBe(0);
      expect(next.totalWorkflows).toBe(0);
    });
  });
});