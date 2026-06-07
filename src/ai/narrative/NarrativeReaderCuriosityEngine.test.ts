/**
 * V1675 NarrativeReaderCuriosityEngine Tests — Direction P Iter 5/30 (Round 5)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createNarrativeReaderCuriosityEngineState, addReaderCuriosityEntry, addReaderCuriosityLoop, getReaderCuriosityEntriesByType, getReaderCuriosityReport, resetNarrativeReaderCuriosityEngineState, type NarrativeReaderCuriosityEngineState } from './NarrativeReaderCuriosityEngine';
describe('NarrativeReaderCuriosityEngine', () => {
  let state: NarrativeReaderCuriosityEngineState;
  beforeEach(() => { state = createNarrativeReaderCuriosityEngineState(); });
  it('should initialize with defaults', () => { expect(state.entries.size).toBe(0); expect(state.loops.size).toBe(0); });
  it('should add entry', () => { const next = addReaderCuriosityEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); expect(next.entries.size).toBe(1); });
  it('should add loop', () => { let next = addReaderCuriosityEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); next = addReaderCuriosityLoop(next, 'l1', ['e1']); expect(next.totalLoops).toBe(1); });
  it('should filter by type', () => { let next = addReaderCuriosityEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); next = addReaderCuriosityEntry(next, 'e2', 'mystery', 'infinite', 'desc', 0.95, 1); expect(getReaderCuriosityEntriesByType(next, 'infinite').length).toBe(1); });
  it('should return comprehensive report', () => { const report = getReaderCuriosityReport(state); expect(report.totalEntries).toBe(0); expect(typeof report.curiosityMastery).toBe('number'); });
  it('should include recommendations for empty state', () => { expect(getReaderCuriosityReport(state).recommendations.length).toBeGreaterThan(0); });
  it('should reset all state', () => { let next = addReaderCuriosityEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); next = resetNarrativeReaderCuriosityEngineState(); expect(next.entries.size).toBe(0); });
});