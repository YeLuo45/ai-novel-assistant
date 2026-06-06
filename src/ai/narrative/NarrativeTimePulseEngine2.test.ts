/**
 * V1209 NarrativeTimePulseEngine2 Tests — Direction G Iter 12/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTimePulseEngineState,
  addTimePulse,
  addTimePulseBeat,
  getTimePulsesByType,
  getTimePulseReport,
  resetNarrativeTimePulseEngineState,
  type NarrativeTimePulseEngineState,
} from './NarrativeTimePulseEngine2';

describe('NarrativeTimePulseEngine2', () => {
  let state: NarrativeTimePulseEngineState;

  beforeEach(() => { state = createNarrativeTimePulseEngineState(); });

  describe('createNarrativeTimePulseEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.pulses.size).toBe(0);
      expect(state.beats.size).toBe(0);
    });
  });

  describe('addTimePulse', () => {
    it('should add pulse', () => {
      const next = addTimePulse(state, 'p1', 'heartbeat', 'mighty', 'eternal', 'desc', 0.9, 0.85, 1);
      expect(next.pulses.size).toBe(1);
      expect(next.totalPulses).toBe(1);
    });
  });

  describe('addTimePulseBeat', () => {
    it('should add beat', () => {
      let next = addTimePulse(state, 'p1', 'heartbeat', 'mighty', 'eternal', 'desc', 0.9, 0.85, 1);
      next = addTimePulseBeat(next, 'b1', ['p1']);
      expect(next.totalBeats).toBe(1);
    });
  });

  describe('getTimePulsesByType', () => {
    it('should filter by type', () => {
      let next = addTimePulse(state, 'p1', 'heartbeat', 'mighty', 'eternal', 'desc', 0.9, 0.85, 1);
      next = addTimePulse(next, 'p2', 'breath', 'mighty', 'eternal', 'desc', 0.9, 0.85, 1);
      const heartbeat = getTimePulsesByType(next, 'heartbeat');
      expect(heartbeat.length).toBe(1);
    });
  });

  describe('getTimePulseReport', () => {
    it('should return comprehensive report', () => {
      const report = getTimePulseReport(state);
      expect(report.totalPulses).toBe(0);
      expect(typeof report.timePulseMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTimePulseReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTimePulseEngineState', () => {
    it('should reset all state', () => {
      let next = addTimePulse(state, 'p1', 'heartbeat', 'mighty', 'eternal', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeTimePulseEngineState();
      expect(next.pulses.size).toBe(0);
      expect(next.totalPulses).toBe(0);
    });
  });
});