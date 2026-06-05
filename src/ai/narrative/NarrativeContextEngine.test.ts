/**
 * V725 NarrativeContextEngine Tests — Direction E Iter 3/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeContextEngineState,
  addContextElement,
  updateFrameAttention,
  decayContext,
  getElementsByFrame,
  getElementsByRelevance,
  getFrameState,
  getContextReport,
  resetNarrativeContextEngineState,
  type NarrativeContextEngineState,
} from './NarrativeContextEngine';

describe('NarrativeContextEngine', () => {
  let state: NarrativeContextEngineState;

  beforeEach(() => { state = createNarrativeContextEngineState(); });

  describe('createNarrativeContextEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.elements.size).toBe(0);
      expect(state.frames.size).toBe(0);
    });

    it('should have default coherence', () => {
      expect(state.contextCoherence).toBe(0.5);
    });
  });

  describe('addContextElement', () => {
    it('should add element', () => {
      const next = addContextElement(state, 'e1', 'narrative', 'global', 'Main story', 'primary', 0.9);
      expect(next.elements.size).toBe(1);
      expect(next.totalElements).toBe(1);
    });

    it('should create new frame', () => {
      const next = addContextElement(state, 'e1', 'dialogue', 'local', 'A conversation', 'primary', 0.8);
      expect(next.frames.size).toBe(1);
    });

    it('should add to existing frame', () => {
      let next = addContextElement(state, 'e1', 'narrative', 'global', 'Story 1', 'primary', 0.9);
      next = addContextElement(next, 'e2', 'narrative', 'global', 'Story 2', 'primary', 0.8);
      const frame = next.frames.get('narrative');
      expect(frame?.elements.length).toBe(2);
    });
  });

  describe('updateFrameAttention', () => {
    it('should update attention', () => {
      let next = addContextElement(state, 'e1', 'narrative', 'global', 'Story', 'primary', 0.9);
      next = updateFrameAttention(next, 'narrative', 0.95);
      expect(next.frames.get('narrative')?.attention).toBe(0.95);
    });

    it('should clamp attention', () => {
      let next = addContextElement(state, 'e1', 'narrative', 'global', 'Story', 'primary', 0.9);
      next = updateFrameAttention(next, 'narrative', 1.5);
      expect(next.frames.get('narrative')?.attention).toBe(1);
    });

    it('should return state for unknown frame', () => {
      const next = updateFrameAttention(state, 'historical', 0.5);
      expect(next.frames.size).toBe(0);
    });
  });

  describe('decayContext', () => {
    it('should decay weights over time', () => {
      let next = addContextElement(state, 'e1', 'narrative', 'global', 'Story', 'primary', 0.9, 0.1);
      next = decayContext(next, 2);
      expect(next.elements.get('e1')?.weight).toBeCloseTo(0.7, 1);
    });

    it('should not decay below 0', () => {
      let next = addContextElement(state, 'e1', 'narrative', 'global', 'Story', 'primary', 0.5, 0.1);
      next = decayContext(next, 100);
      expect(next.elements.get('e1')?.weight).toBe(0);
    });
  });

  describe('getElementsByFrame', () => {
    it('should filter by frame', () => {
      let next = addContextElement(state, 'e1', 'narrative', 'global', 'Story 1', 'primary');
      next = addContextElement(next, 'e2', 'dialogue', 'local', 'Talk', 'secondary');
      const narrative = getElementsByFrame(next, 'narrative');
      expect(narrative.length).toBe(1);
    });
  });

  describe('getElementsByRelevance', () => {
    it('should filter by relevance', () => {
      let next = addContextElement(state, 'e1', 'narrative', 'global', 'Story', 'primary');
      next = addContextElement(next, 'e2', 'narrative', 'global', 'Background', 'tangential');
      const primary = getElementsByRelevance(next, 'primary');
      expect(primary.length).toBe(1);
    });
  });

  describe('getFrameState', () => {
    it('should return frame state', () => {
      let next = addContextElement(state, 'e1', 'narrative', 'global', 'Story', 'primary');
      const frame = getFrameState(next, 'narrative');
      expect(frame?.elements.length).toBe(1);
    });

    it('should return null for unknown frame', () => {
      const frame = getFrameState(state, 'historical');
      expect(frame).toBeNull();
    });
  });

  describe('getContextReport', () => {
    it('should return comprehensive report', () => {
      const report = getContextReport(state);
      expect(report.totalElements).toBe(0);
      expect(typeof report.contextCoherence).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getContextReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeContextEngineState', () => {
    it('should reset all state', () => {
      let next = addContextElement(state, 'e1', 'narrative', 'global', 'Story', 'primary');
      next = resetNarrativeContextEngineState();
      expect(next.elements.size).toBe(0);
      expect(next.totalElements).toBe(0);
    });
  });
});