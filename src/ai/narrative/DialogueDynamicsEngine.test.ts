/**
 * V771 DialogueDynamicsEngine Tests — Direction B Iter 8/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDialogueDynamicsEngineState,
  addDialogueLine,
  createDialogueExchange,
  addLineToExchange,
  endDialogueExchange,
  getLinesByFunction,
  getLinesBySpeaker,
  getDialogueDynamicsReport,
  resetDialogueDynamicsEngineState,
  type DialogueDynamicsEngineState,
} from './DialogueDynamicsEngine';

describe('DialogueDynamicsEngine', () => {
  let state: DialogueDynamicsEngineState;

  beforeEach(() => { state = createDialogueDynamicsEngineState(); });

  describe('createDialogueDynamicsEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.lines.size).toBe(0);
      expect(state.exchanges.size).toBe(0);
    });
  });

  describe('addDialogueLine', () => {
    it('should add line', () => {
      const next = addDialogueLine(state, 'l1', 'alice', 'Hello there', 'reveal_character', 'subtle subtext', 'subtle', 'measured');
      expect(next.lines.size).toBe(1);
      expect(next.totalLines).toBe(1);
    });

    it('should track function distribution', () => {
      let next = addDialogueLine(state, 'l1', 'alice', 'line', 'create_tension');
      next = addDialogueLine(next, 'l2', 'bob', 'line', 'humor');
      expect(next.functionDistribution.get('create_tension')).toBe(1);
      expect(next.functionDistribution.get('humor')).toBe(1);
    });
  });

  describe('createDialogueExchange', () => {
    it('should create exchange', () => {
      const next = createDialogueExchange(state, 'e1', ['alice', 'bob'], 'create_tension');
      expect(next.exchanges.size).toBe(1);
      expect(next.activeExchanges).toBe(1);
    });
  });

  describe('addLineToExchange', () => {
    it('should add line', () => {
      let next = createDialogueExchange(state, 'e1', ['alice'], 'reveal_character');
      next = addLineToExchange(next, 'e1', 'l1', 0.5);
      expect(next.exchanges.get('e1')?.lines.length).toBe(1);
    });

    it('should clamp tension', () => {
      let next = createDialogueExchange(state, 'e1', ['alice'], 'reveal_character');
      next = addLineToExchange(next, 'e1', 'l1', 1.5);
      expect(next.exchanges.get('e1')?.tension).toBe(1);
    });
  });

  describe('endDialogueExchange', () => {
    it('should end exchange', () => {
      let next = createDialogueExchange(state, 'e1', ['alice'], 'reveal_character');
      next = endDialogueExchange(next, 'e1', 0.8);
      expect(next.exchanges.get('e1')?.endTime).not.toBeNull();
      expect(next.activeExchanges).toBe(0);
    });
  });

  describe('getLinesByFunction', () => {
    it('should filter by function', () => {
      let next = addDialogueLine(state, 'l1', 'alice', 'line1', 'create_tension');
      next = addDialogueLine(next, 'l2', 'alice', 'line2', 'humor');
      const tensions = getLinesByFunction(next, 'create_tension');
      expect(tensions.length).toBe(1);
    });
  });

  describe('getLinesBySpeaker', () => {
    it('should filter by speaker', () => {
      let next = addDialogueLine(state, 'l1', 'alice', 'line1', 'reveal_character');
      next = addDialogueLine(next, 'l2', 'bob', 'line2', 'reveal_character');
      const aliceLines = getLinesBySpeaker(next, 'alice');
      expect(aliceLines.length).toBe(1);
    });
  });

  describe('getDialogueDynamicsReport', () => {
    it('should return comprehensive report', () => {
      const report = getDialogueDynamicsReport(state);
      expect(report.totalLines).toBe(0);
      expect(typeof report.dynamicScore).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getDialogueDynamicsReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetDialogueDynamicsEngineState', () => {
    it('should reset all state', () => {
      let next = addDialogueLine(state, 'l1', 'alice', 'line', 'reveal_character');
      next = resetDialogueDynamicsEngineState();
      expect(next.lines.size).toBe(0);
      expect(next.totalLines).toBe(0);
    });
  });
});