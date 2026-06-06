/**
 * V967 NarrativeAdaptiveLearningCore Tests — Direction A Iter 1/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAdaptiveLearningCoreState,
  addLearningEpisode,
  addLearningPolicy,
  useLearningPolicy,
  getEpisodesByMode,
  getAdaptiveLearningReport,
  resetNarrativeAdaptiveLearningCoreState,
  type NarrativeAdaptiveLearningCoreState,
} from './NarrativeAdaptiveLearningCore';

describe('NarrativeAdaptiveLearningCore', () => {
  let state: NarrativeAdaptiveLearningCoreState;

  beforeEach(() => { state = createNarrativeAdaptiveLearningCoreState(); });

  describe('createNarrativeAdaptiveLearningCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.episodes.size).toBe(0);
      expect(state.policies.size).toBe(0);
    });
  });

  describe('addLearningEpisode', () => {
    it('should add episode', () => {
      const next = addLearningEpisode(state, 'e1', 'reinforcement', 'experiment', 'incremental', 'in', 'out', 0.8, 0.7, 1);
      expect(next.episodes.size).toBe(1);
      expect(next.totalEpisodes).toBe(1);
    });

    it('should clamp reward and retention', () => {
      const next = addLearningEpisode(state, 'e1', 'reinforcement', 'experiment', 'incremental', 'in', 'out', 2, -1, 1);
      expect(next.episodes.get('e1')?.reward).toBe(1);
      expect(next.episodes.get('e1')?.retention).toBe(0);
    });
  });

  describe('addLearningPolicy', () => {
    it('should add policy', () => {
      let next = addLearningEpisode(state, 'e1', 'reinforcement', 'experiment', 'incremental', 'in', 'out', 0.8, 0.7, 1);
      next = addLearningPolicy(next, 'p1', 'main policy', ['e1']);
      expect(next.totalPolicies).toBe(1);
    });
  });

  describe('useLearningPolicy', () => {
    it('should use', () => {
      let next = addLearningEpisode(state, 'e1', 'reinforcement', 'experiment', 'incremental', 'in', 'out', 0.8, 0.7, 1);
      next = addLearningPolicy(next, 'p1', 'name', ['e1']);
      next = useLearningPolicy(next, 'p1');
      expect(next.policies.get('p1')?.usage).toBe(1);
    });
  });

  describe('getEpisodesByMode', () => {
    it('should filter by mode', () => {
      let next = addLearningEpisode(state, 'e1', 'reinforcement', 'experiment', 'incremental', 'in', 'out', 0.8, 0.7, 1);
      next = addLearningEpisode(next, 'e2', 'supervised', 'observe', 'incremental', 'in', 'out', 0.8, 0.7, 1);
      const reinforcement = getEpisodesByMode(next, 'reinforcement');
      expect(reinforcement.length).toBe(1);
    });
  });

  describe('getAdaptiveLearningReport', () => {
    it('should return comprehensive report', () => {
      const report = getAdaptiveLearningReport(state);
      expect(report.totalEpisodes).toBe(0);
      expect(typeof report.learningMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAdaptiveLearningReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAdaptiveLearningCoreState', () => {
    it('should reset all state', () => {
      let next = addLearningEpisode(state, 'e1', 'reinforcement', 'experiment', 'incremental', 'in', 'out', 0.8, 0.7, 1);
      next = resetNarrativeAdaptiveLearningCoreState();
      expect(next.episodes.size).toBe(0);
      expect(next.totalEpisodes).toBe(0);
    });
  });
});