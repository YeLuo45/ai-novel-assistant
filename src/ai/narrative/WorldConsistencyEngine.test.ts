/**
 * V785 WorldConsistencyEngine Tests — Direction C Iter 6/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWorldConsistencyEngineState,
  addWorldReference,
  useWorldReference,
  recordConsistencyCheck,
  resolveConsistencyCheck,
  getChecksByType,
  getReferencesByType,
  getWorldConsistencyReport,
  resetWorldConsistencyEngineState,
  type WorldConsistencyEngineState,
} from './WorldConsistencyEngine';

describe('WorldConsistencyEngine', () => {
  let state: WorldConsistencyEngineState;

  beforeEach(() => { state = createWorldConsistencyEngineState(); });

  describe('createWorldConsistencyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.checks.size).toBe(0);
      expect(state.references.size).toBe(0);
    });
  });

  describe('addWorldReference', () => {
    it('should add reference', () => {
      const next = addWorldReference(state, 'r1', 'geography', 'Capital is at north');
      expect(next.references.size).toBe(1);
      expect(next.totalReferences).toBe(1);
    });
  });

  describe('useWorldReference', () => {
    it('should increment usages', () => {
      let next = addWorldReference(state, 'r1', 'geography', 'fact');
      next = useWorldReference(next, 'r1');
      expect(next.references.get('r1')?.usages).toBe(1);
    });
  });

  describe('recordConsistencyCheck', () => {
    it('should record check', () => {
      const next = recordConsistencyCheck(state, 'c1', 'geography', 'consistent', 'verified', 5, 'minor');
      expect(next.totalChecks).toBe(1);
    });

    it('should track major issues', () => {
      const next = recordConsistencyCheck(state, 'c1', 'geography', 'major_issue', 'desc', 5, 'major');
      expect(next.majorIssues).toBe(1);
    });
  });

  describe('resolveConsistencyCheck', () => {
    it('should resolve', () => {
      let next = recordConsistencyCheck(state, 'c1', 'geography', 'minor_issue', 'desc', 5);
      next = resolveConsistencyCheck(next, 'c1');
      expect(next.checks.get('c1')?.resolved).toBe(true);
      expect(next.resolvedChecks).toBe(1);
    });
  });

  describe('getChecksByType', () => {
    it('should filter by type', () => {
      let next = recordConsistencyCheck(state, 'c1', 'geography', 'consistent', 'desc', 5);
      next = recordConsistencyCheck(next, 'c2', 'timeline', 'consistent', 'desc', 5);
      const geo = getChecksByType(next, 'geography');
      expect(geo.length).toBe(1);
    });
  });

  describe('getReferencesByType', () => {
    it('should filter by type', () => {
      let next = addWorldReference(state, 'r1', 'geography', 'fact');
      next = addWorldReference(next, 'r2', 'timeline', 'fact');
      const geo = getReferencesByType(next, 'geography');
      expect(geo.length).toBe(1);
    });
  });

  describe('getWorldConsistencyReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldConsistencyReport(state);
      expect(report.totalChecks).toBe(0);
      expect(typeof report.overallConsistency).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldConsistencyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetWorldConsistencyEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldReference(state, 'r1', 'geography', 'fact');
      next = resetWorldConsistencyEngineState();
      expect(next.references.size).toBe(0);
      expect(next.totalReferences).toBe(0);
    });
  });
});