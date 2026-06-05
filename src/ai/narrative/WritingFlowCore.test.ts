/**
 * V793 WritingFlowCore Tests — Direction D Iter 1/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWritingFlowCoreState,
  startFlowSession,
  updateSessionState,
  addFlowDisturbance,
  endFlowSession,
  recordFlowMetric,
  getSessionsByState,
  getFlowCoreReport,
  resetWritingFlowCoreState,
  type WritingFlowCoreState,
} from './WritingFlowCore';

describe('WritingFlowCore', () => {
  let state: WritingFlowCoreState;

  beforeEach(() => { state = createWritingFlowCoreState(); });

  describe('createWritingFlowCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.sessions.size).toBe(0);
      expect(state.currentState).toBe('warming');
    });
  });

  describe('startFlowSession', () => {
    it('should start session', () => {
      const next = startFlowSession(state, 's1', { skill: 0.8 });
      expect(next.sessions.size).toBe(1);
      expect(next.totalSessions).toBe(1);
    });

    it('should fill missing factors', () => {
      const next = startFlowSession(state, 's1', { skill: 0.8 });
      expect(next.sessions.get('s1')?.factors.get('challenge')).toBe(0.5);
    });
  });

  describe('updateSessionState', () => {
    it('should update state', () => {
      let next = startFlowSession(state, 's1');
      next = updateSessionState(next, 's1', 'flowing', 500, 0.8);
      expect(next.sessions.get('s1')?.state).toBe('flowing');
    });
  });

  describe('addFlowDisturbance', () => {
    it('should add disturbance', () => {
      let next = startFlowSession(state, 's1');
      next = addFlowDisturbance(next, 's1', 'distraction');
      expect(next.sessions.get('s1')?.disturbances.length).toBe(1);
    });
  });

  describe('endFlowSession', () => {
    it('should end session', () => {
      let next = startFlowSession(state, 's1');
      next = endFlowSession(next, 's1', 1000, 0.9);
      expect(next.sessions.get('s1')?.endTime).not.toBeNull();
      expect(next.activeSessions).toBe(0);
    });
  });

  describe('recordFlowMetric', () => {
    it('should record metric', () => {
      const next = recordFlowMetric(state, 'm1', 'concentration', 0.85, 'improving');
      expect(next.metrics.size).toBe(1);
    });

    it('should clamp value', () => {
      const next = recordFlowMetric(state, 'm1', 'concentration', 1.5);
      expect(next.metrics.get('m1')?.value).toBe(1);
    });
  });

  describe('getSessionsByState', () => {
    it('should filter by state', () => {
      let next = startFlowSession(state, 's1');
      next = updateSessionState(next, 's1', 'flowing', 500);
      const flowing = getSessionsByState(next, 'flowing');
      expect(flowing.length).toBe(1);
    });
  });

  describe('getFlowCoreReport', () => {
    it('should return comprehensive report', () => {
      const report = getFlowCoreReport(state);
      expect(report.totalSessions).toBe(0);
      expect(typeof report.flowConsistency).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getFlowCoreReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetWritingFlowCoreState', () => {
    it('should reset all state', () => {
      let next = startFlowSession(state, 's1');
      next = resetWritingFlowCoreState();
      expect(next.sessions.size).toBe(0);
      expect(next.totalSessions).toBe(0);
    });
  });
});