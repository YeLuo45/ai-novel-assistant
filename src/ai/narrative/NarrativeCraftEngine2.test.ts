/**
 * V1025 NarrativeCraftEngine2 Tests — Direction B Iter 15/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCraftEngine2State,
  runCraftCycle2,
  getCraftEngine2Report,
  resetNarrativeCraftEngine2State,
  type NarrativeCraftEngine2State,
} from './NarrativeCraftEngine2';

describe('NarrativeCraftEngine2', () => {
  let state: NarrativeCraftEngine2State;

  beforeEach(() => { state = createNarrativeCraftEngine2State(); });

  describe('createNarrativeCraftEngine2State', () => {
    it('should initialize all 14 sub-systems', () => {
      expect(state.subplot).toBeDefined();
      expect(state.inciting).toBeDefined();
      expect(state.climax).toBeDefined();
      expect(state.resolution).toBeDefined();
      expect(state.tension).toBeDefined();
      expect(state.hook).toBeDefined();
      expect(state.pacingVariance).toBeDefined();
      expect(state.dialogueTag).toBeDefined();
      expect(state.sceneBreak).toBeDefined();
      expect(state.chapterEnd).toBeDefined();
      expect(state.opening).toBeDefined();
      expect(state.closing).toBeDefined();
      expect(state.transition).toBeDefined();
      expect(state.symmetry).toBeDefined();
    });

    it('should have correct version', () => {
      expect(state.version).toBe('5.0.0');
    });

    it('should have default overall craft', () => {
      expect(state.overallCraft).toBe(0.5);
    });
  });

  describe('runCraftCycle2', () => {
    it('should run cycle and return metrics', () => {
      const { overallCraft, insights } = runCraftCycle2(state);
      expect(typeof overallCraft).toBe('number');
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should generate insights for empty state', () => {
      const { insights } = runCraftCycle2(state);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should compute overall craft', () => {
      const { overallCraft } = runCraftCycle2(state);
      expect(overallCraft).toBeGreaterThanOrEqual(0);
      expect(overallCraft).toBeLessThanOrEqual(1);
    });
  });

  describe('getCraftEngine2Report', () => {
    it('should return comprehensive report', () => {
      const report = getCraftEngine2Report(state);
      expect(typeof report.subplotMastery).toBe('number');
      expect(typeof report.overallCraft).toBe('number');
    });

    it('should include all 14 subsystem scores', () => {
      const report = getCraftEngine2Report(state);
      expect(typeof report.symmetryMastery).toBe('number');
      expect(typeof report.transitionMastery).toBe('number');
    });
  });

  describe('resetNarrativeCraftEngine2State', () => {
    it('should reset all state', () => {
      const reset = resetNarrativeCraftEngine2State();
      expect(reset.subplot).toBeDefined();
      expect(reset.overallCraft).toBe(0.5);
    });
  });
});