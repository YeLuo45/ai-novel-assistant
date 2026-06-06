/**
 * V997 NarrativeSubplotEngine Tests — Direction B Iter 1/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeSubplotEngineState,
  addSubplot,
  updateSubplotProgress,
  addSubplotRelationship,
  getSubplotsByType,
  getSubplotReport,
  resetNarrativeSubplotEngineState,
  type NarrativeSubplotEngineState,
} from './NarrativeSubplotEngine';

describe('NarrativeSubplotEngine', () => {
  let state: NarrativeSubplotEngineState;

  beforeEach(() => { state = createNarrativeSubplotEngineState(); });

  describe('createNarrativeSubplotEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.subplots.size).toBe(0);
      expect(state.relationships.size).toBe(0);
    });
  });

  describe('addSubplot', () => {
    it('should add subplot', () => {
      const next = addSubplot(state, 'sp1', 'romance', 'parallel', 'Love story', ['c1'], 1);
      expect(next.subplots.size).toBe(1);
      expect(next.totalSubplots).toBe(1);
    });
  });

  describe('updateSubplotProgress', () => {
    it('should update', () => {
      let next = addSubplot(state, 'sp1', 'romance', 'parallel', 'Love story', ['c1'], 1);
      next = updateSubplotProgress(next, 'sp1', 1, 0.8);
      expect(next.subplots.get('sp1')?.status).toBe('resolved');
    });
  });

  describe('addSubplotRelationship', () => {
    it('should add relationship', () => {
      const next = addSubplotRelationship(state, 'r1', 'sp1', 'sp2', 'parallel', 0.7);
      expect(next.totalRelationships).toBe(1);
    });
  });

  describe('getSubplotsByType', () => {
    it('should filter by type', () => {
      let next = addSubplot(state, 'sp1', 'romance', 'parallel', 'Love', ['c1'], 1);
      next = addSubplot(next, 'sp2', 'mystery', 'parallel', 'Mystery', ['c2'], 1);
      const romance = getSubplotsByType(next, 'romance');
      expect(romance.length).toBe(1);
    });
  });

  describe('getSubplotReport', () => {
    it('should return comprehensive report', () => {
      const report = getSubplotReport(state);
      expect(report.totalSubplots).toBe(0);
      expect(typeof report.subplotMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getSubplotReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeSubplotEngineState', () => {
    it('should reset all state', () => {
      let next = addSubplot(state, 'sp1', 'romance', 'parallel', 'Love', ['c1'], 1);
      next = resetNarrativeSubplotEngineState();
      expect(next.subplots.size).toBe(0);
      expect(next.totalSubplots).toBe(0);
    });
  });
});