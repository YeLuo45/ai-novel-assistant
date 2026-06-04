/**
 * V699 ProseStyleEngine Tests — Direction B Iter 8/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createProseStyleState,
  analyzeProse,
  getStyleReport,
  resetProseStyleState,
  type ProseStyleState,
} from './ProseStyleEngine';

describe('ProseStyleEngine', () => {
  let state: ProseStyleState;

  beforeEach(() => { state = createProseStyleState(); });

  describe('createProseStyleState', () => {
    it('should initialize with defaults', () => {
      expect(state.totalAnalyses).toBe(0);
      expect(state.styleScores.size).toBe(0);
    });

    it('should have default metrics', () => {
      expect(state.metrics.sentenceLengthAvg).toBe(15);
      expect(state.metrics.passiveVoiceRatio).toBe(0.2);
    });
  });

  describe('analyzeProse', () => {
    it('should analyze simple text', () => {
      const next = analyzeProse(state, 'The cat sat on the mat. The dog ran fast.');
      expect(next.totalAnalyses).toBe(1);
    });

    it('should compute sentence length', () => {
      const next = analyzeProse(state, 'The cat sat on the mat. The dog ran fast.');
      expect(next.metrics.sentenceLengthAvg).toBeGreaterThan(0);
    });

    it('should compute lexical diversity', () => {
      const next = analyzeProse(state, 'The the the the the the.');
      expect(next.metrics.lexicalDiversity).toBeLessThan(0.5);
    });

    it('should detect passive voice', () => {
      const next = analyzeProse(state, 'The cake was baked by John. The window was broken yesterday.');
      expect(next.metrics.passiveVoiceRatio).toBeGreaterThan(0);
    });

    it('should detect adverbs', () => {
      const next = analyzeProse(state, 'She ran quickly. He spoke softly and gently.');
      expect(next.metrics.adverbUsage).toBeGreaterThan(0);
    });

    it('should compute word complexity', () => {
      const next = analyzeProse(state, 'Beautiful extraordinary magnificent.');
      expect(next.metrics.wordComplexity).toBeGreaterThan(0.5);
    });

    it('should detect metaphors', () => {
      const next = analyzeProse(state, 'She was as brave as a lion. He fought like a tiger.');
      expect(next.metrics.metaphorDensity).toBeGreaterThan(0);
    });

    it('should compute style scores', () => {
      const next = analyzeProse(state, 'Simple. Clear. Direct.');
      expect(next.styleScores.size).toBe(6);
    });

    it('should generate improvements for issues', () => {
      const next = analyzeProse(state, 'The book was read quickly. The ball was thrown gently and softly. The very long sentence goes on and on and on with many many many many many many many many many words.');
      expect(next.improvements.length).toBeGreaterThan(0);
    });
  });

  describe('getStyleReport', () => {
    it('should return comprehensive report', () => {
      const report = getStyleReport(state);
      expect(report.totalAnalyses).toBe(0);
      expect(typeof report.overallQuality).toBe('number');
    });

    it('should include style scores', () => {
      let next = analyzeProse(state, 'Simple text here.');
      const report = getStyleReport(next);
      expect(Object.keys(report.styleScores).length).toBe(6);
    });
  });

  describe('resetProseStyleState', () => {
    it('should reset all state', () => {
      let next = analyzeProse(state, 'Some text here.');
      next = resetProseStyleState();
      expect(next.totalAnalyses).toBe(0);
    });
  });
});