/**
 * V847 NarrativeSubtextEngine Tests — Direction B Iter 1/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeSubtextEngineState,
  addSubtext,
  discoverSubtext,
  addSubtextPattern,
  getSubtextsByType,
  getSubtextReport,
  resetNarrativeSubtextEngineState,
  type NarrativeSubtextEngineState,
} from './NarrativeSubtextEngine';

describe('NarrativeSubtextEngine', () => {
  let state: NarrativeSubtextEngineState;

  beforeEach(() => { state = createNarrativeSubtextEngineState(); });

  describe('createNarrativeSubtextEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.elements.size).toBe(0);
      expect(state.patterns.size).toBe(0);
    });
  });

  describe('addSubtext', () => {
    it('should add subtext', () => {
      const next = addSubtext(state, 's1', 'emotional', 'personal', 'I am fine', 'struggling inside', 'hint', 0.7);
      expect(next.elements.size).toBe(1);
      expect(next.totalElements).toBe(1);
    });

    it('should clamp impact', () => {
      const next = addSubtext(state, 's1', 'emotional', 'personal', 'text', 'subtext', 'hint', 1.5);
      expect(next.elements.get('s1')?.readerImpact).toBe(1);
    });
  });

  describe('discoverSubtext', () => {
    it('should discover', () => {
      let next = addSubtext(state, 's1', 'emotional', 'personal', 't', 's');
      next = discoverSubtext(next, 's1');
      expect(next.elements.get('s1')?.discovered).toBe(true);
    });
  });

  describe('addSubtextPattern', () => {
    it('should add pattern', () => {
      const next = addSubtextPattern(state, 'p1', 'recurring motif', ['s1'], 0.7);
      expect(next.totalPatterns).toBe(1);
    });
  });

  describe('getSubtextsByType', () => {
    it('should filter by type', () => {
      let next = addSubtext(state, 's1', 'emotional', 'personal', 't', 's');
      next = addSubtext(next, 's2', 'symbolic', 'archetypal', 't', 's');
      const emotional = getSubtextsByType(next, 'emotional');
      expect(emotional.length).toBe(1);
    });
  });

  describe('getSubtextReport', () => {
    it('should return comprehensive report', () => {
      const report = getSubtextReport(state);
      expect(report.totalElements).toBe(0);
      expect(typeof report.subtextRichness).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getSubtextReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeSubtextEngineState', () => {
    it('should reset all state', () => {
      let next = addSubtext(state, 's1', 'emotional', 'personal', 't', 's');
      next = resetNarrativeSubtextEngineState();
      expect(next.elements.size).toBe(0);
      expect(next.totalElements).toBe(0);
    });
  });
});