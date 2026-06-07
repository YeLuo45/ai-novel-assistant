/**
 * V1393 NarrativeCharacterMemoryEngine Tests — Direction K Iter 14/30 (Round 5)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCharacterMemoryEngineState,
  addCharacterMemoryEntry,
  addCharacterMemoryBank,
  getCharacterMemoryEntriesByType,
  getCharacterMemoryReport,
  resetNarrativeCharacterMemoryEngineState,
  type NarrativeCharacterMemoryEngineState,
} from './NarrativeCharacterMemoryEngine';

describe('NarrativeCharacterMemoryEngine', () => {
  let state: NarrativeCharacterMemoryEngineState;
  beforeEach(() => { state = createNarrativeCharacterMemoryEngineState(); });
  it('should initialize with defaults', () => { expect(state.entries.size).toBe(0); expect(state.banks.size).toBe(0); });
  it('should add entry', () => { const next = addCharacterMemoryEntry(state, 'e1', 'transcendent', 'transcendent', 'absolute', 'desc', 0.95, 0.9, 1); expect(next.entries.size).toBe(1); });
  it('should add bank', () => { let next = addCharacterMemoryEntry(state, 'e1', 'transcendent', 'transcendent', 'absolute', 'desc', 0.95, 0.9, 1); next = addCharacterMemoryBank(next, 'b1', ['e1']); expect(next.totalBanks).toBe(1); });
  it('should filter by type', () => { let next = addCharacterMemoryEntry(state, 'e1', 'transcendent', 'transcendent', 'absolute', 'desc', 0.95, 0.9, 1); next = addCharacterMemoryEntry(next, 'e2', 'episodic', 'transcendent', 'absolute', 'desc', 0.95, 0.9, 1); expect(getCharacterMemoryEntriesByType(next, 'transcendent').length).toBe(1); });
  it('should return comprehensive report', () => { const report = getCharacterMemoryReport(state); expect(report.totalEntries).toBe(0); expect(typeof report.characterMemoryMastery).toBe('number'); });
  it('should include recommendations for empty state', () => { expect(getCharacterMemoryReport(state).recommendations.length).toBeGreaterThan(0); });
  it('should reset all state', () => { let next = addCharacterMemoryEntry(state, 'e1', 'transcendent', 'transcendent', 'absolute', 'desc', 0.95, 0.9, 1); next = resetNarrativeCharacterMemoryEngineState(); expect(next.entries.size).toBe(0); });
});