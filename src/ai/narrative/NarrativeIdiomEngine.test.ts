/**
 * V1173 NarrativeIdiomEngine Tests — Direction F Iter 14/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeIdiomEngineState,
  addIdiom,
  addIdiomField,
  getIdiomsByType,
  getIdiomReport,
  resetNarrativeIdiomEngineState,
  type NarrativeIdiomEngineState,
} from './NarrativeIdiomEngine';

describe('NarrativeIdiomEngine', () => {
  let state: NarrativeIdiomEngineState;

  beforeEach(() => { state = createNarrativeIdiomEngineState(); });

  describe('createNarrativeIdiomEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.idioms.size).toBe(0);
      expect(state.fields.size).toBe(0);
    });
  });

  describe('addIdiom', () => {
    it('should add idiom', () => {
      const next = addIdiom(state, 'i1', 'proverbial', 'inevitable', 'fresh', 'desc', 0.9, 0.85, 1);
      expect(next.idioms.size).toBe(1);
      expect(next.totalIdioms).toBe(1);
    });
  });

  describe('addIdiomField', () => {
    it('should add field', () => {
      let next = addIdiom(state, 'i1', 'proverbial', 'inevitable', 'fresh', 'desc', 0.9, 0.85, 1);
      next = addIdiomField(next, 'f1', ['i1']);
      expect(next.totalFields).toBe(1);
    });
  });

  describe('getIdiomsByType', () => {
    it('should filter by type', () => {
      let next = addIdiom(state, 'i1', 'proverbial', 'inevitable', 'fresh', 'desc', 0.9, 0.85, 1);
      next = addIdiom(next, 'i2', 'cultural', 'inevitable', 'fresh', 'desc', 0.9, 0.85, 1);
      const proverbial = getIdiomsByType(next, 'proverbial');
      expect(proverbial.length).toBe(1);
    });
  });

  describe('getIdiomReport', () => {
    it('should return comprehensive report', () => {
      const report = getIdiomReport(state);
      expect(report.totalIdioms).toBe(0);
      expect(typeof report.idiomMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getIdiomReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeIdiomEngineState', () => {
    it('should reset all state', () => {
      let next = addIdiom(state, 'i1', 'proverbial', 'inevitable', 'fresh', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeIdiomEngineState();
      expect(next.idioms.size).toBe(0);
      expect(next.totalIdioms).toBe(0);
    });
  });
});