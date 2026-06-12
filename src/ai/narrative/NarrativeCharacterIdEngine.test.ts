/**
 * V1411 NarrativeCharacterIdEngine Tests — Direction K Iter 23/30 (Round 5)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCharacterIdEngineState,
  addCharacterIdEntry,
  addCharacterIdStream,
  getCharacterIdEntriesByDrive,
  getCharacterIdReport,
  resetNarrativeCharacterIdEngineState,
  type NarrativeCharacterIdEngineState,
} from './NarrativeCharacterIdEngine';

describe('NarrativeCharacterIdEngine', () => {
  let state: NarrativeCharacterIdEngineState;
  beforeEach(() => { state = createNarrativeCharacterIdEngineState(); });
  it('should initialize with defaults', () => { expect(state.entries.size).toBe(0); expect(state.streams.size).toBe(0); });
  it('should add entry', () => { const next = addCharacterIdEntry(state, 'e1', 'transcendent', 'transcendent', 'infinite', 'desc', 0.95, 0.9, 1); expect(next.entries.size).toBe(1); });
  it('should add stream', () => { let next = addCharacterIdEntry(state, 'e1', 'transcendent', 'transcendent', 'infinite', 'desc', 0.95, 0.9, 1); next = addCharacterIdStream(next, 's1', ['e1']); expect(next.totalStreams).toBe(1); });
  it('should filter by drive', () => { let next = addCharacterIdEntry(state, 'e1', 'transcendent', 'transcendent', 'infinite', 'desc', 0.95, 0.9, 1); next = addCharacterIdEntry(next, 'e2', 'survival', 'transcendent', 'infinite', 'desc', 0.95, 0.9, 1); expect(getCharacterIdEntriesByDrive(next, 'transcendent').length).toBe(1); });
  it('should return comprehensive report', () => { const report = getCharacterIdReport(state); expect(report.totalEntries).toBe(0); expect(typeof report.characterIdMastery).toBe('number'); });
  it('should include recommendations for empty state', () => { expect(getCharacterIdReport(state).recommendations.length).toBeGreaterThan(0); });
  it('should reset all state', () => { let next = addCharacterIdEntry(state, 'e1', 'transcendent', 'transcendent', 'infinite', 'desc', 0.95, 0.9, 1); next = resetNarrativeCharacterIdEngineState(); expect(next.entries.size).toBe(0); });
});