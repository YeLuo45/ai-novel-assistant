/**
 * V693 DialogueRefinementEngine Tests — Direction B Iter 5/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDialogueRefinementState,
  defineVoice,
  addRefinement,
  getRefinementsByType,
  getRefinementsByCharacter,
  getVoiceByCharacter,
  checkVoiceConsistency,
  getRefinementReport,
  resetDialogueRefinementState,
  type DialogueRefinementState,
} from './DialogueRefinementEngine';

describe('DialogueRefinementEngine', () => {
  let state: DialogueRefinementState;

  beforeEach(() => { state = createDialogueRefinementState(); });

  describe('createDialogueRefinementState', () => {
    it('should initialize with defaults', () => {
      expect(state.refinements.size).toBe(0);
      expect(state.voices.size).toBe(0);
    });

    it('should have default quality score', () => {
      expect(state.averageQualityScore).toBe(0.7);
    });
  });

  describe('defineVoice', () => {
    it('should define voice', () => {
      const next = defineVoice(state, 'v1', 'alice', ['uses "thee"'], ['modern slang'], ['thou', 'thee'], 0.6, 0.8);
      expect(next.voices.size).toBe(1);
      expect(next.characterVoices).toBe(1);
    });
  });

  describe('addRefinement', () => {
    it('should add refinement', () => {
      const next = addRefinement(state, 'r1', 'Original text', 'Refined text', 'clarity', 'minor', 'Better word choice', 0.8, 'alice');
      expect(next.refinements.size).toBe(1);
      expect(next.totalRefinements).toBe(1);
    });

    it('should clamp quality score', () => {
      const next = addRefinement(state, 'r1', 'text', 'text', 'clarity', 'minor', 'reason', 1.5, 'alice');
      expect(next.refinements.get('r1')?.qualityScore).toBe(1);
    });

    it('should track refinement history', () => {
      let next = addRefinement(state, 'r1', 'text1', 'text1', 'clarity', 'minor', 'reason', 0.8, 'alice');
      next = addRefinement(next, 'r2', 'text2', 'text2', 'clarity', 'minor', 'reason', 0.8, 'alice');
      expect(next.refinementHistory.length).toBe(2);
    });
  });

  describe('getRefinementsByType', () => {
    it('should filter by type', () => {
      let next = addRefinement(state, 'r1', 'text', 'text', 'clarity', 'minor', 'reason', 0.8, 'alice');
      next = addRefinement(next, 'r2', 'text', 'text', 'naturalness', 'minor', 'reason', 0.8, 'alice');
      const clarity = getRefinementsByType(next, 'clarity');
      expect(clarity.length).toBe(1);
    });
  });

  describe('getRefinementsByCharacter', () => {
    it('should filter by character', () => {
      let next = addRefinement(state, 'r1', 'text', 'text', 'clarity', 'minor', 'reason', 0.8, 'alice');
      next = addRefinement(next, 'r2', 'text', 'text', 'clarity', 'minor', 'reason', 0.8, 'bob');
      const alice = getRefinementsByCharacter(next, 'alice');
      expect(alice.length).toBe(1);
    });
  });

  describe('getVoiceByCharacter', () => {
    it('should return voice', () => {
      let next = defineVoice(state, 'v1', 'alice', [], [], [], 0.5, 0.5);
      const voice = getVoiceByCharacter(next, 'alice');
      expect(voice?.voiceId).toBe('v1');
    });

    it('should return null for unknown character', () => {
      const voice = getVoiceByCharacter(state, 'unknown');
      expect(voice).toBeNull();
    });
  });

  describe('checkVoiceConsistency', () => {
    it('should return consistent for no voice defined', () => {
      const result = checkVoiceConsistency(state, 'alice', 'Hello world');
      expect(result.consistent).toBe(true);
    });

    it('should detect avoidance violations', () => {
      let next = defineVoice(state, 'v1', 'alice', [], ['hello'], [], 0.5, 0.5);
      const result = checkVoiceConsistency(next, 'alice', 'Hello there');
      expect(result.consistent).toBe(false);
    });

    it('should return consistent when no violations', () => {
      let next = defineVoice(state, 'v1', 'alice', [], ['hello'], [], 0.5, 0.5);
      const result = checkVoiceConsistency(next, 'alice', 'Good morning');
      expect(result.consistent).toBe(true);
    });
  });

  describe('getRefinementReport', () => {
    it('should return comprehensive report', () => {
      const report = getRefinementReport(state);
      expect(report.totalRefinements).toBe(0);
      expect(typeof report.averageQualityScore).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getRefinementReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetDialogueRefinementState', () => {
    it('should reset all state', () => {
      let next = addRefinement(state, 'r1', 'text', 'text', 'clarity', 'minor', 'reason', 0.8, 'alice');
      next = resetDialogueRefinementState();
      expect(next.refinements.size).toBe(0);
      expect(next.totalRefinements).toBe(0);
    });
  });
});