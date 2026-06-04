/**
 * V653 NarrativeMemoryEngine Tests — Direction E Iter 3/9
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeMemoryState,
  encodeMemory,
  consolidateMemory,
  retrieveMemory,
  addAssociation,
  accessMemory,
  getMemoryReport,
  resetNarrativeMemoryState,
  type NarrativeMemoryState,
} from './NarrativeMemoryEngine';

describe('NarrativeMemoryEngine', () => {
  let state: NarrativeMemoryState;

  beforeEach(() => { state = createNarrativeMemoryState(); });

  describe('createNarrativeMemoryState', () => {
    it('should initialize with empty memory maps', () => {
      expect(state.episodic.size).toBe(0);
      expect(state.semantic.size).toBe(0);
      expect(state.working.size).toBe(0);
      expect(state.procedural.size).toBe(0);
    });

    it('should have default retrieval accuracy', () => {
      expect(state.retrievalAccuracy).toBe(0.8);
    });
  });

  describe('encodeMemory', () => {
    it('should encode episodic memory', () => {
      const next = encodeMemory(state, 'ep1', 'episodic', 'A happy memory', 0.7);
      expect(next.episodic.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });

    it('should encode semantic memory', () => {
      const next = encodeMemory(state, 'sem1', 'semantic', 'General knowledge', 0.6);
      expect(next.semantic.size).toBe(1);
    });

    it('should set importance', () => {
      const next = encodeMemory(state, 'ep1', 'episodic', 'Important event', 0.9);
      expect(next.episodic.get('ep1')?.importance).toBe(0.9);
    });

    it('should use default importance', () => {
      const next = encodeMemory(state, 'ep1', 'episodic', 'Normal event');
      expect(next.episodic.get('ep1')?.importance).toBe(0.5);
    });
  });

  describe('consolidateMemory', () => {
    it('should consolidate memory', () => {
      let next = encodeMemory(state, 'ep1', 'episodic', 'Memory to consolidate');
      next = consolidateMemory(next, 'ep1');
      expect(next.episodic.get('ep1')?.state).toBe('consolidating');
    });
  });

  describe('retrieveMemory', () => {
    it('should retrieve matching memories', () => {
      let next = encodeMemory(state, 'ep1', 'episodic', 'A story about a hero');
      next = encodeMemory(next, 'sem1', 'semantic', 'Hero definition');
      const result = retrieveMemory(next, 'hero');
      expect(result.entries.length).toBeGreaterThan(0);
    });

    it('should return relevance score', () => {
      const result = retrieveMemory(state, 'query');
      expect(result.relevanceScore).toBe(0.8);
    });

    it('should sort by importance', () => {
      let next = encodeMemory(state, 'ep1', 'episodic', 'Low importance', 0.3);
      next = encodeMemory(next, 'ep2', 'episodic', 'High importance', 0.9);
      const result = retrieveMemory(next, 'importance');
      expect(result.entries[0]?.importance).toBe(0.9);
    });
  });

  describe('addAssociation', () => {
    it('should add association to entry', () => {
      let next = encodeMemory(state, 'ep1', 'episodic', 'Memory');
      next = addAssociation(next, 'ep1', 'related1');
      expect(next.episodic.get('ep1')?.associations).toContain('related1');
    });
  });

  describe('accessMemory', () => {
    it('should increment access count', () => {
      let next = encodeMemory(state, 'ep1', 'episodic', 'Memory to access');
      next = accessMemory(next, 'ep1');
      next = accessMemory(next, 'ep1');
      expect(next.episodic.get('ep1')?.accessCount).toBe(2);
    });
  });

  describe('getMemoryReport', () => {
    it('should return comprehensive report', () => {
      const report = getMemoryReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.retrievalAccuracy).toBe('number');
    });

    it('should count each memory type', () => {
      let next = encodeMemory(state, 'ep1', 'episodic', 'E1');
      next = encodeMemory(next, 'sem1', 'semantic', 'S1');
      next = encodeMemory(next, 'wk1', 'working', 'W1');
      next = encodeMemory(next, 'pr1', 'procedural', 'P1');
      const report = getMemoryReport(next);
      expect(report.episodicCount).toBe(1);
      expect(report.semanticCount).toBe(1);
      expect(report.workingCount).toBe(1);
      expect(report.proceduralCount).toBe(1);
    });

    it('should include recommendations', () => {
      const report = getMemoryReport(state);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('resetNarrativeMemoryState', () => {
    it('should reset all memories', () => {
      let next = encodeMemory(state, 'ep1', 'episodic', 'Memory');
      next = encodeMemory(next, 'sem1', 'semantic', 'Knowledge');
      next = resetNarrativeMemoryState();
      expect(next.totalEntries).toBe(0);
      expect(next.episodic.size).toBe(0);
    });
  });
});