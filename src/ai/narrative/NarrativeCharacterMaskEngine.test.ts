/**
 * V1403 NarrativeCharacterMaskEngine Tests — Direction K Iter 19/30 (Round 5)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCharacterMaskEngineState,
  addCharacterMaskEntry,
  addCharacterMaskCollection,
  getCharacterMaskEntriesByType,
  getCharacterMaskReport,
  resetNarrativeCharacterMaskEngineState,
  type NarrativeCharacterMaskEngineState,
} from './NarrativeCharacterMaskEngine';

describe('NarrativeCharacterMaskEngine', () => {
  let state: NarrativeCharacterMaskEngineState;
  beforeEach(() => { state = createNarrativeCharacterMaskEngineState(); });
  it('should initialize with defaults', () => { expect(state.entries.size).toBe(0); expect(state.collections.size).toBe(0); });
  it('should add entry', () => { const next = addCharacterMaskEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); expect(next.entries.size).toBe(1); });
  it('should add collection', () => { let next = addCharacterMaskEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); next = addCharacterMaskCollection(next, 'c1', ['e1']); expect(next.totalCollections).toBe(1); });
  it('should filter by type', () => { let next = addCharacterMaskEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); next = addCharacterMaskEntry(next, 'e2', 'social', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); expect(getCharacterMaskEntriesByType(next, 'transcendent').length).toBe(1); });
  it('should return comprehensive report', () => { const report = getCharacterMaskReport(state); expect(report.totalEntries).toBe(0); expect(typeof report.characterMaskMastery).toBe('number'); });
  it('should include recommendations for empty state', () => { expect(getCharacterMaskReport(state).recommendations.length).toBeGreaterThan(0); });
  it('should reset all state', () => { let next = addCharacterMaskEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); next = resetNarrativeCharacterMaskEngineState(); expect(next.entries.size).toBe(0); });
});