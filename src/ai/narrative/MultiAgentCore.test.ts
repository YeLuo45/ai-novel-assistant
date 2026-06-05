/**
 * V749 MultiAgentCore Tests — Direction A Iter 6/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMultiAgentCoreState,
  registerAgent,
  updateAgentState,
  updateAgentSuccessRate,
  sendAgentMessage,
  setCoordinationPattern,
  getAgentsByRole,
  findBestAgent,
  getMultiAgentCoreReport,
  resetMultiAgentCoreState,
  type MultiAgentCoreState,
} from './MultiAgentCore';

describe('MultiAgentCore', () => {
  let state: MultiAgentCoreState;

  beforeEach(() => { state = createMultiAgentCoreState(); });

  describe('createMultiAgentCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.agents.size).toBe(0);
      expect(state.coordinationPattern).toBe('distributed');
    });
  });

  describe('registerAgent', () => {
    it('should register agent', () => {
      const next = registerAgent(state, 'a1', 'Agent 1', 'planner', ['analyze'], 0.8);
      expect(next.agents.size).toBe(1);
      expect(next.totalAgents).toBe(1);
    });
  });

  describe('updateAgentState', () => {
    it('should update state', () => {
      let next = registerAgent(state, 'a1', 'Agent', 'planner');
      next = updateAgentState(next, 'a1', 'busy', 0.5);
      expect(next.agents.get('a1')?.state).toBe('busy');
    });

    it('should clamp load', () => {
      let next = registerAgent(state, 'a1', 'Agent', 'planner');
      next = updateAgentState(next, 'a1', 'busy', 1.5);
      expect(next.agents.get('a1')?.load).toBe(1);
    });
  });

  describe('updateAgentSuccessRate', () => {
    it('should update success rate', () => {
      let next = registerAgent(state, 'a1', 'Agent', 'planner');
      next = updateAgentSuccessRate(next, 'a1', 0.95);
      expect(next.agents.get('a1')?.successRate).toBe(0.95);
    });
  });

  describe('sendAgentMessage', () => {
    it('should send message', () => {
      let next = registerAgent(state, 'a1', 'A1', 'planner');
      next = registerAgent(next, 'a2', 'A2', 'executor');
      next = sendAgentMessage(next, 'm1', 'a1', 'a2', 'Execute task');
      expect(next.totalMessages).toBe(1);
    });
  });

  describe('setCoordinationPattern', () => {
    it('should set pattern', () => {
      const next = setCoordinationPattern(state, 'hierarchical');
      expect(next.coordinationPattern).toBe('hierarchical');
    });
  });

  describe('getAgentsByRole', () => {
    it('should filter by role', () => {
      let next = registerAgent(state, 'a1', 'A1', 'planner');
      next = registerAgent(next, 'a2', 'A2', 'executor');
      const planners = getAgentsByRole(next, 'planner');
      expect(planners.length).toBe(1);
    });
  });

  describe('findBestAgent', () => {
    it('should return null for no idle agents', () => {
      const best = findBestAgent(state, ['analyze']);
      expect(best).toBeNull();
    });

    it('should find best matching agent', () => {
      let next = registerAgent(state, 'a1', 'A1', 'planner', ['analyze', 'design']);
      next = registerAgent(next, 'a2', 'A2', 'planner', ['analyze']);
      const best = findBestAgent(next, ['analyze', 'design']);
      expect(best?.agentId).toBe('a1');
    });
  });

  describe('getMultiAgentCoreReport', () => {
    it('should return comprehensive report', () => {
      const report = getMultiAgentCoreReport(state);
      expect(report.totalAgents).toBe(0);
      expect(typeof report.averageSuccessRate).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getMultiAgentCoreReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetMultiAgentCoreState', () => {
    it('should reset all state', () => {
      let next = registerAgent(state, 'a1', 'A1', 'planner');
      next = resetMultiAgentCoreState();
      expect(next.agents.size).toBe(0);
      expect(next.totalAgents).toBe(0);
    });
  });
});