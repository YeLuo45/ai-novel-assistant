/**
 * V1125 NarrativeFlowStateEngine Tests — Direction E Iter 10/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeFlowStateEngineState,
  addFlowState,
  addFlowZone,
  getFlowStatesByChallenge,
  getFlowStateReport,
  resetNarrativeFlowStateEngineState,
  type NarrativeFlowStateEngineState,
} from './NarrativeFlowStateEngine';

describe('NarrativeFlowStateEngine', () => {
  let state: NarrativeFlowStateEngineState;

  beforeEach(() => { state = createNarrativeFlowStateEngineState(); });

  describe('createNarrativeFlowStateEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.flows.size).toBe(0);
      expect(state.zones.size).toBe(0);
    });
  });

  describe('addFlowState', () => {
    it('should add flow', () => {
      const next = addFlowState(state, 'f1', 'balanced', 'proficient', 'focused', 'desc', 0.9, 0.85, 1);
      expect(next.flows.size).toBe(1);
      expect(next.totalFlows).toBe(1);
    });
  });

  describe('addFlowZone', () => {
    it('should add zone', () => {
      let next = addFlowState(state, 'f1', 'balanced', 'proficient', 'focused', 'desc', 0.9, 0.85, 1);
      next = addFlowZone(next, 'z1', ['f1']);
      expect(next.totalZones).toBe(1);
    });
  });

  describe('getFlowStatesByChallenge', () => {
    it('should filter by challenge', () => {
      let next = addFlowState(state, 'f1', 'balanced', 'proficient', 'focused', 'desc', 0.9, 0.85, 1);
      next = addFlowState(next, 'f2', 'easy', 'proficient', 'focused', 'desc', 0.9, 0.85, 1);
      const balanced = getFlowStatesByChallenge(next, 'balanced');
      expect(balanced.length).toBe(1);
    });
  });

  describe('getFlowStateReport', () => {
    it('should return comprehensive report', () => {
      const report = getFlowStateReport(state);
      expect(report.totalFlows).toBe(0);
      expect(typeof report.flowMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getFlowStateReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeFlowStateEngineState', () => {
    it('should reset all state', () => {
      let next = addFlowState(state, 'f1', 'balanced', 'proficient', 'focused', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeFlowStateEngineState();
      expect(next.flows.size).toBe(0);
      expect(next.totalFlows).toBe(0);
    });
  });
});