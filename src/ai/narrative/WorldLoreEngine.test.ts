/**
 * V769 WorldLoreEngine Tests — Direction B Iter 7/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWorldLoreEngineState,
  addLoreEntry,
  connectLore,
  getEntriesByType,
  getEntriesByEra,
  getLoreReport,
  resetWorldLoreEngineState,
  type WorldLoreEngineState,
} from './WorldLoreEngine';

describe('WorldLoreEngine', () => {
  let state: WorldLoreEngineState;

  beforeEach(() => { state = createWorldLoreEngineState(); });

  describe('createWorldLoreEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.connections.size).toBe(0);
    });
  });

  describe('addLoreEntry', () => {
    it('should add entry', () => {
      const next = addLoreEntry(state, 'l1', 'The Great War', 'history', 'ancient', 'A legendary conflict', 'legendary', 0.9);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });

    it('should track type distribution', () => {
      let next = addLoreEntry(state, 'l1', 'Title', 'history', 'ancient', 'content');
      next = addLoreEntry(next, 'l2', 'Title2', 'mythology', 'timeless', 'content');
      expect(next.typeDistribution.get('history')).toBe(1);
      expect(next.typeDistribution.get('mythology')).toBe(1);
    });

    it('should clamp significance', () => {
      const next = addLoreEntry(state, 'l1', 'Title', 'history', 'ancient', 'content', 'verified', 1.5);
      expect(next.entries.get('l1')?.significance).toBe(1);
    });
  });

  describe('connectLore', () => {
    it('should connect', () => {
      let next = addLoreEntry(state, 'l1', 'T1', 'history', 'ancient', 'content');
      next = addLoreEntry(next, 'l2', 'T2', 'mythology', 'timeless', 'content');
      next = connectLore(next, 'c1', 'l1', 'l2', 'influences', 0.7);
      expect(next.totalConnections).toBe(1);
    });

    it('should update entry connections', () => {
      let next = addLoreEntry(state, 'l1', 'T1', 'history', 'ancient', 'content');
      next = addLoreEntry(next, 'l2', 'T2', 'mythology', 'timeless', 'content');
      next = connectLore(next, 'c1', 'l1', 'l2', 'influences', 0.7);
      expect(next.entries.get('l1')?.connections.length).toBe(1);
    });
  });

  describe('getEntriesByType', () => {
    it('should filter by type', () => {
      let next = addLoreEntry(state, 'l1', 'T1', 'history', 'ancient', 'content');
      next = addLoreEntry(next, 'l2', 'T2', 'mythology', 'timeless', 'content');
      const history = getEntriesByType(next, 'history');
      expect(history.length).toBe(1);
    });
  });

  describe('getEntriesByEra', () => {
    it('should filter by era', () => {
      let next = addLoreEntry(state, 'l1', 'T1', 'history', 'ancient', 'content');
      next = addLoreEntry(next, 'l2', 'T2', 'history', 'modern', 'content');
      const ancient = getEntriesByEra(next, 'ancient');
      expect(ancient.length).toBe(1);
    });
  });

  describe('getLoreReport', () => {
    it('should return comprehensive report', () => {
      const report = getLoreReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.loreDepth).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getLoreReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetWorldLoreEngineState', () => {
    it('should reset all state', () => {
      let next = addLoreEntry(state, 'l1', 'T1', 'history', 'ancient', 'content');
      next = resetWorldLoreEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});