/**
 * V1383 NarrativeCharacterBackstoryEngine Tests — Direction K Iter 9/30 (Round 5)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCharacterBackstoryEngineState,
  addCharacterBackstoryEntry,
  addCharacterBackstoryChronicle,
  getCharacterBackstoryEntriesByLayer,
  getCharacterBackstoryReport,
  resetNarrativeCharacterBackstoryEngineState,
  type NarrativeCharacterBackstoryEngineState,
} from './NarrativeCharacterBackstoryEngine';

describe('NarrativeCharacterBackstoryEngine', () => {
  let state: NarrativeCharacterBackstoryEngineState;
  beforeEach(() => { state = createNarrativeCharacterBackstoryEngineState(); });

  it('should initialize with defaults', () => {
    expect(state.entries.size).toBe(0);
    expect(state.chronicles.size).toBe(0);
  });

  it('should add entry', () => {
    const next = addCharacterBackstoryEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
    expect(next.entries.size).toBe(1);
  });

  it('should add chronicle', () => {
    let next = addCharacterBackstoryEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
    next = addCharacterBackstoryChronicle(next, 'c1', ['e1']);
    expect(next.totalChronicles).toBe(1);
  });

  it('should filter by layer', () => {
    let next = addCharacterBackstoryEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
    next = addCharacterBackstoryEntry(next, 'e2', 'childhood', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
    expect(getCharacterBackstoryEntriesByLayer(next, 'transcendent').length).toBe(1);
  });

  it('should return comprehensive report', () => {
    const report = getCharacterBackstoryReport(state);
    expect(report.totalEntries).toBe(0);
    expect(typeof report.characterBackstoryMastery).toBe('number');
  });

  it('should include recommendations for empty state', () => {
    expect(getCharacterBackstoryReport(state).recommendations.length).toBeGreaterThan(0);
  });

  it('should reset all state', () => {
    let next = addCharacterBackstoryEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
    next = resetNarrativeCharacterBackstoryEngineState();
    expect(next.entries.size).toBe(0);
  });
});