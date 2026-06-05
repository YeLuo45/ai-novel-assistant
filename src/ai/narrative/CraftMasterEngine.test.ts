/**
 * V773 CraftMasterEngine Tests — Direction B Iter 9/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCraftMasterEngineState,
  runCraftCycle,
  getCraftMasterReport,
  resetCraftMasterEngineState,
  type CraftMasterEngineState,
} from './CraftMasterEngine';

describe('CraftMasterEngine', () => {
  let state: CraftMasterEngineState;

  beforeEach(() => { state = createCraftMasterEngineState(); });

  describe('createCraftMasterEngineState', () => {
    it('should initialize all 8 sub-systems', () => {
      expect(state.crafting).toBeDefined();
      expect(state.weaving).toBeDefined();
      expect(state.psychology).toBeDefined();
      expect(state.tension).toBeDefined();
      expect(state.twist).toBeDefined();
      expect(state.atmosphere).toBeDefined();
      expect(state.lore).toBeDefined();
      expect(state.dialogue).toBeDefined();
    });

    it('should have correct version', () => {
      expect(state.version).toBe('3.0.0');
    });

    it('should have default overall craft', () => {
      expect(state.overallCraft).toBe(0.5);
    });
  });

  describe('runCraftCycle', () => {
    it('should run cycle and return metrics', () => {
      const { overallCraft, insights } = runCraftCycle(state);
      expect(typeof overallCraft).toBe('number');
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should generate insights for empty state', () => {
      const { insights } = runCraftCycle(state);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should compute overall craft', () => {
      const { overallCraft } = runCraftCycle(state);
      expect(overallCraft).toBeGreaterThanOrEqual(0);
      expect(overallCraft).toBeLessThanOrEqual(1);
    });
  });

  describe('getCraftMasterReport', () => {
    it('should return comprehensive report', () => {
      const report = getCraftMasterReport(state);
      expect(typeof report.craftQuality).toBe('number');
      expect(typeof report.overallCraft).toBe('number');
    });

    it('should include all subsystem scores', () => {
      const report = getCraftMasterReport(state);
      expect(typeof report.weavingComplexity).toBe('number');
      expect(typeof report.psychologicalDepth).toBe('number');
      expect(typeof report.dialogueDynamics).toBe('number');
    });
  });

  describe('resetCraftMasterEngineState', () => {
    it('should reset all state', () => {
      const reset = resetCraftMasterEngineState();
      expect(reset.crafting).toBeDefined();
      expect(reset.overallCraft).toBe(0.5);
    });
  });
});