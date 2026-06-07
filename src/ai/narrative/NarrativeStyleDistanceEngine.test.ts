/**
 * V1587 NarrativeStyleDistanceEngine Tests — Direction N Iter 21/30 (Round 5)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createNarrativeStyleDistanceEngineState, addStyleDistanceEntry, addStyleDistanceCluster, getStyleDistanceEntriesByType, getStyleDistanceReport, resetNarrativeStyleDistanceEngineState, type NarrativeStyleDistanceEngineState } from './NarrativeStyleDistanceEngine';
describe('NarrativeStyleDistanceEngine', () => {
  let state: NarrativeStyleDistanceEngineState;
  beforeEach(() => { state = createNarrativeStyleDistanceEngineState(); });
  it('should initialize with defaults', () => { expect(state.entries.size).toBe(0); expect(state.clusters.size).toBe(0); });
  it('should add entry', () => { const next = addStyleDistanceEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); expect(next.entries.size).toBe(1); });
  it('should add cluster', () => { let next = addStyleDistanceEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); next = addStyleDistanceCluster(next, 'c1', ['e1']); expect(next.totalClusters).toBe(1); });
  it('should filter by type', () => { let next = addStyleDistanceEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); next = addStyleDistanceEntry(next, 'e2', 'close', 'infinite', 'desc', 0.95, 1); expect(getStyleDistanceEntriesByType(next, 'infinite').length).toBe(1); });
  it('should return comprehensive report', () => { const report = getStyleDistanceReport(state); expect(report.totalEntries).toBe(0); expect(typeof report.distanceMastery).toBe('number'); });
  it('should include recommendations for empty state', () => { expect(getStyleDistanceReport(state).recommendations.length).toBeGreaterThan(0); });
  it('should reset all state', () => { let next = addStyleDistanceEntry(state, 'e1', 'infinite', 'infinite', 'desc', 0.95, 1); next = resetNarrativeStyleDistanceEngineState(); expect(next.entries.size).toBe(0); });
});