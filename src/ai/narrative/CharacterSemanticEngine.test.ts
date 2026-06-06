/**
 * V897 CharacterSemanticEngine Tests — Direction C Iter 11/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCharacterSemanticEngineState,
  addCharacterSymbol,
  addArchetypePattern,
  getSymbolsByArchetype,
  getCharacterSemanticReport,
  resetCharacterSemanticEngineState,
  type CharacterSemanticEngineState,
} from './CharacterSemanticEngine';

describe('CharacterSemanticEngine', () => {
  let state: CharacterSemanticEngineState;

  beforeEach(() => { state = createCharacterSemanticEngineState(); });

  describe('createCharacterSemanticEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.symbols.size).toBe(0);
      expect(state.patterns.size).toBe(0);
    });
  });

  describe('addCharacterSymbol', () => {
    it('should add symbol', () => {
      const next = addCharacterSymbol(state, 's1', 'c1', 'hero', 'representational', 'savior', 'deep', 0.8);
      expect(next.symbols.size).toBe(1);
      expect(next.totalSymbols).toBe(1);
    });

    it('should clamp resonance', () => {
      const next = addCharacterSymbol(state, 's1', 'c1', 'hero', 'representational', 'desc', 'moderate', 1.5);
      expect(next.symbols.get('s1')?.resonance).toBe(1);
    });
  });

  describe('addArchetypePattern', () => {
    it('should add pattern', () => {
      const next = addArchetypePattern(state, 'p1', 'Hero journey', ['s1'], 0.7);
      expect(next.totalPatterns).toBe(1);
    });
  });

  describe('getSymbolsByArchetype', () => {
    it('should filter by archetype', () => {
      let next = addCharacterSymbol(state, 's1', 'c1', 'hero', 'representational', 'desc');
      next = addCharacterSymbol(next, 's2', 'c2', 'shadow', 'representational', 'desc');
      const heroes = getSymbolsByArchetype(next, 'hero');
      expect(heroes.length).toBe(1);
    });
  });

  describe('getCharacterSemanticReport', () => {
    it('should return comprehensive report', () => {
      const report = getCharacterSemanticReport(state);
      expect(report.totalSymbols).toBe(0);
      expect(typeof report.symbolicRichness).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCharacterSemanticReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetCharacterSemanticEngineState', () => {
    it('should reset all state', () => {
      let next = addCharacterSymbol(state, 's1', 'c1', 'hero', 'representational', 'desc');
      next = resetCharacterSemanticEngineState();
      expect(next.symbols.size).toBe(0);
      expect(next.totalSymbols).toBe(0);
    });
  });
});