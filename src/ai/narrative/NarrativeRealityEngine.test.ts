/**
 * V775 NarrativeRealityEngine Tests — Direction C Iter 1/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeRealityEngineState,
  addRealityRule,
  recordViolation,
  resolveViolation,
  toggleRealityRule,
  getRealityRulesByType,
  getViolationsBySeverity,
  getRealityReport,
  resetNarrativeRealityEngineState,
  type NarrativeRealityEngineState,
} from './NarrativeRealityEngine';

describe('NarrativeRealityEngine', () => {
  let state: NarrativeRealityEngineState;

  beforeEach(() => { state = createNarrativeRealityEngineState(); });

  describe('createNarrativeRealityEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.rules.size).toBe(0);
      expect(state.realityConsistency).toBe(0.8);
    });
  });

  describe('addRealityRule', () => {
    it('should add rule', () => {
      const next = addRealityRule(state, 'r1', 'physical', 'Gravity exists', 'rigid', [], true);
      expect(next.rules.size).toBe(1);
      expect(next.totalRules).toBe(1);
      expect(next.enforcedRules).toBe(1);
    });

    it('should not count unenforced rules as enforced', () => {
      const next = addRealityRule(state, 'r1', 'physical', 'desc', 'rigid', [], false);
      expect(next.enforcedRules).toBe(0);
    });
  });

  describe('recordViolation', () => {
    it('should record violation', () => {
      let next = addRealityRule(state, 'r1', 'physical', 'desc');
      next = recordViolation(next, 'v1', 'r1', 'major', 'gravity broken', 5);
      expect(next.totalViolations).toBe(1);
    });

    it('should track critical violations', () => {
      let next = addRealityRule(state, 'r1', 'physical', 'desc');
      next = recordViolation(next, 'v1', 'r1', 'critical', 'paradox', 5);
      expect(next.criticalViolations).toBe(1);
    });

    it('should increment rule violations', () => {
      let next = addRealityRule(state, 'r1', 'physical', 'desc');
      next = recordViolation(next, 'v1', 'r1', 'major', 'desc', 5);
      expect(next.rules.get('r1')?.violations).toBe(1);
    });
  });

  describe('resolveViolation', () => {
    it('should resolve violation', () => {
      let next = addRealityRule(state, 'r1', 'physical', 'desc');
      next = recordViolation(next, 'v1', 'r1', 'major', 'desc', 5);
      next = resolveViolation(next, 'v1');
      expect(next.violations.get('v1')?.resolved).toBe(true);
    });
  });

  describe('toggleRealityRule', () => {
    it('should toggle rule', () => {
      let next = addRealityRule(state, 'r1', 'physical', 'desc');
      next = toggleRealityRule(next, 'r1', false);
      expect(next.rules.get('r1')?.enforced).toBe(false);
      expect(next.enforcedRules).toBe(0);
    });
  });

  describe('getRealityRulesByType', () => {
    it('should filter by type', () => {
      let next = addRealityRule(state, 'r1', 'physical', 'desc');
      next = addRealityRule(next, 'r2', 'magical', 'desc');
      const physical = getRealityRulesByType(next, 'physical');
      expect(physical.length).toBe(1);
    });
  });

  describe('getViolationsBySeverity', () => {
    it('should filter by severity', () => {
      let next = addRealityRule(state, 'r1', 'physical', 'desc');
      next = recordViolation(next, 'v1', 'r1', 'minor', 'desc', 5);
      next = recordViolation(next, 'v2', 'r1', 'major', 'desc', 6);
      const minors = getViolationsBySeverity(next, 'minor');
      expect(minors.length).toBe(1);
    });
  });

  describe('getRealityReport', () => {
    it('should return comprehensive report', () => {
      const report = getRealityReport(state);
      expect(report.totalRules).toBe(0);
      expect(typeof report.realityConsistency).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getRealityReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeRealityEngineState', () => {
    it('should reset all state', () => {
      let next = addRealityRule(state, 'r1', 'physical', 'desc');
      next = resetNarrativeRealityEngineState();
      expect(next.rules.size).toBe(0);
      expect(next.totalRules).toBe(0);
    });
  });
});