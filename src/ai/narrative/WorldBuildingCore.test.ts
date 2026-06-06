/**
 * V863 WorldBuildingCore Tests — Direction B Iter 9/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWorldBuildingCoreState,
  addWorldElement,
  advanceElementStage,
  addWorldRule,
  addRuleException,
  getElementsByAspect,
  getWorldBuildingReport,
  resetWorldBuildingCoreState,
  type WorldBuildingCoreState,
} from './WorldBuildingCore';

describe('WorldBuildingCore', () => {
  let state: WorldBuildingCoreState;

  beforeEach(() => { state = createWorldBuildingCoreState(); });

  describe('createWorldBuildingCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.elements.size).toBe(0);
      expect(state.rules.size).toBe(0);
    });
  });

  describe('addWorldElement', () => {
    it('should add element', () => {
      const next = addWorldElement(state, 'e1', 'geography', 'Capital', 'The great capital', 0.7);
      expect(next.elements.size).toBe(1);
      expect(next.totalElements).toBe(1);
    });

    it('should clamp detail', () => {
      const next = addWorldElement(state, 'e1', 'geography', 'name', 'desc', 1.5);
      expect(next.elements.get('e1')?.detail).toBe(1);
    });
  });

  describe('advanceElementStage', () => {
    it('should advance', () => {
      let next = addWorldElement(state, 'e1', 'geography', 'name', 'desc');
      next = advanceElementStage(next, 'e1', 'detailed');
      expect(next.elements.get('e1')?.stage).toBe('detailed');
    });
  });

  describe('addWorldRule', () => {
    it('should add rule', () => {
      const next = addWorldRule(state, 'r1', 'Magic Law', 'Magic requires energy', 0.8);
      expect(next.totalRules).toBe(1);
    });
  });

  describe('addRuleException', () => {
    it('should add exception', () => {
      let next = addWorldRule(state, 'r1', 'Magic Law', 'desc');
      next = addRuleException(next, 'r1', 'ancient artifacts bypass');
      expect(next.rules.get('r1')?.exceptions.length).toBe(1);
    });
  });

  describe('getElementsByAspect', () => {
    it('should filter by aspect', () => {
      let next = addWorldElement(state, 'e1', 'geography', 'name', 'desc');
      next = addWorldElement(next, 'e2', 'culture', 'name', 'desc');
      const geo = getElementsByAspect(next, 'geography');
      expect(geo.length).toBe(1);
    });
  });

  describe('getWorldBuildingReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldBuildingReport(state);
      expect(report.totalElements).toBe(0);
      expect(typeof report.worldRichness).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldBuildingReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetWorldBuildingCoreState', () => {
    it('should reset all state', () => {
      let next = addWorldElement(state, 'e1', 'geography', 'name', 'desc');
      next = resetWorldBuildingCoreState();
      expect(next.elements.size).toBe(0);
      expect(next.totalElements).toBe(0);
    });
  });
});