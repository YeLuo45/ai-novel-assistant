/**
 * V855 DialogueMasteryEngine Tests — Direction B Iter 5/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDialogueMasteryEngineState,
  addDialogueLine,
  setLineVoiceConsistency,
  createDialogueExchange,
  completeDialogueExchange,
  getLinesBySpeaker,
  getDialogueMasteryReport,
  resetDialogueMasteryEngineState,
  type DialogueMasteryEngineState,
} from './DialogueMasteryEngine';

describe('DialogueMasteryEngine', () => {
  let state: DialogueMasteryEngineState;

  beforeEach(() => { state = createDialogueMasteryEngineState(); });

  describe('createDialogueMasteryEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.lines.size).toBe(0);
      expect(state.exchanges.size).toBe(0);
    });
  });

  describe('addDialogueLine', () => {
    it('should add line', () => {
      const next = addDialogueLine(state, 'l1', 's1', 'Hello world', 'direct', 'good');
      expect(next.lines.size).toBe(1);
      expect(next.totalLines).toBe(1);
    });
  });

  describe('setLineVoiceConsistency', () => {
    it('should set consistency', () => {
      let next = addDialogueLine(state, 'l1', 's1', 'text');
      next = setLineVoiceConsistency(next, 'l1', 'perfect');
      expect(next.lines.get('l1')?.voiceConsistency).toBe('perfect');
    });
  });

  describe('createDialogueExchange', () => {
    it('should create exchange', () => {
      let next = addDialogueLine(state, 'l1', 's1', 'text');
      next = createDialogueExchange(next, 'e1', ['s1', 's2'], ['l1'], 'tense', 0.7);
      expect(next.totalExchanges).toBe(1);
    });
  });

  describe('completeDialogueExchange', () => {
    it('should complete', () => {
      let next = createDialogueExchange(state, 'e1', ['s1'], [], 'dynamic', 0.7);
      next = completeDialogueExchange(next, 'e1');
      expect(next.exchanges.get('e1')?.completed).toBe(true);
    });
  });

  describe('getLinesBySpeaker', () => {
    it('should filter by speaker', () => {
      let next = addDialogueLine(state, 'l1', 's1', 'text');
      next = addDialogueLine(next, 'l2', 's2', 'text');
      const s1Lines = getLinesBySpeaker(next, 's1');
      expect(s1Lines.length).toBe(1);
    });
  });

  describe('getDialogueMasteryReport', () => {
    it('should return comprehensive report', () => {
      const report = getDialogueMasteryReport(state);
      expect(report.totalLines).toBe(0);
      expect(typeof report.dialogueMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getDialogueMasteryReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetDialogueMasteryEngineState', () => {
    it('should reset all state', () => {
      let next = addDialogueLine(state, 'l1', 's1', 'text');
      next = resetDialogueMasteryEngineState();
      expect(next.lines.size).toBe(0);
      expect(next.totalLines).toBe(0);
    });
  });
});