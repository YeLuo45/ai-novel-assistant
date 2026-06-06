/**
 * V1011 NarrativeDialogueTagEngine Tests — Direction B Iter 8/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeDialogueTagEngineState,
  addDialogueTag,
  createDialogueExchange,
  getDialogueTagsByType,
  getDialogueTagReport,
  resetNarrativeDialogueTagEngineState,
  type NarrativeDialogueTagEngineState,
} from './NarrativeDialogueTagEngine';

describe('NarrativeDialogueTagEngine', () => {
  let state: NarrativeDialogueTagEngineState;

  beforeEach(() => { state = createNarrativeDialogueTagEngineState(); });

  describe('createNarrativeDialogueTagEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.tags.size).toBe(0);
      expect(state.exchanges.size).toBe(0);
    });
  });

  describe('addDialogueTag', () => {
    it('should add tag', () => {
      const next = addDialogueTag(state, 't1', 'said', 'before', 'good', 'said', 'context', 0.7, 0.8, 1);
      expect(next.tags.size).toBe(1);
      expect(next.totalTags).toBe(1);
    });
  });

  describe('createDialogueExchange', () => {
    it('should create exchange', () => {
      let next = addDialogueTag(state, 't1', 'said', 'before', 'good', 'said', 'context', 0.7, 0.8, 1);
      next = createDialogueExchange(next, 'e1', 'c1', 'c2', ['t1']);
      expect(next.totalExchanges).toBe(1);
    });
  });

  describe('getDialogueTagsByType', () => {
    it('should filter by type', () => {
      let next = addDialogueTag(state, 't1', 'said', 'before', 'good', 'said', 'context', 0.7, 0.8, 1);
      next = addDialogueTag(next, 't2', 'whispered', 'after', 'good', 'whispered', 'context', 0.7, 0.8, 1);
      const said = getDialogueTagsByType(next, 'said');
      expect(said.length).toBe(1);
    });
  });

  describe('getDialogueTagReport', () => {
    it('should return comprehensive report', () => {
      const report = getDialogueTagReport(state);
      expect(report.totalTags).toBe(0);
      expect(typeof report.dialogueTagMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getDialogueTagReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeDialogueTagEngineState', () => {
    it('should reset all state', () => {
      let next = addDialogueTag(state, 't1', 'said', 'before', 'good', 'said', 'context', 0.7, 0.8, 1);
      next = resetNarrativeDialogueTagEngineState();
      expect(next.tags.size).toBe(0);
      expect(next.totalTags).toBe(0);
    });
  });
});