/**
 * V729 NarrativeMemoryCore Tests — Direction E Iter 5/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeMemoryCoreState,
  encodeMemory,
  consolidateMemory,
  storeMemory,
  retrieveMemory,
  forgetMemory,
  getRecordsByLayer,
  getRecordsByState,
  getMemoryCoreReport,
  resetNarrativeMemoryCoreState,
  type NarrativeMemoryCoreState,
} from './NarrativeMemoryCore';

describe('NarrativeMemoryCore', () => {
  let state: NarrativeMemoryCoreState;

  beforeEach(() => { state = createNarrativeMemoryCoreState(); });

  describe('createNarrativeMemoryCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.records.size).toBe(0);
      expect(state.totalRecords).toBe(0);
    });

    it('should have default retention', () => {
      expect(state.retentionScore).toBe(0.7);
    });
  });

  describe('encodeMemory', () => {
    it('should encode memory', () => {
      const next = encodeMemory(state, 'm1', 'episodic', 'A memory', 0.8);
      expect(next.records.size).toBe(1);
      expect(next.totalRecords).toBe(1);
    });

    it('should set state to encoding', () => {
      const next = encodeMemory(state, 'm1', 'episodic', 'A memory');
      expect(next.records.get('m1')?.state).toBe('encoding');
    });

    it('should track layer distribution', () => {
      let next = encodeMemory(state, 'm1', 'episodic', 'memory 1');
      next = encodeMemory(next, 'm2', 'semantic', 'knowledge');
      expect(next.layerDistribution.get('episodic')).toBe(1);
      expect(next.layerDistribution.get('semantic')).toBe(1);
    });
  });

  describe('consolidateMemory', () => {
    it('should consolidate', () => {
      let next = encodeMemory(state, 'm1', 'episodic', 'memory');
      next = consolidateMemory(next, 'm1');
      expect(next.records.get('m1')?.state).toBe('consolidating');
    });
  });

  describe('storeMemory', () => {
    it('should store', () => {
      let next = encodeMemory(state, 'm1', 'episodic', 'memory');
      next = storeMemory(next, 'm1');
      expect(next.records.get('m1')?.state).toBe('stored');
    });
  });

  describe('retrieveMemory', () => {
    it('should retrieve', () => {
      let next = encodeMemory(state, 'm1', 'episodic', 'hero saves day');
      next = storeMemory(next, 'm1');
      const result = retrieveMemory(next, 'm1', 'hero');
      expect(result.record?.state).toBe('retrieved');
      expect(result.relevance).toBe(0.9);
    });

    it('should return null for unknown record', () => {
      const result = retrieveMemory(state, 'unknown');
      expect(result.record).toBeNull();
    });
  });

  describe('forgetMemory', () => {
    it('should forget', () => {
      let next = encodeMemory(state, 'm1', 'episodic', 'memory');
      next = forgetMemory(next, 'm1');
      expect(next.records.get('m1')?.state).toBe('forgotten');
    });
  });

  describe('getRecordsByLayer', () => {
    it('should filter by layer', () => {
      let next = encodeMemory(state, 'm1', 'episodic', 'memory 1');
      next = encodeMemory(next, 'm2', 'semantic', 'memory 2');
      const episodic = getRecordsByLayer(next, 'episodic');
      expect(episodic.length).toBe(1);
    });
  });

  describe('getRecordsByState', () => {
    it('should filter by state', () => {
      let next = encodeMemory(state, 'm1', 'episodic', 'memory 1');
      next = encodeMemory(next, 'm2', 'semantic', 'memory 2');
      next = storeMemory(next, 'm1');
      const stored = getRecordsByState(next, 'stored');
      expect(stored.length).toBe(1);
    });
  });

  describe('getMemoryCoreReport', () => {
    it('should return comprehensive report', () => {
      const report = getMemoryCoreReport(state);
      expect(report.totalRecords).toBe(0);
      expect(typeof report.retentionScore).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getMemoryCoreReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeMemoryCoreState', () => {
    it('should reset all state', () => {
      let next = encodeMemory(state, 'm1', 'episodic', 'memory');
      next = resetNarrativeMemoryCoreState();
      expect(next.records.size).toBe(0);
      expect(next.totalRecords).toBe(0);
    });
  });
});