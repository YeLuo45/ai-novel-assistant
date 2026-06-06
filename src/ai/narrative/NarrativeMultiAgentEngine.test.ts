/**
 * V979 NarrativeMultiAgentEngine Tests — Direction A Iter 7/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeMultiAgentEngineState,
  addNarrativeAgent,
  recordAgentResult,
  sendAgentMessage,
  getAgentsByRole,
  getMultiAgentReport,
  resetNarrativeMultiAgentEngineState,
  type NarrativeMultiAgentEngineState,
} from './NarrativeMultiAgentEngine';

describe('NarrativeMultiAgentEngine', () => {
  let state: NarrativeMultiAgentEngineState;

  beforeEach(() => { state = createNarrativeMultiAgentEngineState(); });

  describe('createNarrativeMultiAgentEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.agents.size).toBe(0);
      expect(state.messages.size).toBe(0);
    });
  });

  describe('addNarrativeAgent', () => {
    it('should add agent', () => {
      const next = addNarrativeAgent(state, 'a1', 'planner', 0.8, 1);
      expect(next.agents.size).toBe(1);
      expect(next.totalAgents).toBe(1);
    });
  });

  describe('recordAgentResult', () => {
    it('should record success', () => {
      let next = addNarrativeAgent(state, 'a1', 'planner', 0.8, 1);
      next = recordAgentResult(next, 'a1', true);
      expect(next.agents.get('a1')?.successCount).toBe(1);
    });

    it('should record failure', () => {
      let next = addNarrativeAgent(state, 'a1', 'planner', 0.8, 1);
      next = recordAgentResult(next, 'a1', false);
      expect(next.agents.get('a1')?.failureCount).toBe(1);
    });
  });

  describe('sendAgentMessage', () => {
    it('should send', () => {
      const next = sendAgentMessage(state, 'm1', 'a1', 'a2', 'request', 'desc', 0.5, 1);
      expect(next.totalMessages).toBe(1);
    });
  });

  describe('getAgentsByRole', () => {
    it('should filter by role', () => {
      let next = addNarrativeAgent(state, 'a1', 'planner', 0.8, 1);
      next = addNarrativeAgent(next, 'a2', 'writer', 0.7, 1);
      const planners = getAgentsByRole(next, 'planner');
      expect(planners.length).toBe(1);
    });
  });

  describe('getMultiAgentReport', () => {
    it('should return comprehensive report', () => {
      const report = getMultiAgentReport(state);
      expect(report.totalAgents).toBe(0);
      expect(typeof report.multiAgentMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getMultiAgentReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeMultiAgentEngineState', () => {
    it('should reset all state', () => {
      let next = addNarrativeAgent(state, 'a1', 'planner', 0.8, 1);
      next = resetNarrativeMultiAgentEngineState();
      expect(next.agents.size).toBe(0);
      expect(next.totalAgents).toBe(0);
    });
  });
});