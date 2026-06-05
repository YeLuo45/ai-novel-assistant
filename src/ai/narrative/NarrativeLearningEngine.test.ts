/**
 * V823 NarrativeLearningEngine Tests — Direction E Iter 7/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeLearningEngineState,
  recordLearningExperience,
  addSkill,
  practiceSkill,
  getExperiencesByStyle,
  getSkillsByLevel,
  getLearningEngineReport,
  resetNarrativeLearningEngineState,
  type NarrativeLearningEngineState,
} from './NarrativeLearningEngine';

describe('NarrativeLearningEngine', () => {
  let state: NarrativeLearningEngineState;

  beforeEach(() => { state = createNarrativeLearningEngineState(); });

  describe('createNarrativeLearningEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.experiences.size).toBe(0);
      expect(state.skills.size).toBe(0);
    });
  });

  describe('recordLearningExperience', () => {
    it('should record experience', () => {
      const next = recordLearningExperience(state, 'e1', 'plotting', 'visual', 'acquisition', 2, 0.7, 0.6);
      expect(next.experiences.size).toBe(1);
      expect(next.totalExperiences).toBe(1);
    });

    it('should clamp retention', () => {
      const next = recordLearningExperience(state, 'e1', 's', 'visual', 'acquisition', 1, 1.5);
      expect(next.experiences.get('e1')?.retention).toBe(1);
    });
  });

  describe('addSkill', () => {
    it('should add skill', () => {
      const next = addSkill(state, 's1', 'Plotting', 'novice');
      expect(next.skills.size).toBe(1);
      expect(next.totalSkills).toBe(1);
    });
  });

  describe('practiceSkill', () => {
    it('should practice and level up', () => {
      let next = addSkill(state, 's1', 'Plotting', 'novice');
      next = practiceSkill(next, 's1', 50);
      expect(next.skills.get('s1')?.progress).toBe(0.5);
      expect(next.skills.get('s1')?.level).toBe('competent');
    });

    it('should reach expert', () => {
      let next = addSkill(state, 's1', 'Plotting', 'novice');
      next = practiceSkill(next, 's1', 100);
      expect(next.skills.get('s1')?.level).toBe('expert');
    });
  });

  describe('getExperiencesByStyle', () => {
    it('should filter by style', () => {
      let next = recordLearningExperience(state, 'e1', 's', 'visual', 'acquisition', 1);
      next = recordLearningExperience(next, 'e2', 's', 'auditory', 'acquisition', 1);
      const visual = getExperiencesByStyle(next, 'visual');
      expect(visual.length).toBe(1);
    });
  });

  describe('getSkillsByLevel', () => {
    it('should filter by level', () => {
      let next = addSkill(state, 's1', 'Plotting', 'novice');
      next = addSkill(next, 's2', 'Dialogue', 'expert');
      const experts = getSkillsByLevel(next, 'expert');
      expect(experts.length).toBe(1);
    });
  });

  describe('getLearningEngineReport', () => {
    it('should return comprehensive report', () => {
      const report = getLearningEngineReport(state);
      expect(report.totalSkills).toBe(0);
      expect(typeof report.learningVelocity).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getLearningEngineReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeLearningEngineState', () => {
    it('should reset all state', () => {
      let next = addSkill(state, 's1', 'Plotting', 'novice');
      next = resetNarrativeLearningEngineState();
      expect(next.skills.size).toBe(0);
      expect(next.totalSkills).toBe(0);
    });
  });
});