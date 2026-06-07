/**
 * V1405 NarrativeCharacterShadowEngine Tests — Direction K Iter 20/30 (Round 5)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCharacterShadowEngineState,
  addCharacterShadowEntry,
  addCharacterShadowProfile,
  getCharacterShadowEntriesByAspect,
  getCharacterShadowReport,
  resetNarrativeCharacterShadowEngineState,
  type NarrativeCharacterShadowEngineState,
} from './NarrativeCharacterShadowEngine';

describe('NarrativeCharacterShadowEngine', () => {
  let state: NarrativeCharacterShadowEngineState;
  beforeEach(() => { state = createNarrativeCharacterShadowEngineState(); });
  it('should initialize with defaults', () => { expect(state.entries.size).toBe(0); expect(state.profiles.size).toBe(0); });
  it('should add entry', () => { const next = addCharacterShadowEntry(state, 'e1', 'absolute', 'transcendent', 'infinite', 'desc', 0.95, 0.9, 1); expect(next.entries.size).toBe(1); });
  it('should add profile', () => { let next = addCharacterShadowEntry(state, 'e1', 'absolute', 'transcendent', 'infinite', 'desc', 0.95, 0.9, 1); next = addCharacterShadowProfile(next, 'p1', ['e1']); expect(next.totalProfiles).toBe(1); });
  it('should filter by aspect', () => { let next = addCharacterShadowEntry(state, 'e1', 'absolute', 'transcendent', 'infinite', 'desc', 0.95, 0.9, 1); next = addCharacterShadowEntry(next, 'e2', 'repressed', 'transcendent', 'infinite', 'desc', 0.95, 0.9, 1); expect(getCharacterShadowEntriesByAspect(next, 'absolute').length).toBe(1); });
  it('should return comprehensive report', () => { const report = getCharacterShadowReport(state); expect(report.totalEntries).toBe(0); expect(typeof report.characterShadowMastery).toBe('number'); });
  it('should include recommendations for empty state', () => { expect(getCharacterShadowReport(state).recommendations.length).toBeGreaterThan(0); });
  it('should reset all state', () => { let next = addCharacterShadowEntry(state, 'e1', 'absolute', 'transcendent', 'infinite', 'desc', 0.95, 0.9, 1); next = resetNarrativeCharacterShadowEngineState(); expect(next.entries.size).toBe(0); });
});