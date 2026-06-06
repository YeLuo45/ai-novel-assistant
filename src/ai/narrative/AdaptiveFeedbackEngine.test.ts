/**
 * V915 AdaptiveFeedbackEngine Tests — Direction D Iter 5/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAdaptiveFeedbackEngineState,
  addFeedbackItem,
  addFeedbackResponse,
  getFeedbackByChannel,
  getAdaptiveFeedbackReport,
  resetAdaptiveFeedbackEngineState,
  type AdaptiveFeedbackEngineState,
} from './AdaptiveFeedbackEngine';

describe('AdaptiveFeedbackEngine', () => {
  let state: AdaptiveFeedbackEngineState;

  beforeEach(() => { state = createAdaptiveFeedbackEngineState(); });

  describe('createAdaptiveFeedbackEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.feedback.size).toBe(0);
      expect(state.responses.size).toBe(0);
    });
  });

  describe('addFeedbackItem', () => {
    it('should add feedback', () => {
      const next = addFeedbackItem(state, 'f1', 'reader', 'praise', 'great chapter', 0.7, 1);
      expect(next.feedback.size).toBe(1);
      expect(next.totalFeedback).toBe(1);
    });
  });

  describe('addFeedbackResponse', () => {
    it('should add response', () => {
      let next = addFeedbackItem(state, 'f1', 'reader', 'praise', 'text', 0.7, 1);
      next = addFeedbackResponse(next, 'r1', 'f1', 'acknowledge', 'thanks', 0.8, 2);
      expect(next.totalResponses).toBe(1);
    });
  });

  describe('getFeedbackByChannel', () => {
    it('should filter by channel', () => {
      let next = addFeedbackItem(state, 'f1', 'reader', 'praise', 'text', 0.7, 1);
      next = addFeedbackItem(next, 'f2', 'editor', 'critique', 'text', 0.7, 1);
      const reader = getFeedbackByChannel(next, 'reader');
      expect(reader.length).toBe(1);
    });
  });

  describe('getAdaptiveFeedbackReport', () => {
    it('should return comprehensive report', () => {
      const report = getAdaptiveFeedbackReport(state);
      expect(report.totalFeedback).toBe(0);
      expect(typeof report.adaptiveMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAdaptiveFeedbackReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetAdaptiveFeedbackEngineState', () => {
    it('should reset all state', () => {
      let next = addFeedbackItem(state, 'f1', 'reader', 'praise', 'text', 0.7, 1);
      next = resetAdaptiveFeedbackEngineState();
      expect(next.feedback.size).toBe(0);
      expect(next.totalFeedback).toBe(0);
    });
  });
});