/**
 * V1655 NarrativeSettingLegendEngine Tests — Direction O Iter 25/30 (Round 5)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createNarrativeSettingLegendEngineState, addSettingLegendEntry, addSettingLegendRepertoire, getSettingLegendEntriesByType, getSettingLegendReport, resetNarrativeSettingLegendEngineState, type NarrativeSettingLegendEngineState } from './NarrativeSettingLegendEngine';
describe('NarrativeSettingLegendEngine', () => {
  let state: NarrativeSettingLegendEngineState;
  beforeEach(() => { state = createNarrativeSettingLegendEngineState(); });
  it('should initialize with defaults', () => { expect(state.entries.size).toBe(0); expect(state.repertoires.size).toBe(0); });
  it('should add entry', () => { const next = addSettingLegendEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); expect(next.entries.size).toBe(1); });
  it('should add repertoire', () => { let next = addSettingLegendEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); next = addSettingLegendRepertoire(next, 'r1', ['e1']); expect(next.totalRepertoires).toBe(1); });
  it('should filter by type', () => { let next = addSettingLegendEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); next = addSettingLegendEntry(next, 'e2', 'heroic', 'infinite', 'desc', 0.95, 1); expect(getSettingLegendEntriesByType(next, 'infinite').length).toBe(1); });
  it('should return comprehensive report', () => { const report = getSettingLegendReport(state); expect(report.totalEntries).toBe(0); expect(typeof report.legendMastery).toBe('number'); });
  it('should include recommendations for empty state', () => { expect(getSettingLegendReport(state).recommendations.length).toBeGreaterThan(0); });
  it('should reset all state', () => { let next = addSettingLegendEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); next = resetNarrativeSettingLegendEngineState(); expect(next.entries.size).toBe(0); });
});