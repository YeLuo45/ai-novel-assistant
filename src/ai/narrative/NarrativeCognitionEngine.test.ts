/**
 * V811 NarrativeCognitionEngine Tests — Direction E Iter 1/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCognitionEngineState,
  createCognition,
  activateCognition,
  startCognitionProcess,
  completeCognitionProcess,
  getCognitionsByType,
  getCognitionReport,
  resetNarrativeCognitionEngineState,
  type NarrativeCognitionEngineState,
} from './NarrativeCognitionEngine';

describe('NarrativeCognitionEngine', () => {
  let state: NarrativeCognitionEngineState;

  beforeEach(() => { state = createNarrativeCognitionEngineState(); });

  describe('createNarrativeCognitionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.cognitions.size).toBe(0);
      expect(state.processes.size).toBe(0);
    });
  });

  describe('createCognition', () => {
    it('should create cognition', () => {
      const next = createCognition(state, 'c1', 'reasoning', 'proficient', 1.0);
      expect(next.cognitions.size).toBe(1);
      expect(next.totalCognitions).toBe(1);
    });
  });

  describe('activateCognition', () => {
    it('should activate', () => {
      let next = createCognition(state, 'c1', 'reasoning');
      next = activateCognition(next, 'c1', 0.8);
      expect(next.cognitions.get('c1')?.state).toBe('focused');
    });

    it('should mark as overloaded', () => {
      let next = createCognition(state, 'c1', 'reasoning');
      next = activateCognition(next, 'c1', 0.95);
      expect(next.cognitions.get('c1')?.state).toBe('overloaded');
    });
  });

  describe('startCognitionProcess', () => {
    it('should start process', () => {
      const next = startCognitionProcess(state, 'p1', ['reasoning', 'memory'], 'analyze text');
      expect(next.totalProcesses).toBe(1);
      expect(next.activeProcesses).toBe(1);
    });
  });

  describe('completeCognitionProcess', () => {
    it('should complete process', () => {
      let next = startCognitionProcess(state, 'p1', ['reasoning'], 'input');
      next = completeCognitionProcess(next, 'p1', 'output', true);
      expect(next.processes.get('p1')?.success).toBe(true);
      expect(next.activeProcesses).toBe(0);
    });
  });

  describe('getCognitionsByType', () => {
    it('should filter by type', () => {
      let next = createCognition(state, 'c1', 'reasoning');
      next = createCognition(next, 'c2', 'memory');
      const reasoning = getCognitionsByType(next, 'reasoning');
      expect(reasoning.length).toBe(1);
    });
  });

  describe('getCognitionReport', () => {
    it('should return comprehensive report', () => {
      const report = getCognitionReport(state);
      expect(report.totalCognitions).toBe(0);
      expect(typeof report.integrationScore).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCognitionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeCognitionEngineState', () => {
    it('should reset all state', () => {
      let next = createCognition(state, 'c1', 'reasoning');
      next = resetNarrativeCognitionEngineState();
      expect(next.cognitions.size).toBe(0);
      expect(next.totalCognitions).toBe(0);
    });
  });
});