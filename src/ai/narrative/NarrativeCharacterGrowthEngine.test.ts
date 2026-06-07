/**
 * V1389 NarrativeCharacterGrowthEngine Tests — Direction K Iter 12/30 (Round 5)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCharacterGrowthEngineState,
  addCharacterGrowthEntry,
  addCharacterGrowthCurve,
  getCharacterGrowthEntriesByAspect,
  getCharacterGrowthReport,
  resetNarrativeCharacterGrowthEngineState,
  type NarrativeCharacterGrowthEngineState,
} from './NarrativeCharacterGrowthEngine';

describe('NarrativeCharacterGrowthEngine', () => {
  let state: NarrativeCharacterGrowthEngineState;
  beforeEach(() => { state = createNarrativeCharacterGrowthEngineState(); });
  it('should initialize with defaults', () => { expect(state.entries.size).toBe(0); expect(state.curves.size).toBe(0); });
  it('should add entry', () => { const next = addCharacterGrowthEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); expect(next.entries.size).toBe(1); });
  it('should add curve', () => { let next = addCharacterGrowthEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); next = addCharacterGrowthCurve(next, 'c1', ['e1']); expect(next.totalCurves).toBe(1); });
  it('should filter by aspect', () => { let next = addCharacterGrowthEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); next = addCharacterGrowthEntry(next, 'e2', 'skill', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); expect(getCharacterGrowthEntriesByAspect(next, 'transcendent').length).toBe(1); });
  it('should return comprehensive report', () => { const report = getCharacterGrowthReport(state); expect(report.totalEntries).toBe(0); expect(typeof report.characterGrowthMastery).toBe('number'); });
  it('should include recommendations for empty state', () => { expect(getCharacterGrowthReport(state).recommendations.length).toBeGreaterThan(0); });
  it('should reset all state', () => { let next = addCharacterGrowthEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); next = resetNarrativeCharacterGrowthEngineState(); expect(next.entries.size).toBe(0); });
});