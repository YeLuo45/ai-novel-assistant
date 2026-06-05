/**
 * V837 AdaptiveBehaviorEngine Tests — Direction A Iter 5/9 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAdaptiveBehaviorEngineState,
  addBehavior,
  activateBehavior,
  recordBehaviorOutcome,
  adaptBehavior,
  getBehaviorsByPattern,
  getBehaviorReport,
  resetAdaptiveBehaviorEngineState,
  type AdaptiveBehaviorEngineState,
} from './AdaptiveBehaviorEngine';

describe('AdaptiveBehaviorEngine', () => {
  let state: AdaptiveBehaviorEngineState;

  beforeEach(() => { state = createAdaptiveBehaviorEngineState(); });

  describe('createAdaptiveBehaviorEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.behaviors.size).toBe(0);
      expect(state.triggers.size).toBe(0);
    });
  });

  describe('addBehavior', () => {
    it('should add behavior', () => {
      const next = addBehavior(state, 'b1', 'Explore', 'exploratory', 'experimental', 0.6);
      expect(next.behaviors.size).toBe(1);
      expect(next.totalBehaviors).toBe(1);
    });

    it('should clamp effectiveness', () => {
      const next = addBehavior(state, 'b1', 'Explore', 'exploratory', 'experimental', 1.5);
      expect(next.behaviors.get('b1')?.effectiveness).toBe(1);
    });
  });

  describe('activateBehavior', () => {
    it('should activate', () => {
      let next = addBehavior(state, 'b1', 'Explore', 'exploratory', 'experimental');
      next = activateBehavior(next, 'b1');
      expect(next.behaviors.get('b1')?.state).toBe('active');
      expect(next.activeBehaviors).toBe(1);
    });
  });

  describe('recordBehaviorOutcome', () => {
    it('should record success', () => {
      let next = addBehavior(state, 'b1', 'Explore', 'exploratory', 'experimental');
      next = activateBehavior(next, 'b1');
      next = recordBehaviorOutcome(next, 'b1', true);
      expect(next.behaviors.get('b1')?.successRate).toBe(1);
    });
  });

  describe('adaptBehavior', () => {
    it('should adapt', () => {
      let next = addBehavior(state, 'b1', 'Explore', 'exploratory', 'experimental', 0.5);
      next = adaptBehavior(next, 'b1', 0.5);
      expect(next.behaviors.get('b1')?.effectiveness).toBe(1);
      expect(next.behaviors.get('b1')?.state).toBe('mastered');
    });

    it('should track mastery', () => {
      let next = addBehavior(state, 'b1', 'Explore', 'exploratory', 'experimental', 0.5);
      next = adaptBehavior(next, 'b1', 0.5);
      expect(next.masteredBehaviors).toBe(1);
    });
  });

  describe('getBehaviorsByPattern', () => {
    it('should filter by pattern', () => {
      let next = addBehavior(state, 'b1', 'Explore', 'exploratory', 'experimental');
      next = addBehavior(next, 'b2', 'Reactive', 'reactive', 'incremental');
      const exploratory = getBehaviorsByPattern(next, 'exploratory');
      expect(exploratory.length).toBe(1);
    });
  });

  describe('getBehaviorReport', () => {
    it('should return comprehensive report', () => {
      const report = getBehaviorReport(state);
      expect(report.totalBehaviors).toBe(0);
      expect(typeof report.behavioralDiversity).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getBehaviorReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetAdaptiveBehaviorEngineState', () => {
    it('should reset all state', () => {
      let next = addBehavior(state, 'b1', 'Explore', 'exploratory', 'experimental');
      next = resetAdaptiveBehaviorEngineState();
      expect(next.behaviors.size).toBe(0);
      expect(next.totalBehaviors).toBe(0);
    });
  });
});