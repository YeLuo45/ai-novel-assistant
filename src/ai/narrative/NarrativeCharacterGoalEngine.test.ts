/**
 * V1385 NarrativeCharacterGoalEngine Tests — Direction K Iter 10/30 (Round 5)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCharacterGoalEngineState,
  addCharacterGoalEntry,
  addCharacterGoalHierarchy,
  getCharacterGoalEntriesByScope,
  getCharacterGoalReport,
  resetNarrativeCharacterGoalEngineState,
  type NarrativeCharacterGoalEngineState,
} from './NarrativeCharacterGoalEngine';

describe('NarrativeCharacterGoalEngine', () => {
  let state: NarrativeCharacterGoalEngineState;
  beforeEach(() => { state = createNarrativeCharacterGoalEngineState(); });

  it('should initialize with defaults', () => {
    expect(state.entries.size).toBe(0);
    expect(state.hierarchies.size).toBe(0);
  });

  it('should add entry', () => {
    const next = addCharacterGoalEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
    expect(next.entries.size).toBe(1);
  });

  it('should add hierarchy', () => {
    let next = addCharacterGoalEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
    next = addCharacterGoalHierarchy(next, 'h1', ['e1']);
    expect(next.totalHierarchies).toBe(1);
  });

  it('should filter by scope', () => {
    let next = addCharacterGoalEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
    next = addCharacterGoalEntry(next, 'e2', 'immediate', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
    expect(getCharacterGoalEntriesByScope(next, 'transcendent').length).toBe(1);
  });

  it('should return comprehensive report', () => {
    const report = getCharacterGoalReport(state);
    expect(report.totalEntries).toBe(0);
    expect(typeof report.characterGoalMastery).toBe('number');
  });

  it('should include recommendations for empty state', () => {
    expect(getCharacterGoalReport(state).recommendations.length).toBeGreaterThan(0);
  });

  it('should reset all state', () => {
    let next = addCharacterGoalEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
    next = resetNarrativeCharacterGoalEngineState();
    expect(next.entries.size).toBe(0);
  });
});