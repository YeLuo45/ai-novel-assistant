/**
 * V2037 NarrativeBodyTasteEngine Tests — Direction V Iter 6/30 (Round 5)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createNarrativeBodyTasteEngineState, addBodyTasteEntry, addBodyTasteFlavor, getBodyTasteEntriesByType, getBodyTasteReport, resetNarrativeBodyTasteEngineState, type NarrativeBodyTasteEngineState } from './NarrativeBodyTasteEngine';
describe('NarrativeBodyTasteEngine', () => {
  let state: NarrativeBodyTasteEngineState;
  beforeEach(() => { state = createNarrativeBodyTasteEngineState(); });
  it('should initialize with defaults', () => { expect(state.entries.size).toBe(0); expect(state.flavors.size).toBe(0); });
  it('should add entry', () => { const next = addBodyTasteEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); expect(next.entries.size).toBe(1); });
  it('should add flavor', () => { let next = addBodyTasteEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); next = addBodyTasteFlavor(next, 'f1', ['e1']); expect(next.totalFlavors).toBe(1); });
  it('should filter by type', () => { let next = addBodyTasteEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); next = addBodyTasteEntry(next, 'e2', 'sweet', 'infinite', 'desc', 0.95, 1); expect(getBodyTasteEntriesByType(next, 'infinite').length).toBe(1); });
  it('should return comprehensive report', () => { const report = getBodyTasteReport(state); expect(report.totalEntries).toBe(0); expect(typeof report.tasteMastery).toBe('number'); });
  it('should include recommendations for empty state', () => { expect(getBodyTasteReport(state).recommendations.length).toBeGreaterThan(0); });
  it('should reset all state', () => { let next = addBodyTasteEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); next = resetNarrativeBodyTasteEngineState(); expect(next.entries.size).toBe(0); });
});