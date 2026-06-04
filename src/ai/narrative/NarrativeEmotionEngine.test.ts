/**
 * V697 NarrativeEmotionEngine Tests — Direction B Iter 7/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeEmotionState,
  addEmotionalBeat,
  createEmotionalArc,
  addCatharsis,
  getBeatsByEmotion,
  getArcsByCharacter,
  getEmotionalJourney,
  getEmotionReport,
  resetNarrativeEmotionState,
  type NarrativeEmotionState,
} from './NarrativeEmotionEngine';

describe('NarrativeEmotionEngine', () => {
  let state: NarrativeEmotionState;

  beforeEach(() => { state = createNarrativeEmotionState(); });

  describe('createNarrativeEmotionState', () => {
    it('should initialize with defaults', () => {
      expect(state.beats.size).toBe(0);
      expect(state.arcs.size).toBe(0);
      expect(state.totalBeats).toBe(0);
    });

    it('should have default intensity', () => {
      expect(state.averageIntensity).toBe(0.5);
    });
  });

  describe('addEmotionalBeat', () => {
    it('should add beat', () => {
      const next = addEmotionalBeat(state, 'b1', 1, 'joy', 'intense', 'Wedding', 'alice', 100);
      expect(next.beats.size).toBe(1);
      expect(next.totalBeats).toBe(1);
    });

    it('should count emotions', () => {
      let next = addEmotionalBeat(state, 'b1', 1, 'joy', 'intense', 'Wedding', 'alice', 100);
      next = addEmotionalBeat(next, 'b2', 2, 'sadness', 'moderate', 'Death', 'alice', 200);
      expect(next.emotionCounts.get('joy')).toBe(1);
      expect(next.emotionCounts.get('sadness')).toBe(1);
    });
  });

  describe('createEmotionalArc', () => {
    it('should create arc', () => {
      const next = createEmotionalArc(state, 'arc1', 'alice', 'joy', 'hope', ['b1', 'b2']);
      expect(next.arcs.size).toBe(1);
      expect(next.totalArcs).toBe(1);
    });
  });

  describe('addCatharsis', () => {
    it('should add catharsis', () => {
      let next = createEmotionalArc(state, 'arc1', 'alice', 'joy', 'hope');
      next = addCatharsis(next, 'arc1', 'purging', 5);
      expect(next.arcs.get('arc1')?.catharsis).toBe('purging');
      expect(next.catharsisCount).toBe(1);
    });

    it('should return state for unknown arc', () => {
      const next = addCatharsis(state, 'unknown', 'purging', 1);
      expect(next.catharsisCount).toBe(0);
    });
  });

  describe('getBeatsByEmotion', () => {
    it('should filter by emotion', () => {
      let next = addEmotionalBeat(state, 'b1', 1, 'joy', 'intense', 'Wedding', 'alice', 100);
      next = addEmotionalBeat(next, 'b2', 2, 'sadness', 'moderate', 'Death', 'alice', 200);
      const joyBeats = getBeatsByEmotion(next, 'joy');
      expect(joyBeats.length).toBe(1);
    });
  });

  describe('getArcsByCharacter', () => {
    it('should filter by character', () => {
      let next = createEmotionalArc(state, 'arc1', 'alice', 'joy', 'hope');
      next = createEmotionalArc(next, 'arc2', 'bob', 'fear', 'hope');
      const aliceArcs = getArcsByCharacter(next, 'alice');
      expect(aliceArcs.length).toBe(1);
    });
  });

  describe('getEmotionalJourney', () => {
    it('should return ordered beats', () => {
      let next = addEmotionalBeat(state, 'b1', 2, 'joy', 'intense', 'Wedding', 'alice', 200);
      next = addEmotionalBeat(next, 'b2', 1, 'sadness', 'moderate', 'Death', 'alice', 100);
      const journey = getEmotionalJourney(next, 'alice');
      expect(journey[0]?.position).toBe(1);
    });
  });

  describe('getEmotionReport', () => {
    it('should return comprehensive report', () => {
      const report = getEmotionReport(state);
      expect(report.totalBeats).toBe(0);
      expect(typeof report.emotionalRange).toBe('number');
    });

    it('should include emotion distribution', () => {
      let next = addEmotionalBeat(state, 'b1', 1, 'joy', 'intense', 'Wedding', 'alice', 100);
      const report = getEmotionReport(next);
      expect(report.emotionDistribution.joy).toBe(1);
    });

    it('should include recommendations for empty state', () => {
      const report = getEmotionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeEmotionState', () => {
    it('should reset all state', () => {
      let next = addEmotionalBeat(state, 'b1', 1, 'joy', 'intense', 'Wedding', 'alice', 100);
      next = resetNarrativeEmotionState();
      expect(next.beats.size).toBe(0);
      expect(next.totalBeats).toBe(0);
    });
  });
});