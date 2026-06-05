/**
 * V859 ThemeDevelopmentEngine Tests — Direction B Iter 7/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createThemeDevelopmentEngineState,
  addTheme,
  advanceThemeStage,
  addThematicMoment,
  resolveThematicMoment,
  getThemesByType,
  getThemeDevelopmentReport,
  resetThemeDevelopmentEngineState,
  type ThemeDevelopmentEngineState,
} from './ThemeDevelopmentEngine';

describe('ThemeDevelopmentEngine', () => {
  let state: ThemeDevelopmentEngineState;

  beforeEach(() => { state = createThemeDevelopmentEngineState(); });

  describe('createThemeDevelopmentEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.themes.size).toBe(0);
      expect(state.moments.size).toBe(0);
    });
  });

  describe('addTheme', () => {
    it('should add theme', () => {
      const next = addTheme(state, 't1', 'moral', 'Good vs Evil', 'What is good?', true, 'central');
      expect(next.themes.size).toBe(1);
      expect(next.centralThemes).toBe(1);
    });
  });

  describe('advanceThemeStage', () => {
    it('should advance', () => {
      let next = addTheme(state, 't1', 'moral', 'desc', 'q');
      next = advanceThemeStage(next, 't1', 'explored');
      expect(next.themes.get('t1')?.stage).toBe('explored');
    });
  });

  describe('addThematicMoment', () => {
    it('should add moment', () => {
      let next = addTheme(state, 't1', 'moral', 'desc', 'q');
      next = addThematicMoment(next, 'm1', 't1', 'description', 5, 0.8);
      expect(next.totalMoments).toBe(1);
    });

    it('should update theme', () => {
      let next = addTheme(state, 't1', 'moral', 'desc', 'q');
      next = addThematicMoment(next, 'm1', 't1', 'description', 5);
      expect(next.themes.get('t1')?.chapters.length).toBe(1);
    });
  });

  describe('resolveThematicMoment', () => {
    it('should resolve', () => {
      let next = addTheme(state, 't1', 'moral', 'desc', 'q');
      next = addThematicMoment(next, 'm1', 't1', 'desc', 5);
      next = resolveThematicMoment(next, 'm1');
      expect(next.moments.get('m1')?.resolved).toBe(true);
    });
  });

  describe('getThemesByType', () => {
    it('should filter by type', () => {
      let next = addTheme(state, 't1', 'moral', 'desc', 'q');
      next = addTheme(next, 't2', 'cultural', 'desc', 'q');
      const morals = getThemesByType(next, 'moral');
      expect(morals.length).toBe(1);
    });
  });

  describe('getThemeDevelopmentReport', () => {
    it('should return comprehensive report', () => {
      const report = getThemeDevelopmentReport(state);
      expect(report.totalThemes).toBe(0);
      expect(typeof report.thematicDepth).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getThemeDevelopmentReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetThemeDevelopmentEngineState', () => {
    it('should reset all state', () => {
      let next = addTheme(state, 't1', 'moral', 'desc', 'q');
      next = resetThemeDevelopmentEngineState();
      expect(next.themes.size).toBe(0);
      expect(next.totalThemes).toBe(0);
    });
  });
});