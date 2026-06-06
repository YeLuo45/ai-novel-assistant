/**
 * V887 WorldSociologyEngine Tests — Direction C Iter 6/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWorldSociologyEngineState,
  addSocialGroup,
  addInstitution,
  getGroupsByClass,
  getSociologyReport,
  resetWorldSociologyEngineState,
  type WorldSociologyEngineState,
} from './WorldSociologyEngine';

describe('WorldSociologyEngine', () => {
  let state: WorldSociologyEngineState;

  beforeEach(() => { state = createWorldSociologyEngineState(); });

  describe('createWorldSociologyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.groups.size).toBe(0);
      expect(state.institutions.size).toBe(0);
    });
  });

  describe('addSocialGroup', () => {
    it('should add group', () => {
      const next = addSocialGroup(state, 'g1', 'Nobles', 'nobility', 100, 0.8, 1, ['land'], ['taxes']);
      expect(next.groups.size).toBe(1);
      expect(next.totalGroups).toBe(1);
    });
  });

  describe('addInstitution', () => {
    it('should add institution', () => {
      const next = addInstitution(state, 'i1', 'Crown', 'government', 0.9, 0.8, 'king', false);
      expect(next.totalInstitutions).toBe(1);
    });
  });

  describe('getGroupsByClass', () => {
    it('should filter by class', () => {
      let next = addSocialGroup(state, 'g1', 'Nobles', 'nobility', 100, 0.8, 1);
      next = addSocialGroup(next, 'g2', 'Peasants', 'peasant', 10000, 0.2, 1);
      const nobles = getGroupsByClass(next, 'nobility');
      expect(nobles.length).toBe(1);
    });
  });

  describe('getSociologyReport', () => {
    it('should return comprehensive report', () => {
      const report = getSociologyReport(state);
      expect(report.totalGroups).toBe(0);
      expect(typeof report.socialStability).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getSociologyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetWorldSociologyEngineState', () => {
    it('should reset all state', () => {
      let next = addSocialGroup(state, 'g1', 'Nobles', 'nobility', 100, 0.8, 1);
      next = resetWorldSociologyEngineState();
      expect(next.groups.size).toBe(0);
      expect(next.totalGroups).toBe(0);
    });
  });
});