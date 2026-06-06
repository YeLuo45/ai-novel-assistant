/**
 * V1151 NarrativeParagraphPulseEngine Tests — Direction F Iter 3/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeParagraphPulseEngineState,
  addParagraphPulse,
  addParagraphPulseBeat,
  getParagraphPulsesByType,
  getParagraphPulseReport,
  resetNarrativeParagraphPulseEngineState,
  type NarrativeParagraphPulseEngineState,
} from './NarrativeParagraphPulseEngine';

describe('NarrativeParagraphPulseEngine', () => {
  let state: NarrativeParagraphPulseEngineState;

  beforeEach(() => { state = createNarrativeParagraphPulseEngineState(); });

  describe('createNarrativeParagraphPulseEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.pulses.size).toBe(0);
      expect(state.beats.size).toBe(0);
    });
  });

  describe('addParagraphPulse', () => {
    it('should add pulse', () => {
      const next = addParagraphPulse(state, 'p1', 'rhythmic', 'moderate', 'comfortable', 'desc', 0.85, 0.9, 1);
      expect(next.pulses.size).toBe(1);
      expect(next.totalPulses).toBe(1);
    });
  });

  describe('addParagraphPulseBeat', () => {
    it('should add beat', () => {
      let next = addParagraphPulse(state, 'p1', 'rhythmic', 'moderate', 'comfortable', 'desc', 0.85, 0.9, 1);
      next = addParagraphPulseBeat(next, 'b1', ['p1']);
      expect(next.totalBeats).toBe(1);
    });
  });

  describe('getParagraphPulsesByType', () => {
    it('should filter by type', () => {
      let next = addParagraphPulse(state, 'p1', 'rhythmic', 'moderate', 'comfortable', 'desc', 0.85, 0.9, 1);
      next = addParagraphPulse(next, 'p2', 'building', 'moderate', 'comfortable', 'desc', 0.85, 0.9, 1);
      const rhythmic = getParagraphPulsesByType(next, 'rhythmic');
      expect(rhythmic.length).toBe(1);
    });
  });

  describe('getParagraphPulseReport', () => {
    it('should return comprehensive report', () => {
      const report = getParagraphPulseReport(state);
      expect(report.totalPulses).toBe(0);
      expect(typeof report.paragraphPulseMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getParagraphPulseReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeParagraphPulseEngineState', () => {
    it('should reset all state', () => {
      let next = addParagraphPulse(state, 'p1', 'rhythmic', 'moderate', 'comfortable', 'desc', 0.85, 0.9, 1);
      next = resetNarrativeParagraphPulseEngineState();
      expect(next.pulses.size).toBe(0);
      expect(next.totalPulses).toBe(0);
    });
  });
});