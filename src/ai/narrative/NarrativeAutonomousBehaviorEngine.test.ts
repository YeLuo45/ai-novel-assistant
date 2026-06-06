/**
 * V991 NarrativeAutonomousBehaviorEngine Tests — Direction A Iter 13/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAutonomousBehaviorEngineState,
  addAutonomousBehavior,
  activateBehavior,
  addBehaviorRule,
  useBehaviorRule,
  getBehaviorsByType,
  getAutonomousBehaviorReport,
  resetNarrativeAutonomousBehaviorEngineState,
  type NarrativeAutonomousBehaviorEngineState,
} from './NarrativeAutonomousBehaviorEngine';

describe('NarrativeAutonomousBehaviorEngine', () => {
  let state: NarrativeAutonomousBehaviorEngineState;

  beforeEach(() => { state = createNarrativeAutonomousBehaviorEngineState(); });

  describe('createNarrativeAutonomousBehaviorEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.behaviors.size).toBe(0);
      expect(state.rules.size).toBe(0);
    });
  });

  describe('addAutonomousBehavior', () => {
    it('should add behavior', () => {
      const next = addAutonomousBehavior(state, 'b1', 'explore', 'learned', 'common', 'desc', 0.7, 0.8, 1);
      expect(next.behaviors.size).toBe(1);
      expect(next.totalBehaviors).toBe(1);
    });
  });

  describe('activateBehavior', () => {
    it('should activate', () => {
      const next = activateBehavior(state, 'b1');
      expect(next.totalActivations).toBe(1);
    });
  });

  describe('addBehaviorRule', () => {
    it('should add rule', () => {
      const next = addBehaviorRule(state, 'r1', 'cond', 'action', 1);
      expect(next.totalRules).toBe(1);
    });
  });

  describe('useBehaviorRule', () => {
    it('should use', () => {
      let next = addBehaviorRule(state, 'r1', 'cond', 'action', 1);
      next = useBehaviorRule(next, 'r1', true);
      expect(next.rules.get('r1')?.successCount).toBe(1);
    });
  });

  describe('getBehaviorsByType', () => {
    it('should filter by type', () => {
      let next = addAutonomousBehavior(state, 'b1', 'explore', 'learned', 'common', 'desc', 0.7, 0.8, 1);
      next = addAutonomousBehavior(next, 'b2', 'exploit', 'learned', 'common', 'desc', 0.7, 0.8, 1);
      const explore = getBehaviorsByType(next, 'explore');
      expect(explore.length).toBe(1);
    });
  });

  describe('getAutonomousBehaviorReport', () => {
    it('should return comprehensive report', () => {
      const report = getAutonomousBehaviorReport(state);
      expect(report.totalBehaviors).toBe(0);
      expect(typeof report.autonomousBehaviorMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAutonomousBehaviorReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAutonomousBehaviorEngineState', () => {
    it('should reset all state', () => {
      let next = addAutonomousBehavior(state, 'b1', 'explore', 'learned', 'common', 'desc', 0.7, 0.8, 1);
      next = resetNarrativeAutonomousBehaviorEngineState();
      expect(next.behaviors.size).toBe(0);
      expect(next.totalBehaviors).toBe(0);
    });
  });
});