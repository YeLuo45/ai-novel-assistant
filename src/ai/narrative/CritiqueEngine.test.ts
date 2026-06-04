/**
 * V713 CritiqueEngine Tests — Direction D Iter 6/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCritiqueEngineState,
  startSession,
  addCritique,
  completeSession,
  getCritiquesByAspect,
  getCritiquesBySentiment,
  getSessionCritiques,
  getCritiqueReport,
  resetCritiqueEngineState,
  type CritiqueEngineState,
} from './CritiqueEngine';

describe('CritiqueEngine', () => {
  let state: CritiqueEngineState;

  beforeEach(() => { state = createCritiqueEngineState(); });

  describe('createCritiqueEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.sessions.size).toBe(0);
      expect(state.totalCritiques).toBe(0);
    });

    it('should have default constructive ratio', () => {
      expect(state.constructiveRatio).toBe(0.5);
    });
  });

  describe('startSession', () => {
    it('should start session', () => {
      const next = startSession(state, 's1', 'work1');
      expect(next.sessions.size).toBe(1);
      expect(next.totalSessions).toBe(1);
    });
  });

  describe('addCritique', () => {
    it('should add critique', () => {
      let next = startSession(state, 's1', 'work1');
      next = addCritique(next, 's1', 'c1', 'plot', 'constructive', 'moderate', 'Plot has issues', 'Add more conflict', 100, ['example1']);
      expect(next.totalCritiques).toBe(1);
    });

    it('should track aspect distribution', () => {
      let next = startSession(state, 's1', 'work1');
      next = addCritique(next, 's1', 'c1', 'plot', 'constructive', 'moderate', 'obs', 'sug', 0);
      expect(next.aspectDistribution.get('plot')).toBe(1);
    });

    it('should return state for unknown session', () => {
      const next = addCritique(state, 'unknown', 'c1', 'plot', 'constructive', 'moderate', 'obs', 'sug', 0);
      expect(next.totalCritiques).toBe(1);
    });
  });

  describe('completeSession', () => {
    it('should complete session', () => {
      let next = startSession(state, 's1', 'work1');
      next = completeSession(next, 's1');
      expect(next.sessions.get('s1')?.status).toBe('completed');
    });

    it('should return state for unknown session', () => {
      const next = completeSession(state, 'unknown');
      expect(next.totalSessions).toBe(0);
    });
  });

  describe('getCritiquesByAspect', () => {
    it('should filter by aspect', () => {
      let next = startSession(state, 's1', 'work1');
      next = addCritique(next, 's1', 'c1', 'plot', 'constructive', 'moderate', 'obs', 'sug', 0);
      next = addCritique(next, 's1', 'c2', 'character', 'constructive', 'moderate', 'obs', 'sug', 0);
      const plotCritiques = getCritiquesByAspect(next, 'plot');
      expect(plotCritiques.length).toBe(1);
    });
  });

  describe('getCritiquesBySentiment', () => {
    it('should filter by sentiment', () => {
      let next = startSession(state, 's1', 'work1');
      next = addCritique(next, 's1', 'c1', 'plot', 'constructive', 'moderate', 'obs', 'sug', 0);
      next = addCritique(next, 's1', 'c2', 'plot', 'critical', 'major', 'obs', 'sug', 0);
      const constructive = getCritiquesBySentiment(next, 'constructive');
      expect(constructive.length).toBe(1);
    });
  });

  describe('getSessionCritiques', () => {
    it('should return session critiques', () => {
      let next = startSession(state, 's1', 'work1');
      next = addCritique(next, 's1', 'c1', 'plot', 'constructive', 'moderate', 'obs', 'sug', 0);
      const critiques = getSessionCritiques(next, 's1');
      expect(critiques.length).toBe(1);
    });

    it('should return empty for unknown session', () => {
      const critiques = getSessionCritiques(state, 'unknown');
      expect(critiques).toEqual([]);
    });
  });

  describe('getCritiqueReport', () => {
    it('should return comprehensive report', () => {
      const report = getCritiqueReport(state);
      expect(report.totalCritiques).toBe(0);
      expect(typeof report.constructiveRatio).toBe('number');
    });

    it('should include aspect distribution', () => {
      let next = startSession(state, 's1', 'work1');
      next = addCritique(next, 's1', 'c1', 'plot', 'constructive', 'moderate', 'obs', 'sug', 0);
      const report = getCritiqueReport(next);
      expect(report.aspectDistribution.plot).toBe(1);
    });

    it('should include recommendations for empty state', () => {
      const report = getCritiqueReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetCritiqueEngineState', () => {
    it('should reset all state', () => {
      let next = startSession(state, 's1', 'work1');
      next = resetCritiqueEngineState();
      expect(next.sessions.size).toBe(0);
      expect(next.totalSessions).toBe(0);
    });
  });
});