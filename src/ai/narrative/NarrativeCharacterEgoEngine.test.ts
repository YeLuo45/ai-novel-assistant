/**
 * V1407 NarrativeCharacterEgoEngine Tests — Direction K Iter 21/30 (Round 5)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCharacterEgoEngineState,
  addCharacterEgoEntry,
  addCharacterEgoMap,
  getCharacterEgoEntriesByFunction,
  getCharacterEgoReport,
  resetNarrativeCharacterEgoEngineState,
  type NarrativeCharacterEgoEngineState,
} from './NarrativeCharacterEgoEngine';

describe('NarrativeCharacterEgoEngine', () => {
  let state: NarrativeCharacterEgoEngineState;
  beforeEach(() => { state = createNarrativeCharacterEgoEngineState(); });
  it('should initialize with defaults', () => { expect(state.entries.size).toBe(0); expect(state.maps.size).toBe(0); });
  it('should add entry', () => { const next = addCharacterEgoEntry(state, 'e1', 'absolute', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); expect(next.entries.size).toBe(1); });
  it('should add map', () => { let next = addCharacterEgoEntry(state, 'e1', 'absolute', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); next = addCharacterEgoMap(next, 'm1', ['e1']); expect(next.totalMaps).toBe(1); });
  it('should filter by function', () => { let next = addCharacterEgoEntry(state, 'e1', 'absolute', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); next = addCharacterEgoEntry(next, 'e2', 'reality_testing', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); expect(getCharacterEgoEntriesByFunction(next, 'absolute').length).toBe(1); });
  it('should return comprehensive report', () => { const report = getCharacterEgoReport(state); expect(report.totalEntries).toBe(0); expect(typeof report.characterEgoMastery).toBe('number'); });
  it('should include recommendations for empty state', () => { expect(getCharacterEgoReport(state).recommendations.length).toBeGreaterThan(0); });
  it('should reset all state', () => { let next = addCharacterEgoEntry(state, 'e1', 'absolute', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); next = resetNarrativeCharacterEgoEngineState(); expect(next.entries.size).toBe(0); });
});