/**
 * V707 QualityAssessmentEngine Tests — Direction D Iter 3/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createQualityAssessmentState,
  createAssessment,
  addCriterion,
  getAssessmentByWork,
  getAssessmentsByGrade,
  getQualityReport,
  resetQualityAssessmentState,
  type QualityAssessmentState,
  type QualityCriterion,
} from './QualityAssessmentEngine';

describe('QualityAssessmentEngine', () => {
  let state: QualityAssessmentState;

  beforeEach(() => { state = createQualityAssessmentState(); });

  describe('createQualityAssessmentState', () => {
    it('should initialize with defaults', () => {
      expect(state.assessments.size).toBe(0);
      expect(state.totalAssessments).toBe(0);
    });

    it('should have null last assessment', () => {
      expect(state.lastAssessmentAt).toBeNull();
    });
  });

  describe('createAssessment', () => {
    it('should create assessment', () => {
      const criteria: QualityCriterion[] = [
        { dimension: 'originality', score: 0.8, weight: 1, notes: 'Unique' },
        { dimension: 'craft', score: 0.7, weight: 1, notes: 'Solid' },
      ];
      const next = createAssessment(state, 'a1', 'w1', criteria);
      expect(next.assessments.size).toBe(1);
      expect(next.totalAssessments).toBe(1);
    });

    it('should compute grade', () => {
      const criteria: QualityCriterion[] = [
        { dimension: 'originality', score: 0.95, weight: 1, notes: 'Great' },
      ];
      const next = createAssessment(state, 'a1', 'w1', criteria);
      expect(next.assessments.get('a1')?.grade).toBe('A');
    });

    it('should identify strengths and weaknesses', () => {
      const criteria: QualityCriterion[] = [
        { dimension: 'originality', score: 0.9, weight: 1, notes: 'Strong' },
        { dimension: 'craft', score: 0.4, weight: 1, notes: 'Weak' },
      ];
      const next = createAssessment(state, 'a1', 'w1', criteria);
      expect(next.assessments.get('a1')?.strengths.length).toBeGreaterThan(0);
      expect(next.assessments.get('a1')?.weaknesses.length).toBeGreaterThan(0);
    });
  });

  describe('addCriterion', () => {
    it('should add criterion', () => {
      let next = createAssessment(state, 'a1', 'w1', []);
      next = addCriterion(next, 'a1', 'engagement', 0.8, 1, 'Engaging');
      expect(next.assessments.get('a1')?.criteria.length).toBe(1);
    });

    it('should clamp score', () => {
      let next = createAssessment(state, 'a1', 'w1', []);
      next = addCriterion(next, 'a1', 'engagement', 1.5, 1);
      expect(next.assessments.get('a1')?.criteria[0]?.score).toBe(1);
    });

    it('should return state for unknown assessment', () => {
      const next = addCriterion(state, 'unknown', 'engagement', 0.8);
      expect(next.totalAssessments).toBe(0);
    });
  });

  describe('getAssessmentByWork', () => {
    it('should filter by work', () => {
      const criteria: QualityCriterion[] = [{ dimension: 'craft', score: 0.8, weight: 1, notes: '' }];
      let next = createAssessment(state, 'a1', 'w1', criteria);
      next = createAssessment(next, 'a2', 'w2', criteria);
      const w1Assessments = getAssessmentByWork(next, 'w1');
      expect(w1Assessments.length).toBe(1);
    });
  });

  describe('getAssessmentsByGrade', () => {
    it('should filter by grade', () => {
      const goodCriteria: QualityCriterion[] = [{ dimension: 'craft', score: 0.95, weight: 1, notes: '' }];
      const poorCriteria: QualityCriterion[] = [{ dimension: 'craft', score: 0.5, weight: 1, notes: '' }];
      let next = createAssessment(state, 'a1', 'w1', goodCriteria);
      next = createAssessment(next, 'a2', 'w2', poorCriteria);
      const aAssessments = getAssessmentsByGrade(next, 'A');
      expect(aAssessments.length).toBe(1);
    });
  });

  describe('getQualityReport', () => {
    it('should return comprehensive report', () => {
      const report = getQualityReport(state);
      expect(report.totalAssessments).toBe(0);
      expect(typeof report.averageScore).toBe('number');
    });

    it('should include grade distribution', () => {
      const criteria: QualityCriterion[] = [{ dimension: 'craft', score: 0.95, weight: 1, notes: '' }];
      const next = createAssessment(state, 'a1', 'w1', criteria);
      const report = getQualityReport(next);
      expect(report.gradeDistribution.A).toBe(1);
    });

    it('should include recommendations for empty state', () => {
      const report = getQualityReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetQualityAssessmentState', () => {
    it('should reset all state', () => {
      const criteria: QualityCriterion[] = [{ dimension: 'craft', score: 0.8, weight: 1, notes: '' }];
      let next = createAssessment(state, 'a1', 'w1', criteria);
      next = resetQualityAssessmentState();
      expect(next.assessments.size).toBe(0);
      expect(next.totalAssessments).toBe(0);
    });
  });
});