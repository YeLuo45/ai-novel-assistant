/**
 * V1245 NarrativeAudienceFlowEngine2 Tests — Direction H Iter 10/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAudienceFlow2EngineState,
  addAudienceFlow,
  addAudienceFlowState,
  getAudienceFlowsByCondition,
  getAudienceFlow2Report,
  resetNarrativeAudienceFlow2EngineState,
  type NarrativeAudienceFlow2EngineState,
} from './NarrativeAudienceFlowEngine2';

describe('NarrativeAudienceFlowEngine2', () => {
  let state: NarrativeAudienceFlow2EngineState;

  beforeEach(() => { state = createNarrativeAudienceFlow2EngineState(); });

  describe('createNarrativeAudienceFlow2EngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.flows.size).toBe(0);
      expect(state.states.size).toBe(0);
    });
  });

  describe('addAudienceFlow', () => {
    it('should add flow', () => {
      const next = addAudienceFlow(state, 'f1', 'transcendent', 'mastery', 'transformative', 'desc', 0.95, 0.9, 1);
      expect(next.flows.size).toBe(1);
      expect(next.totalFlows).toBe(1);
    });
  });

  describe('addAudienceFlowState', () => {
    it('should add state', () => {
      let next = addAudienceFlow(state, 'f1', 'transcendent', 'mastery', 'transformative', 'desc', 0.95, 0.9, 1);
      next = addAudienceFlowState(next, 's1', ['f1']);
      expect(next.totalStates).toBe(1);
    });
  });

  describe('getAudienceFlowsByCondition', () => {
    it('should filter by condition', () => {
      let next = addAudienceFlow(state, 'f1', 'transcendent', 'mastery', 'transformative', 'desc', 0.95, 0.9, 1);
      next = addAudienceFlow(next, 'f2', 'flow', 'mastery', 'transformative', 'desc', 0.95, 0.9, 1);
      const trans = getAudienceFlowsByCondition(next, 'transcendent');
      expect(trans.length).toBe(1);
    });
  });

  describe('getAudienceFlow2Report', () => {
    it('should return comprehensive report', () => {
      const report = getAudienceFlow2Report(state);
      expect(report.totalFlows).toBe(0);
      expect(typeof report.audienceFlow2Mastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAudienceFlow2Report(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAudienceFlow2EngineState', () => {
    it('should reset all state', () => {
      let next = addAudienceFlow(state, 'f1', 'transcendent', 'mastery', 'transformative', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeAudienceFlow2EngineState();
      expect(next.flows.size).toBe(0);
      expect(next.totalFlows).toBe(0);
    });
  });
});