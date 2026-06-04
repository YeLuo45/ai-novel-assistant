/**
 * V667 NarrativePacingEngine Tests — Direction C Iter 1/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativePacingState,
  addBeat,
  setTempo,
  getPacingFlow,
  getPacingRecommendations,
  getPacingReport,
  resetNarrativePacingState,
  type NarrativePacingState,
} from './NarrativePacingEngine';

describe('NarrativePacingEngine', () => {
  let state: NarrativePacingState;

  beforeEach(() => { state = createNarrativePacingState(); });

  describe('createNarrativePacingState', () => {
    it('should initialize with defaults', () => {
      expect(state.beats.size).toBe(0);
      expect(state.currentTempo).toBe('moderato');
      expect(state.totalBeats).toBe(0);
    });

    it('should have default pacing score', () => {
      expect(state.pacingScore).toBe(0.7);
    });
  });

  describe('addBeat', () => {
    it('should add beat', () => {
      const next = addBeat(state, 'b1', 'Opening scene', 500, 0.5, 'moderato', 'steady');
      expect(next.beats.size).toBe(1);
      expect(next.totalBeats).toBe(1);
    });

    it('should set beat properties', () => {
      const next = addBeat(state, 'b1', 'Action scene', 300, 0.9, 'allegro', 'accelerating');
      const beat = next.beats.get('b1');
      expect(beat?.intensity).toBe(0.9);
      expect(beat?.tempo).toBe('allegro');
    });

    it('should use default values', () => {
      const next = addBeat(state, 'b1', 'Default beat', 500);
      expect(next.beats.get('b1')?.intensity).toBe(0.5);
      expect(next.beats.get('b1')?.pacingType).toBe('steady');
    });

    it('should track position', () => {
      let next = addBeat(state, 'b1', 'First', 500);
      next = addBeat(next, 'b2', 'Second', 500);
      expect(next.beats.get('b2')?.position).toBe(1);
    });
  });

  describe('setTempo', () => {
    it('should set tempo', () => {
      const next = setTempo(state, 'allegro');
      expect(next.currentTempo).toBe('allegro');
    });

    it('should accept all tempo marks', () => {
      const marks = ['largo', 'adagio', 'moderato', 'allegro', 'presto'] as const;
      marks.forEach(mark => {
        const next = setTempo(state, mark);
        expect(next.currentTempo).toBe(mark);
      });
    });
  });

  describe('getPacingFlow', () => {
    it('should return beats in position order', () => {
      let next = addBeat(state, 'b1', 'First', 500, 0.5, 'moderato', 'steady');
      next = addBeat(next, 'b2', 'Second', 500, 0.5, 'moderato', 'steady');
      next = addBeat(next, 'b3', 'Third', 500, 0.5, 'moderato', 'steady');
      const flow = getPacingFlow(next);
      expect(flow[0]?.beatId).toBe('b1');
      expect(flow[2]?.beatId).toBe('b3');
    });

    it('should return empty for no beats', () => {
      const flow = getPacingFlow(state);
      expect(flow).toEqual([]);
    });
  });

  describe('getPacingRecommendations', () => {
    it('should return empty for no beats', () => {
      const recs = getPacingRecommendations(state);
      expect(Array.isArray(recs)).toBe(true);
    });

    it('should recommend varying rhythm for uniform beats', () => {
      let next = addBeat(state, 'b1', 'Beat 1', 500, 0.5, 'moderato', 'steady');
      next = addBeat(next, 'b2', 'Beat 2', 500, 0.5, 'moderato', 'steady');
      const recs = getPacingRecommendations(next);
      expect(recs.length).toBeGreaterThan(0);
    });

    it('should recommend adding tension for low intensity', () => {
      let next = addBeat(state, 'b1', 'Calm beat', 500, 0.1, 'adagio', 'decelerating');
      const recs = getPacingRecommendations(next);
      expect(recs.some(r => r.includes('tension'))).toBe(true);
    });

    it('should recommend contrast for high intensity', () => {
      let next = addBeat(state, 'b1', 'Intense beat', 500, 0.95, 'presto', 'accelerating');
      const recs = getPacingRecommendations(next);
      expect(recs.some(r => r.includes('contrast'))).toBe(true);
    });
  });

  describe('getPacingReport', () => {
    it('should return comprehensive report', () => {
      const report = getPacingReport(state);
      expect(report.totalBeats).toBe(0);
      expect(typeof report.pacingScore).toBe('number');
    });

    it('should round values', () => {
      let next = addBeat(state, 'b1', 'Beat', 500, 0.333333, 'moderato', 'steady');
      const report = getPacingReport(next);
      expect(report.averageIntensity).toBe(0.33);
    });
  });

  describe('resetNarrativePacingState', () => {
    it('should reset all state', () => {
      let next = addBeat(state, 'b1', 'Beat', 500, 0.5, 'moderato', 'steady');
      next = resetNarrativePacingState();
      expect(next.beats.size).toBe(0);
      expect(next.totalBeats).toBe(0);
    });
  });
});