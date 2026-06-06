/**
 * V1165 NarrativeSoundPatternEngine Tests — Direction F Iter 10/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeSoundPatternEngineState,
  addSoundPattern,
  addSoundPatternLayer,
  getSoundPatternsByType,
  getSoundPatternReport,
  resetNarrativeSoundPatternEngineState,
  type NarrativeSoundPatternEngineState,
} from './NarrativeSoundPatternEngine';

describe('NarrativeSoundPatternEngine', () => {
  let state: NarrativeSoundPatternEngineState;

  beforeEach(() => { state = createNarrativeSoundPatternEngineState(); });

  describe('createNarrativeSoundPatternEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.patterns.size).toBe(0);
      expect(state.layers.size).toBe(0);
    });
  });

  describe('addSoundPattern', () => {
    it('should add pattern', () => {
      const next = addSoundPattern(state, 'p1', 'alliteration', 'deliberate', 'melodic', 'desc', 0.9, 0.85, 1);
      expect(next.patterns.size).toBe(1);
      expect(next.totalPatterns).toBe(1);
    });
  });

  describe('addSoundPatternLayer', () => {
    it('should add layer', () => {
      let next = addSoundPattern(state, 'p1', 'alliteration', 'deliberate', 'melodic', 'desc', 0.9, 0.85, 1);
      next = addSoundPatternLayer(next, 'l1', ['p1']);
      expect(next.totalLayers).toBe(1);
    });
  });

  describe('getSoundPatternsByType', () => {
    it('should filter by type', () => {
      let next = addSoundPattern(state, 'p1', 'alliteration', 'deliberate', 'melodic', 'desc', 0.9, 0.85, 1);
      next = addSoundPattern(next, 'p2', 'assonance', 'deliberate', 'melodic', 'desc', 0.9, 0.85, 1);
      const allit = getSoundPatternsByType(next, 'alliteration');
      expect(allit.length).toBe(1);
    });
  });

  describe('getSoundPatternReport', () => {
    it('should return comprehensive report', () => {
      const report = getSoundPatternReport(state);
      expect(report.totalPatterns).toBe(0);
      expect(typeof report.soundPatternMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getSoundPatternReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeSoundPatternEngineState', () => {
    it('should reset all state', () => {
      let next = addSoundPattern(state, 'p1', 'alliteration', 'deliberate', 'melodic', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeSoundPatternEngineState();
      expect(next.patterns.size).toBe(0);
      expect(next.totalPatterns).toBe(0);
    });
  });
});