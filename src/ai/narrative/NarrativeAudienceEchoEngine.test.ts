/**
 * V1251 NarrativeAudienceEchoEngine Tests — Direction H Iter 13/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAudienceEchoEngineState,
  addAudienceEcho,
  addAudienceEchoChamber,
  getAudienceEchoesByType,
  getAudienceEchoReport,
  resetNarrativeAudienceEchoEngineState,
  type NarrativeAudienceEchoEngineState,
} from './NarrativeAudienceEchoEngine';

describe('NarrativeAudienceEchoEngine', () => {
  let state: NarrativeAudienceEchoEngineState;

  beforeEach(() => { state = createNarrativeAudienceEchoEngineState(); });

  describe('createNarrativeAudienceEchoEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.echoes.size).toBe(0);
      expect(state.chambers.size).toBe(0);
    });
  });

  describe('addAudienceEcho', () => {
    it('should add echo', () => {
      const next = addAudienceEcho(state, 'e1', 'image', 'resonant', 'universal', 'desc', 0.95, 0.9, 1);
      expect(next.echoes.size).toBe(1);
      expect(next.totalEchoes).toBe(1);
    });
  });

  describe('addAudienceEchoChamber', () => {
    it('should add chamber', () => {
      let next = addAudienceEcho(state, 'e1', 'image', 'resonant', 'universal', 'desc', 0.95, 0.9, 1);
      next = addAudienceEchoChamber(next, 'c1', ['e1']);
      expect(next.totalChambers).toBe(1);
    });
  });

  describe('getAudienceEchoesByType', () => {
    it('should filter by type', () => {
      let next = addAudienceEcho(state, 'e1', 'image', 'resonant', 'universal', 'desc', 0.95, 0.9, 1);
      next = addAudienceEcho(next, 'e2', 'phrase', 'resonant', 'universal', 'desc', 0.95, 0.9, 1);
      const image = getAudienceEchoesByType(next, 'image');
      expect(image.length).toBe(1);
    });
  });

  describe('getAudienceEchoReport', () => {
    it('should return comprehensive report', () => {
      const report = getAudienceEchoReport(state);
      expect(report.totalEchoes).toBe(0);
      expect(typeof report.audienceEchoMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAudienceEchoReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAudienceEchoEngineState', () => {
    it('should reset all state', () => {
      let next = addAudienceEcho(state, 'e1', 'image', 'resonant', 'universal', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeAudienceEchoEngineState();
      expect(next.echoes.size).toBe(0);
      expect(next.totalEchoes).toBe(0);
    });
  });
});