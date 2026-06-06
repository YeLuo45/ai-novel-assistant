/**
 * V907 AdaptiveWritingCore Tests — Direction D Iter 1/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAdaptiveWritingCoreState,
  recordAdaptation,
  addAdaptationPattern,
  useAdaptationPattern,
  getEventsByTrigger,
  getAdaptationReport,
  resetAdaptiveWritingCoreState,
  type AdaptiveWritingCoreState,
} from './AdaptiveWritingCore';

describe('AdaptiveWritingCore', () => {
  let state: AdaptiveWritingCoreState;

  beforeEach(() => { state = createAdaptiveWritingCoreState(); });

  describe('createAdaptiveWritingCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.events.size).toBe(0);
      expect(state.patterns.size).toBe(0);
    });
  });

  describe('recordAdaptation', () => {
    it('should record', () => {
      const next = recordAdaptation(state, 'e1', 'feedback', 'adjust', 'moderate', 'desc', 0.7, true, 1);
      expect(next.events.size).toBe(1);
      expect(next.successCount).toBe(1);
    });

    it('should clamp impact', () => {
      const next = recordAdaptation(state, 'e1', 'feedback', 'adjust', 'moderate', 'desc', 1.5, true, 1);
      expect(next.events.get('e1')?.impact).toBe(1);
    });
  });

  describe('addAdaptationPattern', () => {
    it('should add pattern', () => {
      let next = recordAdaptation(state, 'e1', 'feedback', 'adjust', 'moderate', 'desc', 0.7, true, 1);
      next = addAdaptationPattern(next, 'p1', 'feedback loop', ['e1']);
      expect(next.totalPatterns).toBe(1);
    });
  });

  describe('useAdaptationPattern', () => {
    it('should increment usage', () => {
      let next = recordAdaptation(state, 'e1', 'feedback', 'adjust', 'moderate', 'desc', 0.7, true, 1);
      next = addAdaptationPattern(next, 'p1', 'name', ['e1']);
      next = useAdaptationPattern(next, 'p1');
      expect(next.patterns.get('p1')?.usage).toBe(1);
    });
  });

  describe('getEventsByTrigger', () => {
    it('should filter by trigger', () => {
      let next = recordAdaptation(state, 'e1', 'feedback', 'adjust', 'moderate', 'desc', 0.7, true, 1);
      next = recordAdaptation(next, 'e2', 'metrics', 'adjust', 'moderate', 'desc', 0.7, true, 1);
      const feedback = getEventsByTrigger(next, 'feedback');
      expect(feedback.length).toBe(1);
    });
  });

  describe('getAdaptationReport', () => {
    it('should return comprehensive report', () => {
      const report = getAdaptationReport(state);
      expect(report.totalEvents).toBe(0);
      expect(typeof report.coreMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAdaptationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetAdaptiveWritingCoreState', () => {
    it('should reset all state', () => {
      let next = recordAdaptation(state, 'e1', 'feedback', 'adjust', 'moderate', 'desc', 0.7, true, 1);
      next = resetAdaptiveWritingCoreState();
      expect(next.events.size).toBe(0);
      expect(next.totalEvents).toBe(0);
    });
  });
});