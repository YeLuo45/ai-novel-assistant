/**
 * V687 CharacterDevelopmentEngine Tests — Direction B Iter 2/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCharacterDevelopmentState,
  startDevelopment,
  advanceDevelopment,
  completeDevelopment,
  getDevelopmentByCharacter,
  getDevelopmentByStage,
  getDevelopmentByType,
  getDevelopmentReport,
  resetCharacterDevelopmentState,
  type CharacterDevelopmentState,
} from './CharacterDevelopmentEngine';

describe('CharacterDevelopmentEngine', () => {
  let state: CharacterDevelopmentState;

  beforeEach(() => { state = createCharacterDevelopmentState(); });

  describe('createCharacterDevelopmentState', () => {
    it('should initialize with defaults', () => {
      expect(state.developments.size).toBe(0);
      expect(state.activeCharacters.size).toBe(0);
    });

    it('should have default progress and complexity', () => {
      expect(state.averageProgress).toBe(0);
      expect(state.arcComplexity).toBe(0.5);
    });
  });

  describe('startDevelopment', () => {
    it('should start development', () => {
      const next = startDevelopment(state, 'g1', 'alice', 'positive', 'ascending', 'Ordinary person');
      expect(next.developments.size).toBe(1);
      expect(next.activeCharacters.size).toBe(1);
      expect(next.totalGrowths).toBe(1);
    });

    it('should set initial stage', () => {
      const next = startDevelopment(state, 'g1', 'alice', 'positive', 'ascending', 'Start');
      expect(next.developments.get('g1')?.stage).toBe('introduction');
    });
  });

  describe('advanceDevelopment', () => {
    it('should advance development', () => {
      let next = startDevelopment(state, 'g1', 'alice', 'positive', 'ascending', 'Start');
      next = advanceDevelopment(next, 'g1', 'struggle', 0.5, 'Mid state');
      expect(next.developments.get('g1')?.stage).toBe('struggle');
      expect(next.developments.get('g1')?.progress).toBe(0.5);
    });

    it('should clamp progress', () => {
      let next = startDevelopment(state, 'g1', 'alice', 'positive', 'ascending', 'Start');
      next = advanceDevelopment(next, 'g1', 'struggle', 1.5);
      expect(next.developments.get('g1')?.progress).toBe(1);
    });

    it('should set end state', () => {
      let next = startDevelopment(state, 'g1', 'alice', 'positive', 'ascending', 'Start');
      next = advanceDevelopment(next, 'g1', 'struggle', 0.5, 'Mid state');
      expect(next.developments.get('g1')?.endState).toBe('Mid state');
    });
  });

  describe('completeDevelopment', () => {
    it('should complete development', () => {
      let next = startDevelopment(state, 'g1', 'alice', 'positive', 'ascending', 'Start');
      next = completeDevelopment(next, 'g1', 'Hero');
      expect(next.developments.get('g1')?.stage).toBe('mastery');
      expect(next.developments.get('g1')?.progress).toBe(1);
      expect(next.completedGrowths).toBe(1);
    });
  });

  describe('getDevelopmentByCharacter', () => {
    it('should return character developments', () => {
      let next = startDevelopment(state, 'g1', 'alice', 'positive', 'ascending', 'Start');
      next = startDevelopment(next, 'g2', 'bob', 'negative', 'descending', 'Start');
      const aliceDevs = getDevelopmentByCharacter(next, 'alice');
      expect(aliceDevs.length).toBe(1);
    });

    it('should return empty for unknown character', () => {
      const devs = getDevelopmentByCharacter(state, 'unknown');
      expect(devs).toEqual([]);
    });
  });

  describe('getDevelopmentByStage', () => {
    it('should filter by stage', () => {
      let next = startDevelopment(state, 'g1', 'alice', 'positive', 'ascending', 'Start');
      next = startDevelopment(next, 'g2', 'bob', 'negative', 'descending', 'Start');
      next = advanceDevelopment(next, 'g1', 'struggle', 0.5);
      const introDevs = getDevelopmentByStage(next, 'introduction');
      expect(introDevs.length).toBe(1);
    });
  });

  describe('getDevelopmentByType', () => {
    it('should filter by type', () => {
      let next = startDevelopment(state, 'g1', 'alice', 'positive', 'ascending', 'Start');
      next = startDevelopment(next, 'g2', 'bob', 'negative', 'descending', 'Start');
      const positiveDevs = getDevelopmentByType(next, 'positive');
      expect(positiveDevs.length).toBe(1);
    });
  });

  describe('getDevelopmentReport', () => {
    it('should return comprehensive report', () => {
      const report = getDevelopmentReport(state);
      expect(report.totalGrowths).toBe(0);
      expect(typeof report.averageProgress).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getDevelopmentReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetCharacterDevelopmentState', () => {
    it('should reset all state', () => {
      let next = startDevelopment(state, 'g1', 'alice', 'positive', 'ascending', 'Start');
      next = resetCharacterDevelopmentState();
      expect(next.developments.size).toBe(0);
      expect(next.activeCharacters.size).toBe(0);
    });
  });
});