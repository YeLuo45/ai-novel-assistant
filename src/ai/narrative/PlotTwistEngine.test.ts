/**
 * V765 PlotTwistEngine Tests — Direction B Iter 5/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPlotTwistEngineState,
  createPlotTwist,
  addForeshadowing,
  revealTwist,
  markPayoff,
  updateAudienceSuspects,
  getTwistsByType,
  getForeshadowingsForTwist,
  getTwistReport,
  resetPlotTwistEngineState,
  type PlotTwistEngineState,
} from './PlotTwistEngine';

describe('PlotTwistEngine', () => {
  let state: PlotTwistEngineState;

  beforeEach(() => { state = createPlotTwistEngineState(); });

  describe('createPlotTwistEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.twists.size).toBe(0);
      expect(state.foreshadowings.size).toBe(0);
    });
  });

  describe('createPlotTwist', () => {
    it('should create twist', () => {
      const next = createPlotTwist(state, 'tw1', 'revelation', 'The butler did it', 5, 'high');
      expect(next.twists.size).toBe(1);
      expect(next.totalTwists).toBe(1);
    });
  });

  describe('addForeshadowing', () => {
    it('should add foreshadowing', () => {
      let next = createPlotTwist(state, 'tw1', 'revelation', 'desc', 5);
      next = addForeshadowing(next, 'fs1', 'tw1', 'odd behavior', 1, 5, 0.7);
      expect(next.totalForeshadowings).toBe(1);
    });

    it('should update twist phase', () => {
      let next = createPlotTwist(state, 'tw1', 'revelation', 'desc', 5);
      next = addForeshadowing(next, 'fs1', 'tw1', 'hint', 1, 5);
      expect(next.twists.get('tw1')?.phase).toBe('foreshadowed');
    });

    it('should clamp subtlety', () => {
      let next = createPlotTwist(state, 'tw1', 'revelation', 'desc', 5);
      next = addForeshadowing(next, 'fs1', 'tw1', 'hint', 1, 5, 1.5);
      expect(next.foreshadowings.get('fs1')?.subtlety).toBe(1);
    });
  });

  describe('revealTwist', () => {
    it('should reveal', () => {
      let next = createPlotTwist(state, 'tw1', 'revelation', 'desc', 5);
      next = revealTwist(next, 'tw1', 0.9);
      expect(next.twists.get('tw1')?.phase).toBe('revealed');
      expect(next.revealedTwists).toBe(1);
    });

    it('should clamp satisfaction', () => {
      let next = createPlotTwist(state, 'tw1', 'revelation', 'desc', 5);
      next = revealTwist(next, 'tw1', 1.5);
      expect(next.twists.get('tw1')?.satisfaction).toBe(1);
    });
  });

  describe('markPayoff', () => {
    it('should mark payoff', () => {
      let next = createPlotTwist(state, 'tw1', 'revelation', 'desc', 5);
      next = markPayoff(next, 'tw1');
      expect(next.twists.get('tw1')?.phase).toBe('payoff');
    });
  });

  describe('updateAudienceSuspects', () => {
    it('should update suspects', () => {
      let next = createPlotTwist(state, 'tw1', 'revelation', 'desc', 5);
      next = updateAudienceSuspects(next, 'tw1', 0.5);
      expect(next.twists.get('tw1')?.audienceSuspects).toBe(0.5);
    });
  });

  describe('getTwistsByType', () => {
    it('should filter by type', () => {
      let next = createPlotTwist(state, 'tw1', 'revelation', 'desc', 5);
      next = createPlotTwist(next, 'tw2', 'betrayal', 'desc', 5);
      const revelations = getTwistsByType(next, 'revelation');
      expect(revelations.length).toBe(1);
    });
  });

  describe('getForeshadowingsForTwist', () => {
    it('should return foreshadowings', () => {
      let next = createPlotTwist(state, 'tw1', 'revelation', 'desc', 5);
      next = addForeshadowing(next, 'fs1', 'tw1', 'hint1', 1, 5);
      next = addForeshadowing(next, 'fs2', 'tw1', 'hint2', 2, 5);
      const fs = getForeshadowingsForTwist(next, 'tw1');
      expect(fs.length).toBe(2);
    });
  });

  describe('getTwistReport', () => {
    it('should return comprehensive report', () => {
      const report = getTwistReport(state);
      expect(report.totalTwists).toBe(0);
      expect(typeof report.averageSatisfaction).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTwistReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetPlotTwistEngineState', () => {
    it('should reset all state', () => {
      let next = createPlotTwist(state, 'tw1', 'revelation', 'desc', 5);
      next = resetPlotTwistEngineState();
      expect(next.twists.size).toBe(0);
      expect(next.totalTwists).toBe(0);
    });
  });
});