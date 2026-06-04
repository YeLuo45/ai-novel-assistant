/**
 * V677 ConflictResolutionEngine Tests — Direction C Iter 6/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createConflictResolutionState,
  addConflict,
  escalateConflict,
  resolveConflict,
  getConflictsByType,
  getUnresolvedConflicts,
  getResolutionRecommendations,
  getConflictReport,
  resetConflictResolutionState,
  type ConflictResolutionState,
} from './ConflictResolutionEngine';

describe('ConflictResolutionEngine', () => {
  let state: ConflictResolutionState;

  beforeEach(() => { state = createConflictResolutionState(); });

  describe('createConflictResolutionState', () => {
    it('should initialize with defaults', () => {
      expect(state.conflicts.size).toBe(0);
      expect(state.activeConflicts).toBe(0);
      expect(state.resolvedConflicts).toBe(0);
    });

    it('should have default effectiveness', () => {
      expect(state.resolutionEffectiveness).toBe(0.7);
    });
  });

  describe('addConflict', () => {
    it('should add conflict', () => {
      const next = addConflict(state, 'c1', 'internal', 'Identity crisis', ['alice'], 0.6);
      expect(next.conflicts.size).toBe(1);
      expect(next.totalConflicts).toBe(1);
    });

    it('should clamp intensity', () => {
      const next = addConflict(state, 'c1', 'internal', 'Crisis', ['alice'], 1.5);
      expect(next.conflicts.get('c1')?.intensity).toBe(1);
    });

    it('should set stage to setup', () => {
      const next = addConflict(state, 'c1', 'internal', 'Crisis', ['alice']);
      expect(next.conflicts.get('c1')?.stage).toBe('setup');
    });
  });

  describe('escalateConflict', () => {
    it('should escalate conflict', () => {
      let next = addConflict(state, 'c1', 'internal', 'Crisis', ['alice'], 0.3);
      next = escalateConflict(next, 'c1', 0.8);
      expect(next.conflicts.get('c1')?.intensity).toBe(0.8);
      expect(next.conflicts.get('c1')?.stage).toBe('escalation');
    });

    it('should not exceed resolution stage', () => {
      let next = addConflict(state, 'c1', 'internal', 'Crisis', ['alice'], 0.3);
      next = escalateConflict(next, 'c1', 0.8);
      next = escalateConflict(next, 'c1', 0.9);
      next = escalateConflict(next, 'c1', 1.0);
      next = escalateConflict(next, 'c1', 1.0);
      next = escalateConflict(next, 'c1', 1.0);
      expect(next.conflicts.get('c1')?.stage).toBe('resolution');
    });
  });

  describe('resolveConflict', () => {
    it('should resolve conflict', () => {
      let next = addConflict(state, 'c1', 'internal', 'Crisis', ['alice']);
      next = resolveConflict(next, 'c1', 'transformation', 'Character grows from crisis');
      expect(next.conflicts.get('c1')?.stage).toBe('resolution');
      expect(next.conflicts.get('c1')?.resolutionType).toBe('transformation');
    });
  });

  describe('getConflictsByType', () => {
    it('should filter by type', () => {
      let next = addConflict(state, 'c1', 'internal', 'Crisis', ['alice']);
      next = addConflict(next, 'c2', 'interpersonal', 'Disagreement', ['alice', 'bob']);
      const internal = getConflictsByType(next, 'internal');
      expect(internal.length).toBe(1);
    });
  });

  describe('getUnresolvedConflicts', () => {
    it('should return active conflicts', () => {
      let next = addConflict(state, 'c1', 'internal', 'Crisis', ['alice']);
      next = addConflict(next, 'c2', 'internal', 'Resolved', ['bob']);
      next = resolveConflict(next, 'c2', 'compromise', 'Mutual agreement');
      const unresolved = getUnresolvedConflicts(next);
      expect(unresolved.length).toBe(1);
    });
  });

  describe('getResolutionRecommendations', () => {
    it('should return recommendations for empty state', () => {
      const recs = getResolutionRecommendations(state);
      expect(Array.isArray(recs)).toBe(true);
    });

    it('should recommend balance for high intensity', () => {
      let next = addConflict(state, 'c1', 'internal', 'Crisis', ['alice'], 0.95);
      const recs = getResolutionRecommendations(next);
      expect(recs.some(r => r.includes('balance'))).toBe(true);
    });
  });

  describe('getConflictReport', () => {
    it('should return comprehensive report', () => {
      const report = getConflictReport(state);
      expect(typeof report.averageIntensity).toBe('number');
      expect(typeof report.resolutionEffectiveness).toBe('number');
    });
  });

  describe('resetConflictResolutionState', () => {
    it('should reset all state', () => {
      let next = addConflict(state, 'c1', 'internal', 'Crisis', ['alice']);
      next = resetConflictResolutionState();
      expect(next.conflicts.size).toBe(0);
      expect(next.totalConflicts).toBe(0);
    });
  });
});