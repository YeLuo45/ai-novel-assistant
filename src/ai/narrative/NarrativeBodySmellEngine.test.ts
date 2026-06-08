/**
 * V2039 NarrativeBodySmellEngine Tests — Direction V Iter 7/30 (Round 5)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createNarrativeBodySmellEngineState, addBodySmellEntry, addBodySmellBouquet, getBodySmellEntriesByType, getBodySmellReport, resetNarrativeBodySmellEngineState, type NarrativeBodySmellEngineState } from './NarrativeBodySmellEngine';
describe('NarrativeBodySmellEngine', () => {
  let state: NarrativeBodySmellEngineState;
  beforeEach(() => { state = createNarrativeBodySmellEngineState(); });
  it('should initialize with defaults', () => { expect(state.entries.size).toBe(0); expect(state.bouquets.size).toBe(0); });
  it('should add entry', () => { const next = addBodySmellEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); expect(next.entries.size).toBe(1); });
  it('should add bouquet', () => { let next = addBodySmellEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); next = addBodySmellBouquet(next, 'b1', ['e1']); expect(next.totalBouquets).toBe(1); });
  it('should filter by type', () => { let next = addBodySmellEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); next = addBodySmellEntry(next, 'e2', 'floral', 'infinite', 'desc', 0.95, 1); expect(getBodySmellEntriesByType(next, 'infinite').length).toBe(1); });
  it('should return comprehensive report', () => { const report = getBodySmellReport(state); expect(report.totalEntries).toBe(0); expect(typeof report.smellMastery).toBe('number'); });
  it('should include recommendations for empty state', () => { expect(getBodySmellReport(state).recommendations.length).toBeGreaterThan(0); });
  it('should reset all state', () => { let next = addBodySmellEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); next = resetNarrativeBodySmellEngineState(); expect(next.entries.size).toBe(0); });
});