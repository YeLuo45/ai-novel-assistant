/**
 * V1247 NarrativeAudienceMemoryEngine Tests — Direction H Iter 11/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAudienceMemoryEngineState,
  addAudienceMemory,
  addAudienceMemoryBank,
  getAudienceMemoriesByType,
  getAudienceMemoryReport,
  resetNarrativeAudienceMemoryEngineState,
  type NarrativeAudienceMemoryEngineState,
} from './NarrativeAudienceMemoryEngine';

describe('NarrativeAudienceMemoryEngine', () => {
  let state: NarrativeAudienceMemoryEngineState;

  beforeEach(() => { state = createNarrativeAudienceMemoryEngineState(); });

  describe('createNarrativeAudienceMemoryEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.memories.size).toBe(0);
      expect(state.banks.size).toBe(0);
    });
  });

  describe('addAudienceMemory', () => {
    it('should add memory', () => {
      const next = addAudienceMemory(state, 'm1', 'symbolic', 'permanent', 'photographic', 'desc', 0.95, 0.9, 1);
      expect(next.memories.size).toBe(1);
      expect(next.totalMemories).toBe(1);
    });
  });

  describe('addAudienceMemoryBank', () => {
    it('should add bank', () => {
      let next = addAudienceMemory(state, 'm1', 'symbolic', 'permanent', 'photographic', 'desc', 0.95, 0.9, 1);
      next = addAudienceMemoryBank(next, 'b1', ['m1']);
      expect(next.totalBanks).toBe(1);
    });
  });

  describe('getAudienceMemoriesByType', () => {
    it('should filter by type', () => {
      let next = addAudienceMemory(state, 'm1', 'symbolic', 'permanent', 'photographic', 'desc', 0.95, 0.9, 1);
      next = addAudienceMemory(next, 'm2', 'episodic', 'permanent', 'photographic', 'desc', 0.95, 0.9, 1);
      const symbolic = getAudienceMemoriesByType(next, 'symbolic');
      expect(symbolic.length).toBe(1);
    });
  });

  describe('getAudienceMemoryReport', () => {
    it('should return comprehensive report', () => {
      const report = getAudienceMemoryReport(state);
      expect(report.totalMemories).toBe(0);
      expect(typeof report.audienceMemoryMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAudienceMemoryReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAudienceMemoryEngineState', () => {
    it('should reset all state', () => {
      let next = addAudienceMemory(state, 'm1', 'symbolic', 'permanent', 'photographic', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeAudienceMemoryEngineState();
      expect(next.memories.size).toBe(0);
      expect(next.totalMemories).toBe(0);
    });
  });
});