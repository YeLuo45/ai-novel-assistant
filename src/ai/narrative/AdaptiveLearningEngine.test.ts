/**
 * V747 AdaptiveLearningEngine Tests — Direction A Iter 5/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAdaptiveLearningEngineState,
  recordLearningExperience,
  createLearningModel,
  trainModel,
  getExperiencesByMode,
  getModelsByRate,
  getAdaptiveLearningReport,
  resetAdaptiveLearningEngineState,
  type AdaptiveLearningEngineState,
} from './AdaptiveLearningEngine';

describe('AdaptiveLearningEngine', () => {
  let state: AdaptiveLearningEngineState;

  beforeEach(() => { state = createAdaptiveLearningEngineState(); });

  describe('createAdaptiveLearningEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.experiences.size).toBe(0);
      expect(state.models.size).toBe(0);
    });
  });

  describe('recordLearningExperience', () => {
    it('should record experience', () => {
      const next = recordLearningExperience(state, 'e1', 'supervised', 'input', 'expected', 'actual', 0.8);
      expect(next.experiences.size).toBe(1);
      expect(next.totalExperiences).toBe(1);
    });

    it('should clamp reward', () => {
      const next = recordLearningExperience(state, 'e1', 'supervised', 'in', 'out', 'out', 1.5);
      expect(next.experiences.get('e1')?.reward).toBe(1);
    });
  });

  describe('createLearningModel', () => {
    it('should create model', () => {
      const next = createLearningModel(state, 'm1', 'Main Model', 'adaptive', 0.7, 0.5);
      expect(next.models.size).toBe(1);
      expect(next.totalModels).toBe(1);
    });

    it('should clamp accuracy', () => {
      const next = createLearningModel(state, 'm1', 'M', 'adaptive', 1.5);
      expect(next.models.get('m1')?.accuracy).toBe(1);
    });
  });

  describe('trainModel', () => {
    it('should train model', () => {
      let next = createLearningModel(state, 'm1', 'M', 'adaptive', 0.5, 1.0);
      next = trainModel(next, 'm1', 5, 0.05);
      expect(next.models.get('m1')?.epochs).toBe(5);
      expect(next.models.get('m1')?.accuracy).toBeGreaterThan(0.5);
    });
  });

  describe('getExperiencesByMode', () => {
    it('should filter by mode', () => {
      let next = recordLearningExperience(state, 'e1', 'supervised', 'in', 'out', 'out', 0.5);
      next = recordLearningExperience(next, 'e2', 'reinforcement', 'in', 'out', 'out', 0.5);
      const sup = getExperiencesByMode(next, 'supervised');
      expect(sup.length).toBe(1);
    });
  });

  describe('getModelsByRate', () => {
    it('should filter by rate', () => {
      let next = createLearningModel(state, 'm1', 'M1', 'fast');
      next = createLearningModel(next, 'm2', 'M2', 'slow');
      const fast = getModelsByRate(next, 'fast');
      expect(fast.length).toBe(1);
    });
  });

  describe('getAdaptiveLearningReport', () => {
    it('should return comprehensive report', () => {
      const report = getAdaptiveLearningReport(state);
      expect(report.totalExperiences).toBe(0);
      expect(typeof report.averageAccuracy).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAdaptiveLearningReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetAdaptiveLearningEngineState', () => {
    it('should reset all state', () => {
      let next = recordLearningExperience(state, 'e1', 'supervised', 'in', 'out', 'out', 0.5);
      next = resetAdaptiveLearningEngineState();
      expect(next.experiences.size).toBe(0);
      expect(next.totalExperiences).toBe(0);
    });
  });
});