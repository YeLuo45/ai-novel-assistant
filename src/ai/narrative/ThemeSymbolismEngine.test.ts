/**
 * V675 ThemeSymbolismEngine Tests — Direction C Iter 5/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createThemeSymbolismState,
  addSymbol,
  addTheme,
  updateThemeEvolution,
  setThemeResolution,
  getThemeSymbolAssociations,
  getDominantTheme,
  getThemeReport,
  resetThemeSymbolismState,
  type ThemeSymbolismState,
} from './ThemeSymbolismEngine';

describe('ThemeSymbolismEngine', () => {
  let state: ThemeSymbolismState;

  beforeEach(() => { state = createThemeSymbolismState(); });

  describe('createThemeSymbolismState', () => {
    it('should initialize with defaults', () => {
      expect(state.symbols.size).toBe(0);
      expect(state.themes.size).toBe(0);
    });

    it('should have default theme coherence', () => {
      expect(state.themeCoherence).toBe(0.6);
    });
  });

  describe('addSymbol', () => {
    it('should add new symbol', () => {
      const next = addSymbol(state, 's1', 'color', 'red rose', 'love and passion', 'scene1', 0.7);
      expect(next.symbols.size).toBe(1);
      expect(next.totalSymbols).toBe(1);
    });

    it('should increment occurrences for existing symbol', () => {
      let next = addSymbol(state, 's1', 'color', 'red rose', 'love', 'scene1');
      next = addSymbol(next, 's1', 'color', 'red rose', 'love', 'scene2');
      expect(next.symbols.get('s1')?.occurrences).toBe(2);
      expect(next.symbols.get('s1')?.scenes.length).toBe(2);
    });

    it('should increase weight on occurrence', () => {
      let next = addSymbol(state, 's1', 'color', 'red rose', 'love', 'scene1', 0.5);
      next = addSymbol(next, 's1', 'color', 'red rose', 'love', 'scene2');
      expect(next.symbols.get('s1')?.thematicWeight).toBeGreaterThan(0.5);
    });
  });

  describe('addTheme', () => {
    it('should add theme', () => {
      const next = addTheme(state, 't1', 'Redemption', 'A story of redemption', 'strong', ['s1']);
      expect(next.themes.size).toBe(1);
      expect(next.totalThemes).toBe(1);
    });

    it('should set theme properties', () => {
      const next = addTheme(state, 't1', 'Love', 'Theme of love', 'central', ['s1', 's2']);
      const theme = next.themes.get('t1');
      expect(theme?.strength).toBe('central');
      expect(theme?.relatedSymbols.length).toBe(2);
    });
  });

  describe('updateThemeEvolution', () => {
    it('should add evolution step', () => {
      let next = addTheme(state, 't1', 'Redemption', 'A redemption arc', 'strong');
      next = updateThemeEvolution(next, 't1', 'Beginning - falls from grace');
      next = updateThemeEvolution(next, 't1', 'Middle - seeks forgiveness');
      expect(next.themes.get('t1')?.evolution.length).toBe(2);
    });

    it('should return state for unknown theme', () => {
      const next = updateThemeEvolution(state, 'unknown', 'step');
      expect(next.themes.size).toBe(0);
    });
  });

  describe('setThemeResolution', () => {
    it('should set resolution status', () => {
      let next = addTheme(state, 't1', 'Redemption', 'Arc', 'strong');
      next = setThemeResolution(next, 't1', 'resolved');
      expect(next.themes.get('t1')?.resolutionStatus).toBe('resolved');
    });
  });

  describe('getThemeSymbolAssociations', () => {
    it('should return associated symbols', () => {
      let next = addSymbol(state, 's1', 'color', 'red', 'love', 'scene1');
      next = addTheme(next, 't1', 'Love', 'Theme of love', 'strong', ['s1']);
      const assoc = getThemeSymbolAssociations(next, 't1');
      expect(assoc.length).toBe(1);
    });

    it('should return empty for unknown theme', () => {
      const assoc = getThemeSymbolAssociations(state, 'unknown');
      expect(assoc).toEqual([]);
    });
  });

  describe('getDominantTheme', () => {
    it('should return null for empty state', () => {
      const dominant = getDominantTheme(state);
      expect(dominant).toBeNull();
    });

    it('should return strongest theme', () => {
      let next = addTheme(state, 't1', 'Weak theme', 'Weak', 'subtle', ['s1']);
      next = addTheme(next, 't2', 'Strong theme', 'Strong', 'central', ['s1', 's2', 's3']);
      const dominant = getDominantTheme(next);
      expect(dominant?.themeId).toBe('t2');
    });
  });

  describe('getThemeReport', () => {
    it('should return comprehensive report', () => {
      const report = getThemeReport(state);
      expect(typeof report.symbolDensity).toBe('number');
      expect(typeof report.themeCoherence).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getThemeReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetThemeSymbolismState', () => {
    it('should reset all state', () => {
      let next = addSymbol(state, 's1', 'color', 'red', 'love', 'scene1');
      next = addTheme(next, 't1', 'Love', 'Arc', 'strong');
      next = resetThemeSymbolismState();
      expect(next.symbols.size).toBe(0);
      expect(next.themes.size).toBe(0);
    });
  });
});