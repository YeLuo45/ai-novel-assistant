/**
 * V1015 NarrativeChapterEndEngine Tests — Direction B Iter 10/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeChapterEndEngineState,
  addChapterEnding,
  createChapterEndPattern,
  getChapterEndingsByType,
  getChapterEndReport,
  resetNarrativeChapterEndEngineState,
  type NarrativeChapterEndEngineState,
} from './NarrativeChapterEndEngine';

describe('NarrativeChapterEndEngine', () => {
  let state: NarrativeChapterEndEngineState;

  beforeEach(() => { state = createNarrativeChapterEndEngineState(); });

  describe('createNarrativeChapterEndEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.endings.size).toBe(0);
      expect(state.patterns.size).toBe(0);
    });
  });

  describe('addChapterEnding', () => {
    it('should add ending', () => {
      const next = addChapterEnding(state, 'e1', 'cliffhanger', 'strong', 'curiosity', 'desc', 0.8, 0.9, 1);
      expect(next.endings.size).toBe(1);
      expect(next.totalEndings).toBe(1);
    });
  });

  describe('createChapterEndPattern', () => {
    it('should create pattern', () => {
      let next = addChapterEnding(state, 'e1', 'cliffhanger', 'strong', 'curiosity', 'desc', 0.8, 0.9, 1);
      next = addChapterEnding(next, 'e2', 'revelation', 'strong', 'curiosity', 'desc', 0.8, 0.9, 2);
      next = createChapterEndPattern(next, 'p1', ['e1', 'e2']);
      expect(next.totalPatterns).toBe(1);
    });
  });

  describe('getChapterEndingsByType', () => {
    it('should filter by type', () => {
      let next = addChapterEnding(state, 'e1', 'cliffhanger', 'strong', 'curiosity', 'desc', 0.8, 0.9, 1);
      next = addChapterEnding(next, 'e2', 'resolution', 'strong', 'satisfaction', 'desc', 0.8, 0.3, 1);
      const cliff = getChapterEndingsByType(next, 'cliffhanger');
      expect(cliff.length).toBe(1);
    });
  });

  describe('getChapterEndReport', () => {
    it('should return comprehensive report', () => {
      const report = getChapterEndReport(state);
      expect(report.totalEndings).toBe(0);
      expect(typeof report.chapterEndMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getChapterEndReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeChapterEndEngineState', () => {
    it('should reset all state', () => {
      let next = addChapterEnding(state, 'e1', 'cliffhanger', 'strong', 'curiosity', 'desc', 0.8, 0.9, 1);
      next = resetNarrativeChapterEndEngineState();
      expect(next.endings.size).toBe(0);
      expect(next.totalEndings).toBe(0);
    });
  });
});