/**
 * V943 NarrativeAbstractionEngine Tests — Direction E Iter 4/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAbstractionEngineState,
  addAbstractElement,
  createAbstractionChain,
  getElementsByLevel,
  getAbstractionReport,
  resetNarrativeAbstractionEngineState,
  type NarrativeAbstractionEngineState,
} from './NarrativeAbstractionEngine';

describe('NarrativeAbstractionEngine', () => {
  let state: NarrativeAbstractionEngineState;

  beforeEach(() => { state = createNarrativeAbstractionEngineState(); });

  describe('createNarrativeAbstractionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.elements.size).toBe(0);
      expect(state.chains.size).toBe(0);
    });
  });

  describe('addAbstractElement', () => {
    it('should add element', () => {
      const next = addAbstractElement(state, 'e1', 'love', 'universal', 'generalize', 'desc', 'source', 0.8, 1);
      expect(next.elements.size).toBe(1);
      expect(next.totalElements).toBe(1);
    });
  });

  describe('createAbstractionChain', () => {
    it('should create chain', () => {
      let next = addAbstractElement(state, 'e1', 'love', 'universal', 'generalize', 'desc', 'source', 0.8, 1);
      next = addAbstractElement(next, 'e2', 'specific love', 'concrete', 'lift', 'desc', 'source', 0.6, 1);
      next = createAbstractionChain(next, 'c1', 'love chain', ['e1', 'e2']);
      expect(next.totalChains).toBe(1);
    });
  });

  describe('getElementsByLevel', () => {
    it('should filter by level', () => {
      let next = addAbstractElement(state, 'e1', 'love', 'universal', 'generalize', 'desc', 'source', 0.8, 1);
      next = addAbstractElement(next, 'e2', 'concrete', 'concrete', 'lift', 'desc', 'source', 0.6, 1);
      const universal = getElementsByLevel(next, 'universal');
      expect(universal.length).toBe(1);
    });
  });

  describe('getAbstractionReport', () => {
    it('should return comprehensive report', () => {
      const report = getAbstractionReport(state);
      expect(report.totalElements).toBe(0);
      expect(typeof report.abstractionMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAbstractionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAbstractionEngineState', () => {
    it('should reset all state', () => {
      let next = addAbstractElement(state, 'e1', 'love', 'universal', 'generalize', 'desc', 'source', 0.8, 1);
      next = resetNarrativeAbstractionEngineState();
      expect(next.elements.size).toBe(0);
      expect(next.totalElements).toBe(0);
    });
  });
});