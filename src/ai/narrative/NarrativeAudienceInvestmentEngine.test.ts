/**
 * V1239 NarrativeAudienceInvestmentEngine Tests — Direction H Iter 7/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAudienceInvestmentEngineState,
  addAudienceInvestment,
  addAudienceInvestmentPortfolio,
  getAudienceInvestmentsByType,
  getAudienceInvestmentReport,
  resetNarrativeAudienceInvestmentEngineState,
  type NarrativeAudienceInvestmentEngineState,
} from './NarrativeAudienceInvestmentEngine';

describe('NarrativeAudienceInvestmentEngine', () => {
  let state: NarrativeAudienceInvestmentEngineState;

  beforeEach(() => { state = createNarrativeAudienceInvestmentEngineState(); });

  describe('createNarrativeAudienceInvestmentEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.investments.size).toBe(0);
      expect(state.portfolios.size).toBe(0);
    });
  });

  describe('addAudienceInvestment', () => {
    it('should add investment', () => {
      const next = addAudienceInvestment(state, 'i1', 'identity', 'identity_level', 'transformative', 'desc', 0.95, 0.9, 1);
      expect(next.investments.size).toBe(1);
      expect(next.totalInvestments).toBe(1);
    });
  });

  describe('addAudienceInvestmentPortfolio', () => {
    it('should add portfolio', () => {
      let next = addAudienceInvestment(state, 'i1', 'identity', 'identity_level', 'transformative', 'desc', 0.95, 0.9, 1);
      next = addAudienceInvestmentPortfolio(next, 'p1', ['i1']);
      expect(next.totalPortfolios).toBe(1);
    });
  });

  describe('getAudienceInvestmentsByType', () => {
    it('should filter by type', () => {
      let next = addAudienceInvestment(state, 'i1', 'identity', 'identity_level', 'transformative', 'desc', 0.95, 0.9, 1);
      next = addAudienceInvestment(next, 'i2', 'emotional', 'identity_level', 'transformative', 'desc', 0.95, 0.9, 1);
      const identity = getAudienceInvestmentsByType(next, 'identity');
      expect(identity.length).toBe(1);
    });
  });

  describe('getAudienceInvestmentReport', () => {
    it('should return comprehensive report', () => {
      const report = getAudienceInvestmentReport(state);
      expect(report.totalInvestments).toBe(0);
      expect(typeof report.audienceInvestmentMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAudienceInvestmentReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAudienceInvestmentEngineState', () => {
    it('should reset all state', () => {
      let next = addAudienceInvestment(state, 'i1', 'identity', 'identity_level', 'transformative', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeAudienceInvestmentEngineState();
      expect(next.investments.size).toBe(0);
      expect(next.totalInvestments).toBe(0);
    });
  });
});