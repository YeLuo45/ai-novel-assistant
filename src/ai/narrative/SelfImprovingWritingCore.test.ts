/**
 * V913 SelfImprovingWritingCore Tests — Direction D Iter 4/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSelfImprovingWritingCoreState,
  recordImprovement,
  addSkillProfile,
  updateSkillLevel,
  getProfilesByArea,
  getSelfImprovementReport,
  resetSelfImprovingWritingCoreState,
  type SelfImprovingWritingCoreState,
} from './SelfImprovingWritingCore';

describe('SelfImprovingWritingCore', () => {
  let state: SelfImprovingWritingCoreState;

  beforeEach(() => { state = createSelfImprovingWritingCoreState(); });

  describe('createSelfImprovingWritingCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.improvements.size).toBe(0);
      expect(state.profiles.size).toBe(0);
    });
  });

  describe('recordImprovement', () => {
    it('should record', () => {
      const next = recordImprovement(state, 'i1', 'craft', 'practice', 0.5, 0.6, 1);
      expect(next.improvements.size).toBe(1);
      expect(next.totalGain).toBeCloseTo(0.1, 5);
    });
  });

  describe('addSkillProfile', () => {
    it('should add profile', () => {
      const next = addSkillProfile(state, 'p1', 'Dialogue', 'craft', 0.7);
      expect(next.profiles.size).toBe(1);
      expect(next.profiles.get('p1')?.growthStage).toBe('proficient');
    });
  });

  describe('updateSkillLevel', () => {
    it('should update', () => {
      let next = addSkillProfile(state, 'p1', 'Dialogue', 'craft', 0.5);
      next = updateSkillLevel(next, 'p1', 0.95);
      expect(next.profiles.get('p1')?.growthStage).toBe('master');
    });
  });

  describe('getProfilesByArea', () => {
    it('should filter by area', () => {
      let next = addSkillProfile(state, 'p1', 'Dialogue', 'craft', 0.7);
      next = addSkillProfile(next, 'p2', 'Style', 'style', 0.6);
      const craft = getProfilesByArea(next, 'craft');
      expect(craft.length).toBe(1);
    });
  });

  describe('getSelfImprovementReport', () => {
    it('should return comprehensive report', () => {
      const report = getSelfImprovementReport(state);
      expect(report.totalImprovements).toBe(0);
      expect(typeof report.selfImprovementScore).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getSelfImprovementReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetSelfImprovingWritingCoreState', () => {
    it('should reset all state', () => {
      let next = recordImprovement(state, 'i1', 'craft', 'practice', 0.5, 0.6, 1);
      next = resetSelfImprovingWritingCoreState();
      expect(next.improvements.size).toBe(0);
      expect(next.totalImprovements).toBe(0);
    });
  });
});