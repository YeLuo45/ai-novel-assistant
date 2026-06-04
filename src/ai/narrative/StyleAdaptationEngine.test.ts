/**
 * V709 StyleAdaptationEngine Tests — Direction D Iter 4/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createStyleAdaptationState,
  createProfile,
  setActiveStyleProfile,
  updateStyleElement,
  getProfilesByRegister,
  getProfilesByTone,
  getStyleAdaptationReport,
  resetStyleAdaptationState,
  type StyleAdaptationState,
} from './StyleAdaptationEngine';

describe('StyleAdaptationEngine', () => {
  let state: StyleAdaptationState;

  beforeEach(() => { state = createStyleAdaptationState(); });

  describe('createStyleAdaptationState', () => {
    it('should initialize with defaults', () => {
      expect(state.profiles.size).toBe(0);
      expect(state.activeProfile).toBeNull();
    });

    it('should have default intensity', () => {
      expect(state.averageIntensity).toBe(0.5);
    });
  });

  describe('createProfile', () => {
    it('should create profile', () => {
      const next = createProfile(state, 'p1', 'Narrator', 'formal', 'serious', 0.7, 'adult');
      expect(next.profiles.size).toBe(1);
      expect(next.totalProfiles).toBe(1);
    });

    it('should set elements', () => {
      const next = createProfile(state, 'p1', 'Narrator', 'formal', 'serious', 0.7, 'adult', { vocabulary: 0.9, imagery: 0.8 });
      const profile = next.profiles.get('p1');
      expect(profile?.elements.get('vocabulary')).toBe(0.9);
    });

    it('should clamp intensity', () => {
      const next = createProfile(state, 'p1', 'P', 'formal', 'serious', 1.5);
      expect(next.profiles.get('p1')?.intensity).toBe(1);
    });
  });

  describe('setActiveStyleProfile', () => {
    it('should set active profile', () => {
      const next = setActiveStyleProfile(state, 'p1');
      expect(next.activeProfile).toBe('p1');
    });
  });

  describe('updateStyleElement', () => {
    it('should update element', () => {
      let next = createProfile(state, 'p1', 'P', 'formal', 'serious');
      next = updateStyleElement(next, 'p1', 'vocabulary', 0.9);
      expect(next.profiles.get('p1')?.elements.get('vocabulary')).toBe(0.9);
    });

    it('should return state for unknown profile', () => {
      const next = updateStyleElement(state, 'unknown', 'vocabulary', 0.9);
      expect(next.profiles.size).toBe(0);
    });
  });

  describe('getProfilesByRegister', () => {
    it('should filter by register', () => {
      let next = createProfile(state, 'p1', 'P1', 'formal', 'serious');
      next = createProfile(next, 'p2', 'P2', 'informal', 'humorous');
      const formal = getProfilesByRegister(next, 'formal');
      expect(formal.length).toBe(1);
    });
  });

  describe('getProfilesByTone', () => {
    it('should filter by tone', () => {
      let next = createProfile(state, 'p1', 'P1', 'formal', 'serious');
      next = createProfile(next, 'p2', 'P2', 'informal', 'humorous');
      const serious = getProfilesByTone(next, 'serious');
      expect(serious.length).toBe(1);
    });
  });

  describe('getStyleAdaptationReport', () => {
    it('should return comprehensive report', () => {
      const report = getStyleAdaptationReport(state);
      expect(report.totalProfiles).toBe(0);
      expect(typeof report.profileDiversity).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStyleAdaptationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should report dominant register and tone', () => {
      let next = createProfile(state, 'p1', 'P1', 'formal', 'serious');
      const report = getStyleAdaptationReport(next);
      expect(report.dominantRegister).toBe('formal');
      expect(report.dominantTone).toBe('serious');
    });
  });

  describe('resetStyleAdaptationState', () => {
    it('should reset all state', () => {
      let next = createProfile(state, 'p1', 'P', 'formal', 'serious');
      next = resetStyleAdaptationState();
      expect(next.profiles.size).toBe(0);
      expect(next.totalProfiles).toBe(0);
    });
  });
});