/**
 * V1203 NarrativeTimeCurrentEngine Tests — Direction G Iter 9/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTimeCurrentEngineState,
  addTimeCurrent,
  addTimeCurrentFlow,
  getTimeCurrentsByType,
  getTimeCurrentReport,
  resetNarrativeTimeCurrentEngineState,
  type NarrativeTimeCurrentEngineState,
} from './NarrativeTimeCurrentEngine';

describe('NarrativeTimeCurrentEngine', () => {
  let state: NarrativeTimeCurrentEngineState;

  beforeEach(() => { state = createNarrativeTimeCurrentEngineState(); });

  describe('createNarrativeTimeCurrentEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.currents.size).toBe(0);
      expect(state.flows.size).toBe(0);
    });
  });

  describe('addTimeCurrent', () => {
    it('should add current', () => {
      const next = addTimeCurrent(state, 'c1', 'mainstream', 'powerful', 'omnidirectional', 'desc', 0.9, 0.85, 1);
      expect(next.currents.size).toBe(1);
      expect(next.totalCurrents).toBe(1);
    });
  });

  describe('addTimeCurrentFlow', () => {
    it('should add flow', () => {
      let next = addTimeCurrent(state, 'c1', 'mainstream', 'powerful', 'omnidirectional', 'desc', 0.9, 0.85, 1);
      next = addTimeCurrentFlow(next, 'f1', ['c1']);
      expect(next.totalFlows).toBe(1);
    });
  });

  describe('getTimeCurrentsByType', () => {
    it('should filter by type', () => {
      let next = addTimeCurrent(state, 'c1', 'mainstream', 'powerful', 'omnidirectional', 'desc', 0.9, 0.85, 1);
      next = addTimeCurrent(next, 'c2', 'undercurrent', 'powerful', 'omnidirectional', 'desc', 0.9, 0.85, 1);
      const main = getTimeCurrentsByType(next, 'mainstream');
      expect(main.length).toBe(1);
    });
  });

  describe('getTimeCurrentReport', () => {
    it('should return comprehensive report', () => {
      const report = getTimeCurrentReport(state);
      expect(report.totalCurrents).toBe(0);
      expect(typeof report.timeCurrentMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTimeCurrentReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTimeCurrentEngineState', () => {
    it('should reset all state', () => {
      let next = addTimeCurrent(state, 'c1', 'mainstream', 'powerful', 'omnidirectional', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeTimeCurrentEngineState();
      expect(next.currents.size).toBe(0);
      expect(next.totalCurrents).toBe(0);
    });
  });
});