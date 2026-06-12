/**
 * V1415 NarrativeCharacterTemperamentEngine Tests — Direction K Iter 25/30 (Round 5)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCharacterTemperamentEngineState,
  addCharacterTemperamentEntry,
  addCharacterTemperamentProfile,
  getCharacterTemperamentEntriesByTemperament,
  getCharacterTemperamentReport,
  resetNarrativeCharacterTemperamentEngineState,
  type NarrativeCharacterTemperamentEngineState,
} from './NarrativeCharacterTemperamentEngine';

describe('NarrativeCharacterTemperamentEngine', () => {
  let state: NarrativeCharacterTemperamentEngineState;
  beforeEach(() => { state = createNarrativeCharacterTemperamentEngineState(); });
  it('should initialize with defaults', () => { expect(state.entries.size).toBe(0); expect(state.profiles.size).toBe(0); });
  it('should add entry', () => { const next = addCharacterTemperamentEntry(state, 'e1', 'infinite', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); expect(next.entries.size).toBe(1); });
  it('should add profile', () => { let next = addCharacterTemperamentEntry(state, 'e1', 'infinite', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); next = addCharacterTemperamentProfile(next, 'p1', ['e1']); expect(next.totalProfiles).toBe(1); });
  it('should filter by temperament', () => { let next = addCharacterTemperamentEntry(state, 'e1', 'infinite', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); next = addCharacterTemperamentEntry(next, 'e2', 'sanguine', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); expect(getCharacterTemperamentEntriesByTemperament(next, 'infinite').length).toBe(1); });
  it('should return comprehensive report', () => { const report = getCharacterTemperamentReport(state); expect(report.totalEntries).toBe(0); expect(typeof report.characterTemperamentMastery).toBe('number'); });
  it('should include recommendations for empty state', () => { expect(getCharacterTemperamentReport(state).recommendations.length).toBeGreaterThan(0); });
  it('should reset all state', () => { let next = addCharacterTemperamentEntry(state, 'e1', 'infinite', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); next = resetNarrativeCharacterTemperamentEngineState(); expect(next.entries.size).toBe(0); });
});