/**
 * V833 FeedbackIntegrationEngine Tests — Direction A Iter 3/9 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createFeedbackIntegrationEngineState,
  receiveFeedback,
  advanceFeedbackStage,
  createFeedbackAction,
  completeFeedbackAction,
  getFeedbackByChannel,
  getFeedbackIntegrationReport,
  resetFeedbackIntegrationEngineState,
  type FeedbackIntegrationEngineState,
} from './FeedbackIntegrationEngine';

describe('FeedbackIntegrationEngine', () => {
  let state: FeedbackIntegrationEngineState;

  beforeEach(() => { state = createFeedbackIntegrationEngineState(); });

  describe('createFeedbackIntegrationEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.feedbackItems.size).toBe(0);
      expect(state.actions.size).toBe(0);
    });
  });

  describe('receiveFeedback', () => {
    it('should receive', () => {
      const next = receiveFeedback(state, 'f1', 'reader', 'praise', 'Great chapter!', 'John', 0.7, 0.6);
      expect(next.feedbackItems.size).toBe(1);
      expect(next.totalFeedback).toBe(1);
    });

    it('should clamp priority and impact', () => {
      const next = receiveFeedback(state, 'f1', 'reader', 'praise', 'content', 'src', 1.5, -0.5);
      expect(next.feedbackItems.get('f1')?.priority).toBe(1);
      expect(next.feedbackItems.get('f1')?.impact).toBe(0);
    });
  });

  describe('advanceFeedbackStage', () => {
    it('should advance', () => {
      let next = receiveFeedback(state, 'f1', 'reader', 'praise', 'content', 'src');
      next = advanceFeedbackStage(next, 'f1', 'analyzed');
      expect(next.feedbackItems.get('f1')?.stage).toBe('analyzed');
    });

    it('should count verified', () => {
      let next = receiveFeedback(state, 'f1', 'reader', 'praise', 'content', 'src');
      next = advanceFeedbackStage(next, 'f1', 'verified');
      expect(next.integratedFeedback).toBe(1);
    });
  });

  describe('createFeedbackAction', () => {
    it('should create action', () => {
      const next = createFeedbackAction(state, 'a1', 'f1', 'revise chapter');
      expect(next.totalActions).toBe(1);
    });
  });

  describe('completeFeedbackAction', () => {
    it('should complete', () => {
      let next = createFeedbackAction(state, 'a1', 'f1', 'desc');
      next = completeFeedbackAction(next, 'a1', 'revised successfully');
      expect(next.actions.get('a1')?.status).toBe('completed');
    });
  });

  describe('getFeedbackByChannel', () => {
    it('should filter by channel', () => {
      let next = receiveFeedback(state, 'f1', 'reader', 'praise', 'c', 's');
      next = receiveFeedback(next, 'f2', 'editor', 'critique', 'c', 's');
      const reader = getFeedbackByChannel(next, 'reader');
      expect(reader.length).toBe(1);
    });
  });

  describe('getFeedbackIntegrationReport', () => {
    it('should return comprehensive report', () => {
      const report = getFeedbackIntegrationReport(state);
      expect(report.totalFeedback).toBe(0);
      expect(typeof report.integrationRate).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getFeedbackIntegrationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetFeedbackIntegrationEngineState', () => {
    it('should reset all state', () => {
      let next = receiveFeedback(state, 'f1', 'reader', 'praise', 'c', 's');
      next = resetFeedbackIntegrationEngineState();
      expect(next.feedbackItems.size).toBe(0);
      expect(next.totalFeedback).toBe(0);
    });
  });
});