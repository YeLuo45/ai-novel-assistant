/**
 * V1367 NarrativeCharacterVoiceEngine Tests — Direction K Iter 1/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCharacterVoiceEngineState,
  addCharacterVoiceEntry,
  addCharacterVoiceProfile,
  getCharacterVoiceEntriesByTone,
  getCharacterVoiceReport,
  resetNarrativeCharacterVoiceEngineState,
  type NarrativeCharacterVoiceEngineState,
} from './NarrativeCharacterVoiceEngine';

describe('NarrativeCharacterVoiceEngine', () => {
  let state: NarrativeCharacterVoiceEngineState;

  beforeEach(() => { state = createNarrativeCharacterVoiceEngineState(); });

  describe('createNarrativeCharacterVoiceEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.profiles.size).toBe(0);
    });
  });

  describe('addCharacterVoiceEntry', () => {
    it('should add entry', () => {
      const next = addCharacterVoiceEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addCharacterVoiceProfile', () => {
    it('should add profile', () => {
      let next = addCharacterVoiceEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addCharacterVoiceProfile(next, 'p1', ['e1']);
      expect(next.totalProfiles).toBe(1);
    });
  });

  describe('getCharacterVoiceEntriesByTone', () => {
    it('should filter by tone', () => {
      let next = addCharacterVoiceEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addCharacterVoiceEntry(next, 'e2', 'whisper', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getCharacterVoiceEntriesByTone(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getCharacterVoiceReport', () => {
    it('should return comprehensive report', () => {
      const report = getCharacterVoiceReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.characterVoiceMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCharacterVoiceReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeCharacterVoiceEngineState', () => {
    it('should reset all state', () => {
      let next = addCharacterVoiceEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeCharacterVoiceEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});