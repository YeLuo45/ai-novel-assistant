/**
 * V1189 NarrativeTimeStreamEngine Tests — Direction G Iter 2/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTimeStreamEngineState,
  addTimeStream,
  addTimeStreamPattern,
  getTimeStreamsByType,
  getTimeStreamReport,
  resetNarrativeTimeStreamEngineState,
  type NarrativeTimeStreamEngineState,
} from './NarrativeTimeStreamEngine';

describe('NarrativeTimeStreamEngine', () => {
  let state: NarrativeTimeStreamEngineState;

  beforeEach(() => { state = createNarrativeTimeStreamEngineState(); });

  describe('createNarrativeTimeStreamEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.streams.size).toBe(0);
      expect(state.patterns.size).toBe(0);
    });
  });

  describe('addTimeStream', () => {
    it('should add stream', () => {
      const next = addTimeStream(state, 's1', 'braided', 'rushing', 'seamless', 'desc', 0.9, 0.85, 1);
      expect(next.streams.size).toBe(1);
      expect(next.totalStreams).toBe(1);
    });
  });

  describe('addTimeStreamPattern', () => {
    it('should add pattern', () => {
      let next = addTimeStream(state, 's1', 'braided', 'rushing', 'seamless', 'desc', 0.9, 0.85, 1);
      next = addTimeStreamPattern(next, 'p1', ['s1']);
      expect(next.totalPatterns).toBe(1);
    });
  });

  describe('getTimeStreamsByType', () => {
    it('should filter by type', () => {
      let next = addTimeStream(state, 's1', 'braided', 'rushing', 'seamless', 'desc', 0.9, 0.85, 1);
      next = addTimeStream(next, 's2', 'linear', 'rushing', 'seamless', 'desc', 0.9, 0.85, 1);
      const braided = getTimeStreamsByType(next, 'braided');
      expect(braided.length).toBe(1);
    });
  });

  describe('getTimeStreamReport', () => {
    it('should return comprehensive report', () => {
      const report = getTimeStreamReport(state);
      expect(report.totalStreams).toBe(0);
      expect(typeof report.timeStreamMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTimeStreamReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTimeStreamEngineState', () => {
    it('should reset all state', () => {
      let next = addTimeStream(state, 's1', 'braided', 'rushing', 'seamless', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeTimeStreamEngineState();
      expect(next.streams.size).toBe(0);
      expect(next.totalStreams).toBe(0);
    });
  });
});