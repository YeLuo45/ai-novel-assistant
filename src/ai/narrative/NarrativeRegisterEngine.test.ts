/**
 * V1171 NarrativeRegisterEngine Tests — Direction F Iter 13/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeRegisterEngineState,
  addRegister,
  addRegisterLayer,
  getRegistersByType,
  getRegisterReport,
  resetNarrativeRegisterEngineState,
  type NarrativeRegisterEngineState,
} from './NarrativeRegisterEngine';

describe('NarrativeRegisterEngine', () => {
  let state: NarrativeRegisterEngineState;

  beforeEach(() => { state = createNarrativeRegisterEngineState(); });

  describe('createNarrativeRegisterEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.registers.size).toBe(0);
      expect(state.layers.size).toBe(0);
    });
  });

  describe('addRegister', () => {
    it('should add register', () => {
      const next = addRegister(state, 'r1', 'literary', 'moderate', 'authentic', 'desc', 0.9, 0.85, 1);
      expect(next.registers.size).toBe(1);
      expect(next.totalRegisters).toBe(1);
    });
  });

  describe('addRegisterLayer', () => {
    it('should add layer', () => {
      let next = addRegister(state, 'r1', 'literary', 'moderate', 'authentic', 'desc', 0.9, 0.85, 1);
      next = addRegisterLayer(next, 'l1', ['r1']);
      expect(next.totalLayers).toBe(1);
    });
  });

  describe('getRegistersByType', () => {
    it('should filter by type', () => {
      let next = addRegister(state, 'r1', 'literary', 'moderate', 'authentic', 'desc', 0.9, 0.85, 1);
      next = addRegister(next, 'r2', 'formal', 'moderate', 'authentic', 'desc', 0.9, 0.85, 1);
      const literary = getRegistersByType(next, 'literary');
      expect(literary.length).toBe(1);
    });
  });

  describe('getRegisterReport', () => {
    it('should return comprehensive report', () => {
      const report = getRegisterReport(state);
      expect(report.totalRegisters).toBe(0);
      expect(typeof report.registerMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getRegisterReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeRegisterEngineState', () => {
    it('should reset all state', () => {
      let next = addRegister(state, 'r1', 'literary', 'moderate', 'authentic', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeRegisterEngineState();
      expect(next.registers.size).toBe(0);
      expect(next.totalRegisters).toBe(0);
    });
  });
});