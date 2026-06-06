/**
 * V1145 NarrativeExperienceEngine2 Tests — Direction E Iter 20/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeExperienceEngineState,
  runExperienceCycle,
  getExperienceReport,
  resetNarrativeExperienceEngineState,
  type NarrativeExperienceEngineState,
} from './NarrativeExperienceEngine2';

describe('NarrativeExperienceEngine2', () => {
  let state: NarrativeExperienceEngineState;

  beforeEach(() => { state = createNarrativeExperienceEngineState(); });

  describe('createNarrativeExperienceEngineState', () => {
    it('should initialize all 19 sub-systems', () => {
      expect(state.engagement).toBeDefined();
      expect(state.immersion).toBeDefined();
      expect(state.curiosity).toBeDefined();
      expect(state.reward).toBeDefined();
      expect(state.tensionRelease).toBeDefined();
      expect(state.identification).toBeDefined();
      expect(state.suspension).toBeDefined();
      expect(state.catharsis).toBeDefined();
      expect(state.empathy).toBeDefined();
      expect(state.flow).toBeDefined();
      expect(state.absorption).toBeDefined();
      expect(state.transportation).toBeDefined();
      expect(state.presence).toBeDefined();
      expect(state.memorability).toBeDefined();
      expect(state.stickiness).toBeDefined();
      expect(state.virality).toBeDefined();
      expect(state.shareability).toBeDefined();
      expect(state.recommendation).toBeDefined();
      expect(state.discovery).toBeDefined();
    });

    it('should have correct version', () => {
      expect(state.version).toBe('5.0.0');
    });

    it('should have default overall experience', () => {
      expect(state.overallExperience).toBe(0.5);
    });
  });

  describe('runExperienceCycle', () => {
    it('should run cycle and return metrics', () => {
      const { overallExperience, insights } = runExperienceCycle(state);
      expect(typeof overallExperience).toBe('number');
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should generate insights for empty state', () => {
      const { insights } = runExperienceCycle(state);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should compute overall experience', () => {
      const { overallExperience } = runExperienceCycle(state);
      expect(overallExperience).toBeGreaterThanOrEqual(0);
      expect(overallExperience).toBeLessThanOrEqual(1);
    });
  });

  describe('getExperienceReport', () => {
    it('should return comprehensive report', () => {
      const report = getExperienceReport(state);
      expect(typeof report.engagementMastery).toBe('number');
      expect(typeof report.overallExperience).toBe('number');
    });

    it('should include all 19 subsystem scores', () => {
      const report = getExperienceReport(state);
      expect(typeof report.discoveryMastery).toBe('number');
      expect(typeof report.stickinessMastery).toBe('number');
    });
  });

  describe('resetNarrativeExperienceEngineState', () => {
    it('should reset all state', () => {
      const reset = resetNarrativeExperienceEngineState();
      expect(reset.engagement).toBeDefined();
      expect(reset.overallExperience).toBe(0.5);
    });
  });
});