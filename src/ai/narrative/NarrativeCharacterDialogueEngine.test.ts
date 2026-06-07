/**
 * V1381 NarrativeCharacterDialogueEngine Tests — Direction K Iter 8/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCharacterDialogueEngineState,
  addCharacterDialogueEntry,
  addCharacterDialogueExchange,
  getCharacterDialogueEntriesByFunction,
  getCharacterDialogueReport,
  resetNarrativeCharacterDialogueEngineState,
  type NarrativeCharacterDialogueEngineState,
} from './NarrativeCharacterDialogueEngine';

describe('NarrativeCharacterDialogueEngine', () => {
  let state: NarrativeCharacterDialogueEngineState;

  beforeEach(() => { state = createNarrativeCharacterDialogueEngineState(); });

  describe('createNarrativeCharacterDialogueEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.exchanges.size).toBe(0);
    });
  });

  describe('addCharacterDialogueEntry', () => {
    it('should add entry', () => {
      const next = addCharacterDialogueEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addCharacterDialogueExchange', () => {
    it('should add exchange', () => {
      let next = addCharacterDialogueEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addCharacterDialogueExchange(next, 'x1', ['e1']);
      expect(next.totalExchanges).toBe(1);
    });
  });

  describe('getCharacterDialogueEntriesByFunction', () => {
    it('should filter by function', () => {
      let next = addCharacterDialogueEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addCharacterDialogueEntry(next, 'e2', 'reveal', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getCharacterDialogueEntriesByFunction(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getCharacterDialogueReport', () => {
    it('should return comprehensive report', () => {
      const report = getCharacterDialogueReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.characterDialogueMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCharacterDialogueReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeCharacterDialogueEngineState', () => {
    it('should reset all state', () => {
      let next = addCharacterDialogueEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeCharacterDialogueEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});