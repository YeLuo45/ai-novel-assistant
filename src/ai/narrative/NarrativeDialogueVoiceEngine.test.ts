/**
 * V1153 NarrativeDialogueVoiceEngine Tests — Direction F Iter 4/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeDialogueVoiceEngineState,
  addDialogueVoice,
  addDialogueVoicePattern,
  getDialogueVoicesByType,
  getDialogueVoiceReport,
  resetNarrativeDialogueVoiceEngineState,
  type NarrativeDialogueVoiceEngineState,
} from './NarrativeDialogueVoiceEngine';

describe('NarrativeDialogueVoiceEngine', () => {
  let state: NarrativeDialogueVoiceEngineState;

  beforeEach(() => { state = createNarrativeDialogueVoiceEngineState(); });

  describe('createNarrativeDialogueVoiceEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.voices.size).toBe(0);
      expect(state.patterns.size).toBe(0);
    });
  });

  describe('addDialogueVoice', () => {
    it('should add voice', () => {
      const next = addDialogueVoice(state, 'v1', 'natural', 'unmistakable', 'authentic', 'desc', 0.9, 0.85, 1);
      expect(next.voices.size).toBe(1);
      expect(next.totalVoices).toBe(1);
    });
  });

  describe('addDialogueVoicePattern', () => {
    it('should add pattern', () => {
      let next = addDialogueVoice(state, 'v1', 'natural', 'unmistakable', 'authentic', 'desc', 0.9, 0.85, 1);
      next = addDialogueVoicePattern(next, 'p1', ['v1']);
      expect(next.totalPatterns).toBe(1);
    });
  });

  describe('getDialogueVoicesByType', () => {
    it('should filter by type', () => {
      let next = addDialogueVoice(state, 'v1', 'natural', 'unmistakable', 'authentic', 'desc', 0.9, 0.85, 1);
      next = addDialogueVoice(next, 'v2', 'formal', 'unmistakable', 'authentic', 'desc', 0.9, 0.85, 1);
      const natural = getDialogueVoicesByType(next, 'natural');
      expect(natural.length).toBe(1);
    });
  });

  describe('getDialogueVoiceReport', () => {
    it('should return comprehensive report', () => {
      const report = getDialogueVoiceReport(state);
      expect(report.totalVoices).toBe(0);
      expect(typeof report.dialogueVoiceMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getDialogueVoiceReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeDialogueVoiceEngineState', () => {
    it('should reset all state', () => {
      let next = addDialogueVoice(state, 'v1', 'natural', 'unmistakable', 'authentic', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeDialogueVoiceEngineState();
      expect(next.voices.size).toBe(0);
      expect(next.totalVoices).toBe(0);
    });
  });
});