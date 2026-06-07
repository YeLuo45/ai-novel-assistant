/**
 * V1397 NarrativeCharacterFearEngine Tests — Direction K Iter 16/30 (Round 5)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCharacterFearEngineState,
  addCharacterFearEntry,
  addCharacterFearShadow,
  getCharacterFearEntriesByType,
  getCharacterFearReport,
  resetNarrativeCharacterFearEngineState,
  type NarrativeCharacterFearEngineState,
} from './NarrativeCharacterFearEngine';

describe('NarrativeCharacterFearEngine', () => {
  let state: NarrativeCharacterFearEngineState;
  beforeEach(() => { state = createNarrativeCharacterFearEngineState(); });
  it('should initialize with defaults', () => { expect(state.entries.size).toBe(0); expect(state.shadows.size).toBe(0); });
  it('should add entry', () => { const next = addCharacterFearEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); expect(next.entries.size).toBe(1); });
  it('should add shadow', () => { let next = addCharacterFearEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); next = addCharacterFearShadow(next, 's1', ['e1']); expect(next.totalShadows).toBe(1); });
  it('should filter by type', () => { let next = addCharacterFearEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); next = addCharacterFearEntry(next, 'e2', 'physical', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); expect(getCharacterFearEntriesByType(next, 'transcendent').length).toBe(1); });
  it('should return comprehensive report', () => { const report = getCharacterFearReport(state); expect(report.totalEntries).toBe(0); expect(typeof report.characterFearMastery).toBe('number'); });
  it('should include recommendations for empty state', () => { expect(getCharacterFearReport(state).recommendations.length).toBeGreaterThan(0); });
  it('should reset all state', () => { let next = addCharacterFearEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); next = resetNarrativeCharacterFearEngineState(); expect(next.entries.size).toBe(0); });
});