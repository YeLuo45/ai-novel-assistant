/**
 * V1183 NarrativeStyleFingerprintEngine Tests — Direction F Iter 19/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStyleFingerprintEngineState,
  addStyleFingerprint,
  addStyleFingerprintPattern,
  getStyleFingerprintsByType,
  getStyleFingerprintReport,
  resetNarrativeStyleFingerprintEngineState,
  type NarrativeStyleFingerprintEngineState,
} from './NarrativeStyleFingerprintEngine';

describe('NarrativeStyleFingerprintEngine', () => {
  let state: NarrativeStyleFingerprintEngineState;

  beforeEach(() => { state = createNarrativeStyleFingerprintEngineState(); });

  describe('createNarrativeStyleFingerprintEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.fingerprints.size).toBe(0);
      expect(state.patterns.size).toBe(0);
    });
  });

  describe('addStyleFingerprint', () => {
    it('should add fingerprint', () => {
      const next = addStyleFingerprint(state, 'f1', 'composite', 'singular', 'fixed', 'desc', 0.95, 0.9, 1);
      expect(next.fingerprints.size).toBe(1);
      expect(next.totalFingerprints).toBe(1);
    });
  });

  describe('addStyleFingerprintPattern', () => {
    it('should add pattern', () => {
      let next = addStyleFingerprint(state, 'f1', 'composite', 'singular', 'fixed', 'desc', 0.95, 0.9, 1);
      next = addStyleFingerprintPattern(next, 'p1', ['f1']);
      expect(next.totalPatterns).toBe(1);
    });
  });

  describe('getStyleFingerprintsByType', () => {
    it('should filter by type', () => {
      let next = addStyleFingerprint(state, 'f1', 'composite', 'singular', 'fixed', 'desc', 0.95, 0.9, 1);
      next = addStyleFingerprint(next, 'f2', 'lexical', 'singular', 'fixed', 'desc', 0.95, 0.9, 1);
      const composite = getStyleFingerprintsByType(next, 'composite');
      expect(composite.length).toBe(1);
    });
  });

  describe('getStyleFingerprintReport', () => {
    it('should return comprehensive report', () => {
      const report = getStyleFingerprintReport(state);
      expect(report.totalFingerprints).toBe(0);
      expect(typeof report.styleFingerprintMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStyleFingerprintReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStyleFingerprintEngineState', () => {
    it('should reset all state', () => {
      let next = addStyleFingerprint(state, 'f1', 'composite', 'singular', 'fixed', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeStyleFingerprintEngineState();
      expect(next.fingerprints.size).toBe(0);
      expect(next.totalFingerprints).toBe(0);
    });
  });
});