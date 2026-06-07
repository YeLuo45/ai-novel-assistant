/**
 * V1561 NarrativeStyleMetaphorEngine Tests — Direction N Iter 8/30 (Round 5)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createNarrativeStyleMetaphorEngineState, addStyleMetaphorEntry, addStyleMetaphorCluster, getStyleMetaphorEntriesByType, getStyleMetaphorReport, resetNarrativeStyleMetaphorEngineState, type NarrativeStyleMetaphorEngineState } from './NarrativeStyleMetaphorEngine';
describe('NarrativeStyleMetaphorEngine', () => {
  let state: NarrativeStyleMetaphorEngineState;
  beforeEach(() => { state = createNarrativeStyleMetaphorEngineState(); });
  it('should initialize with defaults', () => { expect(state.entries.size).toBe(0); expect(state.clusters.size).toBe(0); });
  it('should add entry', () => { const next = addStyleMetaphorEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); expect(next.entries.size).toBe(1); });
  it('should add cluster', () => { let next = addStyleMetaphorEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); next = addStyleMetaphorCluster(next, 'c1', ['e1']); expect(next.totalClusters).toBe(1); });
  it('should filter by type', () => { let next = addStyleMetaphorEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); next = addStyleMetaphorEntry(next, 'e2', 'direct', 'infinite', 'desc', 0.95, 1); expect(getStyleMetaphorEntriesByType(next, 'infinite').length).toBe(1); });
  it('should return comprehensive report', () => { const report = getStyleMetaphorReport(state); expect(report.totalEntries).toBe(0); expect(typeof report.metaphorMastery).toBe('number'); });
  it('should include recommendations for empty state', () => { expect(getStyleMetaphorReport(state).recommendations.length).toBeGreaterThan(0); });
  it('should reset all state', () => { let next = addStyleMetaphorEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); next = resetNarrativeStyleMetaphorEngineState(); expect(next.entries.size).toBe(0); });
});