/**
 * V669 DialogueOrchestrationEngine Tests — Direction C Iter 2/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDialogueOrchestrationState,
  registerCharacterVoice,
  addDialogueLine,
  getExchangesByType,
  getCharacterDialogues,
  getDialogueFlow,
  analyzeSubtext,
  getDialogueReport,
  resetDialogueOrchestrationState,
  type DialogueOrchestrationState,
  type DialogueLine,
} from './DialogueOrchestrationEngine';

function makeLine(id: string, speakerId: string, subtext: number = 0.5, weight: number = 0.5, timestamp: number = 0): DialogueLine {
  return {
    lineId: id,
    speaker: 'protagonist',
    speakerId,
    text: `Line ${id}`,
    subtext,
    emotionalWeight: weight,
    type: 'exposition',
    timestamp,
  };
}

describe('DialogueOrchestrationEngine', () => {
  let state: DialogueOrchestrationState;

  beforeEach(() => { state = createDialogueOrchestrationState(); });

  describe('createDialogueOrchestrationState', () => {
    it('should initialize with defaults', () => {
      expect(state.exchanges.size).toBe(0);
      expect(state.activeCharacters.size).toBe(0);
      expect(state.totalLines).toBe(0);
    });

    it('should have default subtext', () => {
      expect(state.averageSubtext).toBe(0.5);
    });
  });

  describe('registerCharacterVoice', () => {
    it('should register character', () => {
      const next = registerCharacterVoice(state, 'alice', 'protagonist');
      expect(next.characterVoices.size).toBe(1);
      expect(next.characterVoices.get('alice')).toBe('protagonist');
    });
  });

  describe('addDialogueLine', () => {
    it('should add line to new exchange', () => {
      const next = addDialogueLine(state, 'ex1', makeLine('l1', 'alice', 0.7, 0.6, 100), 'exposition');
      expect(next.exchanges.size).toBe(1);
      expect(next.totalLines).toBe(1);
    });

    it('should add line to existing exchange', () => {
      let next = addDialogueLine(state, 'ex1', makeLine('l1', 'alice', 0.7, 0.6, 100), 'exposition');
      next = addDialogueLine(next, 'ex1', makeLine('l2', 'bob', 0.5, 0.5, 200), 'exposition');
      const exchange = next.exchanges.get('ex1');
      expect(exchange?.lines.length).toBe(2);
    });

    it('should track active characters', () => {
      let next = addDialogueLine(state, 'ex1', makeLine('l1', 'alice', 0.5, 0.5, 100), 'exposition');
      next = addDialogueLine(next, 'ex2', makeLine('l2', 'bob', 0.5, 0.5, 200), 'conflict');
      expect(next.activeCharacters.size).toBe(2);
    });

    it('should track emotional arc', () => {
      let next = addDialogueLine(state, 'ex1', makeLine('l1', 'alice', 0.5, 0.7, 100), 'exposition');
      next = addDialogueLine(next, 'ex1', makeLine('l2', 'bob', 0.5, 0.3, 200), 'exposition');
      const exchange = next.exchanges.get('ex1');
      expect(exchange?.emotionalArc).toEqual([0.7, 0.3]);
    });
  });

  describe('getExchangesByType', () => {
    it('should filter by type', () => {
      let next = addDialogueLine(state, 'ex1', makeLine('l1', 'alice', 0.5, 0.5, 100), 'conflict');
      next = addDialogueLine(next, 'ex2', makeLine('l2', 'bob', 0.5, 0.5, 200), 'bonding');
      const conflicts = getExchangesByType(next, 'conflict');
      expect(conflicts.length).toBe(1);
    });
  });

  describe('getCharacterDialogues', () => {
    it('should return lines for character', () => {
      let next = addDialogueLine(state, 'ex1', makeLine('l1', 'alice', 0.5, 0.5, 100), 'exposition');
      next = addDialogueLine(next, 'ex1', makeLine('l2', 'bob', 0.5, 0.5, 200), 'exposition');
      next = addDialogueLine(next, 'ex1', makeLine('l3', 'alice', 0.5, 0.5, 300), 'exposition');
      const aliceLines = getCharacterDialogues(next, 'alice');
      expect(aliceLines.length).toBe(2);
    });

    it('should return empty for unknown character', () => {
      const lines = getCharacterDialogues(state, 'unknown');
      expect(lines).toEqual([]);
    });
  });

  describe('getDialogueFlow', () => {
    it('should return lines in timestamp order', () => {
      let next = addDialogueLine(state, 'ex1', makeLine('l1', 'alice', 0.5, 0.5, 300), 'exposition');
      next = addDialogueLine(next, 'ex1', makeLine('l2', 'bob', 0.5, 0.5, 100), 'exposition');
      const flow = getDialogueFlow(next);
      expect(flow[0]?.timestamp).toBe(100);
    });
  });

  describe('analyzeSubtext', () => {
    it('should analyze subtext distribution', () => {
      let next = addDialogueLine(state, 'ex1', makeLine('l1', 'alice', 0.9, 0.5, 100), 'exposition');
      next = addDialogueLine(next, 'ex1', makeLine('l2', 'bob', 0.1, 0.5, 200), 'exposition');
      const result = analyzeSubtext(next);
      expect(result.highSubtext).toBe(1);
      expect(result.lowSubtext).toBe(1);
    });

    it('should return empty analysis for no lines', () => {
      const result = analyzeSubtext(state);
      expect(result.average).toBe(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('getDialogueReport', () => {
    it('should return comprehensive report', () => {
      const report = getDialogueReport(state);
      expect(typeof report.totalLines).toBe('number');
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should recommend multi-character scenes', () => {
      let next = addDialogueLine(state, 'ex1', makeLine('l1', 'alice', 0.5, 0.5, 100), 'exposition');
      const report = getDialogueReport(next);
      expect(report.recommendations.some(r => r.includes('multi-character'))).toBe(true);
    });
  });

  describe('resetDialogueOrchestrationState', () => {
    it('should reset all state', () => {
      let next = addDialogueLine(state, 'ex1', makeLine('l1', 'alice', 0.5, 0.5, 100), 'exposition');
      next = resetDialogueOrchestrationState();
      expect(next.exchanges.size).toBe(0);
      expect(next.totalLines).toBe(0);
    });
  });
});