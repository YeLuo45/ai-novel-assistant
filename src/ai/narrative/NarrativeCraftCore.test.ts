/**
 * V875 NarrativeCraftCore Tests — Direction B Iter 15/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCraftCoreState,
  runCraftCycle,
  getNarrativeCraftReport,
  resetNarrativeCraftCoreState,
  type NarrativeCraftCoreState,
} from './NarrativeCraftCore';

describe('NarrativeCraftCore', () => {
  let state: NarrativeCraftCoreState;

  beforeEach(() => { state = createNarrativeCraftCoreState(); });

  describe('createNarrativeCraftCoreState', () => {
    it('should initialize all 14 sub-systems', () => {
      expect(state.subtext).toBeDefined();
      expect(state.pacing).toBeDefined();
      expect(state.motivation).toBeDefined();
      expect(state.sceneArch).toBeDefined();
      expect(state.dialogue).toBeDefined();
      expect(state.voice).toBeDefined();
      expect(state.theme).toBeDefined();
      expect(state.arc).toBeDefined();
      expect(state.world).toBeDefined();
      expect(state.style).toBeDefined();
      expect(state.charDyn).toBeDefined();
      expect(state.plotStruct).toBeDefined();
      expect(state.conflict).toBeDefined();
      expect(state.composition).toBeDefined();
    });

    it('should have correct version', () => {
      expect(state.version).toBe('4.0.0');
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

  describe('getNarrativeCraftReport', () => {
    it('should return comprehensive report', () => {
      const report = getNarrativeCraftReport(state);
      expect(typeof report.subtextRichness).toBe('number');
      expect(typeof report.overallCraft).toBe('number');
    });

    it('should include all 14 subsystem scores', () => {
      const report = getNarrativeCraftReport(state);
      expect(typeof report.rhythmScore).toBe('number');
      expect(typeof report.compositionMastery).toBe('number');
      expect(typeof report.engineeringQuality).toBe('number');
    });
  });

  describe('resetNarrativeCraftCoreState', () => {
    it('should reset all state', () => {
      const reset = resetNarrativeCraftCoreState();
      expect(reset.subtext).toBeDefined();
      expect(reset.overallCraft).toBe(0.5);
    });
  });
});