/**
 * V925 IterativeLearningEngine Tests — Direction D Iter 10/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createIterativeLearningEngineState,
  addLearningExperience,
  addKnowledgeItem,
  applyKnowledgeItem,
  getExperiencesByType,
  getLearningReport,
  resetIterativeLearningEngineState,
  type IterativeLearningEngineState,
} from './IterativeLearningEngine';

describe('IterativeLearningEngine', () => {
  let state: IterativeLearningEngineState;

  beforeEach(() => { state = createIterativeLearningEngineState(); });

  describe('createIterativeLearningEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.experiences.size).toBe(0);
      expect(state.knowledge.size).toBe(0);
    });
  });

  describe('addLearningExperience', () => {
    it('should add experience', () => {
      const next = addLearningExperience(state, 'e1', 'reinforcement', 'evaluate', 'insight', 0.7, 1);
      expect(next.experiences.size).toBe(1);
      expect(next.totalExperiences).toBe(1);
    });
  });

  describe('addKnowledgeItem', () => {
    it('should add knowledge', () => {
      const next = addKnowledgeItem(state, 'k1', 'insight content', 'experience', 0.8);
      expect(next.totalKnowledge).toBe(1);
    });
  });

  describe('applyKnowledgeItem', () => {
    it('should apply', () => {
      let next = addKnowledgeItem(state, 'k1', 'insight', 'experience', 0.8);
      next = applyKnowledgeItem(next, 'k1');
      expect(next.knowledge.get('k1')?.applicationCount).toBe(1);
      expect(next.appliedKnowledge).toBe(1);
    });
  });

  describe('getExperiencesByType', () => {
    it('should filter by type', () => {
      let next = addLearningExperience(state, 'e1', 'reinforcement', 'evaluate', 'insight', 0.7, 1);
      next = addLearningExperience(next, 'e2', 'supervised', 'observe', 'insight', 0.7, 1);
      const reinforcement = getExperiencesByType(next, 'reinforcement');
      expect(reinforcement.length).toBe(1);
    });
  });

  describe('getLearningReport', () => {
    it('should return comprehensive report', () => {
      const report = getLearningReport(state);
      expect(report.totalExperiences).toBe(0);
      expect(typeof report.learningMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getLearningReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetIterativeLearningEngineState', () => {
    it('should reset all state', () => {
      let next = addLearningExperience(state, 'e1', 'reinforcement', 'evaluate', 'insight', 0.7, 1);
      next = resetIterativeLearningEngineState();
      expect(next.experiences.size).toBe(0);
      expect(next.totalExperiences).toBe(0);
    });
  });
});