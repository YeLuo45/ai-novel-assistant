/**
 * V789 NarrativeRulesEngine Tests — Direction C Iter 8/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeRulesEngineState,
  addNarrativeRule,
  setRuleStatus,
  recordRuleViolation,
  recordRuleSuccess,
  acknowledgeViolation,
  getRulesByCategory,
  getRulesReport,
  resetNarrativeRulesEngineState,
  type NarrativeRulesEngineState,
} from './NarrativeRulesEngine';

describe('NarrativeRulesEngine', () => {
  let state: NarrativeRulesEngineState;

  beforeEach(() => { state = createNarrativeRulesEngineState(); });

  describe('createNarrativeRulesEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.rules.size).toBe(0);
      expect(state.violations.size).toBe(0);
    });
  });

  describe('addNarrativeRule', () => {
    it('should add rule', () => {
      const next = addNarrativeRule(state, 'r1', 'Hero wins', 'plot', 'global', 'Hero must win in the end', 1);
      expect(next.rules.size).toBe(1);
      expect(next.totalRules).toBe(1);
    });

    it('should track active rules', () => {
      const next = addNarrativeRule(state, 'r1', 'name', 'plot', 'global', 'desc', 1, 'active');
      expect(next.activeRules).toBe(1);
    });

    it('should not count inactive rules', () => {
      const next = addNarrativeRule(state, 'r1', 'name', 'plot', 'global', 'desc', 1, 'draft');
      expect(next.activeRules).toBe(0);
    });
  });

  describe('setRuleStatus', () => {
    it('should set status', () => {
      let next = addNarrativeRule(state, 'r1', 'name', 'plot', 'global', 'desc');
      next = setRuleStatus(next, 'r1', 'suspended');
      expect(next.rules.get('r1')?.status).toBe('suspended');
    });
  });

  describe('recordRuleViolation', () => {
    it('should record violation', () => {
      let next = addNarrativeRule(state, 'r1', 'name', 'plot', 'global', 'desc');
      next = recordRuleViolation(next, 'v1', 'r1', 'broke the rule', 5);
      expect(next.totalViolations).toBe(1);
    });

    it('should increment rule violations', () => {
      let next = addNarrativeRule(state, 'r1', 'name', 'plot', 'global', 'desc');
      next = recordRuleViolation(next, 'v1', 'r1', 'broke the rule', 5);
      expect(next.rules.get('r1')?.violations).toBe(1);
    });
  });

  describe('recordRuleSuccess', () => {
    it('should record success', () => {
      let next = addNarrativeRule(state, 'r1', 'name', 'plot', 'global', 'desc');
      next = recordRuleSuccess(next, 'r1');
      expect(next.rules.get('r1')?.successes).toBe(1);
    });
  });

  describe('acknowledgeViolation', () => {
    it('should acknowledge', () => {
      let next = addNarrativeRule(state, 'r1', 'name', 'plot', 'global', 'desc');
      next = recordRuleViolation(next, 'v1', 'r1', 'broke the rule', 5);
      next = acknowledgeViolation(next, 'v1');
      expect(next.violations.get('v1')?.acknowledged).toBe(true);
    });
  });

  describe('getRulesByCategory', () => {
    it('should filter by category', () => {
      let next = addNarrativeRule(state, 'r1', 'name', 'plot', 'global', 'desc');
      next = addNarrativeRule(next, 'r2', 'name', 'character', 'global', 'desc');
      const plotRules = getRulesByCategory(next, 'plot');
      expect(plotRules.length).toBe(1);
    });
  });

  describe('getRulesReport', () => {
    it('should return comprehensive report', () => {
      const report = getRulesReport(state);
      expect(report.totalRules).toBe(0);
      expect(typeof report.averageCompliance).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getRulesReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeRulesEngineState', () => {
    it('should reset all state', () => {
      let next = addNarrativeRule(state, 'r1', 'name', 'plot', 'global', 'desc');
      next = resetNarrativeRulesEngineState();
      expect(next.rules.size).toBe(0);
      expect(next.totalRules).toBe(0);
    });
  });
});