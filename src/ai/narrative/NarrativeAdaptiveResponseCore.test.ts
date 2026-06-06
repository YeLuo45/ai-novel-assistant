/**
 * V987 NarrativeAdaptiveResponseCore Tests — Direction A Iter 11/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAdaptiveResponseCoreState,
  addStimulus,
  addResponse,
  addResponsePattern,
  getResponsesByMode,
  getAdaptiveResponseReport,
  resetNarrativeAdaptiveResponseCoreState,
  type NarrativeAdaptiveResponseCoreState,
} from './NarrativeAdaptiveResponseCore';

describe('NarrativeAdaptiveResponseCore', () => {
  let state: NarrativeAdaptiveResponseCoreState;

  beforeEach(() => { state = createNarrativeAdaptiveResponseCoreState(); });

  describe('createNarrativeAdaptiveResponseCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.stimuli.size).toBe(0);
      expect(state.responses.size).toBe(0);
    });
  });

  describe('addStimulus', () => {
    it('should add stimulus', () => {
      const next = addStimulus(state, 's1', 'reader', 0.7, 'content', 100);
      expect(next.stimuli.size).toBe(1);
      expect(next.totalStimuli).toBe(1);
    });
  });

  describe('addResponse', () => {
    it('should add response', () => {
      let next = addStimulus(state, 's1', 'reader', 0.7, 'content', 100);
      next = addResponse(next, 'r1', 's1', 'react', 'excellent', 'action', 0.8, 0.3, 1);
      expect(next.totalResponses).toBe(1);
    });
  });

  describe('addResponsePattern', () => {
    it('should add pattern', () => {
      let next = addStimulus(state, 's1', 'reader', 0.7, 'content', 100);
      next = addResponse(next, 'r1', 's1', 'react', 'excellent', 'action', 0.8, 0.3, 1);
      next = addResponsePattern(next, 'p1', 'reader pattern', 'reader', ['r1']);
      expect(next.totalPatterns).toBe(1);
    });
  });

  describe('getResponsesByMode', () => {
    it('should filter by mode', () => {
      let next = addStimulus(state, 's1', 'reader', 0.7, 'content', 100);
      next = addResponse(next, 'r1', 's1', 'react', 'excellent', 'action', 0.8, 0.3, 1);
      next = addResponse(next, 'r2', 's1', 'proact', 'excellent', 'action', 0.8, 0.3, 1);
      const react = getResponsesByMode(next, 'react');
      expect(react.length).toBe(1);
    });
  });

  describe('getAdaptiveResponseReport', () => {
    it('should return comprehensive report', () => {
      const report = getAdaptiveResponseReport(state);
      expect(report.totalResponses).toBe(0);
      expect(typeof report.adaptiveResponseMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAdaptiveResponseReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAdaptiveResponseCoreState', () => {
    it('should reset all state', () => {
      let next = addStimulus(state, 's1', 'reader', 0.7, 'content', 100);
      next = resetNarrativeAdaptiveResponseCoreState();
      expect(next.stimuli.size).toBe(0);
      expect(next.totalStimuli).toBe(0);
    });
  });
});