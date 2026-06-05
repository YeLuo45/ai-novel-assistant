/**
 * V805 CritiqueIntegrationEngine Tests — Direction D Iter 7/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCritiqueIntegrationEngineState,
  addCritique,
  getConsensusByCategory,
  getCritiquesBySource,
  getCritiqueIntegrationReport,
  resetCritiqueIntegrationEngineState,
  type CritiqueIntegrationEngineState,
} from './CritiqueIntegrationEngine';

describe('CritiqueIntegrationEngine', () => {
  let state: CritiqueIntegrationEngineState;

  beforeEach(() => { state = createCritiqueIntegrationEngineState(); });

  describe('createCritiqueIntegrationEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.critiques.size).toBe(0);
      expect(state.averageRating).toBe(0.5);
    });
  });

  describe('addCritique', () => {
    it('should add critique', () => {
      const next = addCritique(state, 'c1', 'editor', 'plot', 0.8, 'good plot', ['add twist'], 'positive', 1.5);
      expect(next.critiques.size).toBe(1);
      expect(next.totalCritiques).toBe(1);
    });

    it('should clamp rating and weight', () => {
      const next = addCritique(state, 'c1', 'self', 'plot', 1.5, 'text', [], 'positive', 3.0);
      expect(next.critiques.get('c1')?.rating).toBe(1);
      expect(next.critiques.get('c1')?.weight).toBe(2);
    });
  });

  describe('getConsensusByCategory', () => {
    it('should return consensus for empty category', () => {
      const consensus = getConsensusByCategory(state, 'plot');
      expect(consensus.critiqueCount).toBe(0);
    });

    it('should compute consensus', () => {
      let next = addCritique(state, 'c1', 'editor', 'plot', 0.8, 'good', [], 'positive');
      next = addCritique(next, 'c2', 'reader', 'plot', 0.7, 'good', ['add twist'], 'positive');
      const consensus = getConsensusByCategory(next, 'plot');
      expect(consensus.critiqueCount).toBe(2);
      expect(consensus.consensus).toBe('positive');
    });
  });

  describe('getCritiquesBySource', () => {
    it('should filter by source', () => {
      let next = addCritique(state, 'c1', 'editor', 'plot', 0.8, 'good');
      next = addCritique(next, 'c2', 'reader', 'plot', 0.7, 'good');
      const editorCrits = getCritiquesBySource(next, 'editor');
      expect(editorCrits.length).toBe(1);
    });
  });

  describe('getCritiqueIntegrationReport', () => {
    it('should return comprehensive report', () => {
      const report = getCritiqueIntegrationReport(state);
      expect(report.totalCritiques).toBe(0);
      expect(typeof report.averageRating).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCritiqueIntegrationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetCritiqueIntegrationEngineState', () => {
    it('should reset all state', () => {
      let next = addCritique(state, 'c1', 'editor', 'plot', 0.8, 'good');
      next = resetCritiqueIntegrationEngineState();
      expect(next.critiques.size).toBe(0);
      expect(next.totalCritiques).toBe(0);
    });
  });
});