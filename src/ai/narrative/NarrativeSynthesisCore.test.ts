/**
 * V733 NarrativeSynthesisCore Tests — Direction E Iter 7/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeSynthesisCoreState,
  createSynthesis,
  advanceSynthesisStage,
  addSynthesisSource,
  getOutputsByMode,
  getOutputsByStage,
  getSynthesisCoreReport,
  resetNarrativeSynthesisCoreState,
  type NarrativeSynthesisCoreState,
  type SynthesisSource,
} from './NarrativeSynthesisCore';

function makeSource(id: string, type: SynthesisSource['type'], content: string = 'test content', weight: number = 0.5, reliability: number = 0.8): SynthesisSource {
  return { sourceId: id, type, content, weight, reliability };
}

describe('NarrativeSynthesisCore', () => {
  let state: NarrativeSynthesisCoreState;

  beforeEach(() => { state = createNarrativeSynthesisCoreState(); });

  describe('createNarrativeSynthesisCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.outputs.size).toBe(0);
      expect(state.totalOutputs).toBe(0);
    });

    it('should have default efficiency', () => {
      expect(state.synthesisEfficiency).toBe(0.7);
    });
  });

  describe('createSynthesis', () => {
    it('should create synthesis', () => {
      const next = createSynthesis(state, 's1', 'integrative', [makeSource('src1', 'memory')]);
      expect(next.outputs.size).toBe(1);
      expect(next.totalOutputs).toBe(1);
    });

    it('should set initial stage', () => {
      const next = createSynthesis(state, 's1', 'integrative', []);
      expect(next.outputs.get('s1')?.stage).toBe('gathering');
    });
  });

  describe('advanceSynthesisStage', () => {
    it('should advance stage', () => {
      let next = createSynthesis(state, 's1', 'integrative', []);
      next = advanceSynthesisStage(next, 's1', 'analyzing', 'analysis result', 0.7, 0.8, 0.6);
      expect(next.outputs.get('s1')?.stage).toBe('analyzing');
      expect(next.outputs.get('s1')?.qualityScore).toBe(0.7);
    });

    it('should return state for unknown output', () => {
      const next = advanceSynthesisStage(state, 'unknown', 'analyzing', 'r', 0.5, 0.5, 0.5);
      expect(next.totalOutputs).toBe(0);
    });
  });

  describe('addSynthesisSource', () => {
    it('should add source', () => {
      let next = createSynthesis(state, 's1', 'integrative', []);
      next = addSynthesisSource(next, 's1', makeSource('src1', 'memory'));
      expect(next.outputs.get('s1')?.sources.length).toBe(1);
    });

    it('should return state for unknown output', () => {
      const next = addSynthesisSource(state, 'unknown', makeSource('src1', 'memory'));
      expect(next.totalOutputs).toBe(0);
    });
  });

  describe('getOutputsByMode', () => {
    it('should filter by mode', () => {
      let next = createSynthesis(state, 's1', 'additive', []);
      next = createSynthesis(next, 's2', 'integrative', []);
      const additive = getOutputsByMode(next, 'additive');
      expect(additive.length).toBe(1);
    });
  });

  describe('getOutputsByStage', () => {
    it('should filter by stage', () => {
      let next = createSynthesis(state, 's1', 'additive', []);
      next = createSynthesis(next, 's2', 'integrative', []);
      next = advanceSynthesisStage(next, 's1', 'complete', 'r', 0.5, 0.5, 0.5);
      const complete = getOutputsByStage(next, 'complete');
      expect(complete.length).toBe(1);
    });
  });

  describe('getSynthesisCoreReport', () => {
    it('should return comprehensive report', () => {
      const report = getSynthesisCoreReport(state);
      expect(report.totalOutputs).toBe(0);
      expect(typeof report.synthesisEfficiency).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getSynthesisCoreReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeSynthesisCoreState', () => {
    it('should reset all state', () => {
      let next = createSynthesis(state, 's1', 'integrative', []);
      next = resetNarrativeSynthesisCoreState();
      expect(next.outputs.size).toBe(0);
      expect(next.totalOutputs).toBe(0);
    });
  });
});