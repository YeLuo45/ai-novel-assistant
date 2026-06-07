/**
 * V1401 NarrativeCharacterSecretEngine Tests — Direction K Iter 18/30 (Round 5)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCharacterSecretEngineState,
  addCharacterSecretEntry,
  addCharacterSecretVault,
  getCharacterSecretEntriesByType,
  getCharacterSecretReport,
  resetNarrativeCharacterSecretEngineState,
  type NarrativeCharacterSecretEngineState,
} from './NarrativeCharacterSecretEngine';

describe('NarrativeCharacterSecretEngine', () => {
  let state: NarrativeCharacterSecretEngineState;
  beforeEach(() => { state = createNarrativeCharacterSecretEngineState(); });
  it('should initialize with defaults', () => { expect(state.entries.size).toBe(0); expect(state.vaults.size).toBe(0); });
  it('should add entry', () => { const next = addCharacterSecretEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); expect(next.entries.size).toBe(1); });
  it('should add vault', () => { let next = addCharacterSecretEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); next = addCharacterSecretVault(next, 'v1', ['e1']); expect(next.totalVaults).toBe(1); });
  it('should filter by type', () => { let next = addCharacterSecretEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); next = addCharacterSecretEntry(next, 'e2', 'shameful', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); expect(getCharacterSecretEntriesByType(next, 'transcendent').length).toBe(1); });
  it('should return comprehensive report', () => { const report = getCharacterSecretReport(state); expect(report.totalEntries).toBe(0); expect(typeof report.characterSecretMastery).toBe('number'); });
  it('should include recommendations for empty state', () => { expect(getCharacterSecretReport(state).recommendations.length).toBeGreaterThan(0); });
  it('should reset all state', () => { let next = addCharacterSecretEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1); next = resetNarrativeCharacterSecretEngineState(); expect(next.entries.size).toBe(0); });
});