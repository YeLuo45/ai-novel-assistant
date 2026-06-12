/**
 * V1413 NarrativeCharacterPersonaEngine Tests — Direction K Iter 24/30 (Round 5)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCharacterPersonaEngineState,
  addCharacterPersonaEntry,
  addCharacterPersonaSet,
  getCharacterPersonaEntriesByRole,
  getCharacterPersonaReport,
  resetNarrativeCharacterPersonaEngineState,
  type NarrativeCharacterPersonaEngineState,
} from './NarrativeCharacterPersonaEngine';

describe('NarrativeCharacterPersonaEngine', () => {
  let state: NarrativeCharacterPersonaEngineState;
  beforeEach(() => { state = createNarrativeCharacterPersonaEngineState(); });
  it('should initialize with defaults', () => { expect(state.entries.size).toBe(0); expect(state.sets.size).toBe(0); });
  it('should add entry', () => { const next = addCharacterPersonaEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); expect(next.entries.size).toBe(1); });
  it('should add set', () => { let next = addCharacterPersonaEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); next = addCharacterPersonaSet(next, 's1', ['e1']); expect(next.totalSets).toBe(1); });
  it('should filter by role', () => { let next = addCharacterPersonaEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); next = addCharacterPersonaEntry(next, 'e2', 'parent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); expect(getCharacterPersonaEntriesByRole(next, 'transcendent').length).toBe(1); });
  it('should return comprehensive report', () => { const report = getCharacterPersonaReport(state); expect(report.totalEntries).toBe(0); expect(typeof report.characterPersonaMastery).toBe('number'); });
  it('should include recommendations for empty state', () => { expect(getCharacterPersonaReport(state).recommendations.length).toBeGreaterThan(0); });
  it('should reset all state', () => { let next = addCharacterPersonaEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); next = resetNarrativeCharacterPersonaEngineState(); expect(next.entries.size).toBe(0); });
});