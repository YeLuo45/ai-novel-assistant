/**
 * V865 NarrativeStyleEngine Tests — Direction B Iter 10/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStyleEngineState,
  addStyleSample,
  addStyleTechnique,
  useStyleTechnique,
  getSamplesByMode,
  getStyleReport,
  resetNarrativeStyleEngineState,
  type NarrativeStyleEngineState,
} from './NarrativeStyleEngine';

describe('NarrativeStyleEngine', () => {
  let state: NarrativeStyleEngineState;

  beforeEach(() => { state = createNarrativeStyleEngineState(); });

  describe('createNarrativeStyleEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.samples.size).toBe(0);
      expect(state.techniques.size).toBe(0);
    });
  });

  describe('addStyleSample', () => {
    it('should add sample', () => {
      const scores = new Map();
      scores.set('syntax', 0.8);
      const next = addStyleSample(state, 's1', 'text', scores, 'lyrical', 'complex');
      expect(next.samples.size).toBe(1);
      expect(next.totalSamples).toBe(1);
    });
  });

  describe('addStyleTechnique', () => {
    it('should add technique', () => {
      const next = addStyleTechnique(state, 't1', 'metaphor', 'comparison', ['imagery'], 0.7);
      expect(next.totalTechniques).toBe(1);
    });
  });

  describe('useStyleTechnique', () => {
    it('should increment usage', () => {
      let next = addStyleTechnique(state, 't1', 'name', 'desc', ['syntax']);
      next = useStyleTechnique(next, 't1');
      expect(next.techniques.get('t1')?.usages).toBe(1);
    });
  });

  describe('getSamplesByMode', () => {
    it('should filter by mode', () => {
      const scores = new Map();
      scores.set('syntax', 0.8);
      let next = addStyleSample(state, 's1', 'text', scores, 'lyrical', 'complex');
      next = addStyleSample(next, 's2', 'text', scores, 'sparse', 'simple');
      const lyrical = getSamplesByMode(next, 'lyrical');
      expect(lyrical.length).toBe(1);
    });
  });

  describe('getStyleReport', () => {
    it('should return comprehensive report', () => {
      const report = getStyleReport(state);
      expect(report.totalSamples).toBe(0);
      expect(typeof report.styleMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStyleReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStyleEngineState', () => {
    it('should reset all state', () => {
      const scores = new Map();
      scores.set('syntax', 0.8);
      let next = addStyleSample(state, 's1', 'text', scores);
      next = resetNarrativeStyleEngineState();
      expect(next.samples.size).toBe(0);
      expect(next.totalSamples).toBe(0);
    });
  });
});