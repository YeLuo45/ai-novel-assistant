/**
 * V1029 CharacterDynamicsEngine Tests — Direction C Iter 2/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCharacterDynamicsEngineState,
  addCharacterDynamic,
  addDynamicEvolution,
  getDynamicsByType,
  getDynamicsReport,
  resetCharacterDynamicsEngineState,
  type CharacterDynamicsEngineState,
} from './CharacterDynamicsEngine';

describe('CharacterDynamicsEngine', () => {
  let state: CharacterDynamicsEngineState;

  beforeEach(() => { state = createCharacterDynamicsEngineState(); });

  describe('createCharacterDynamicsEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.dynamics.size).toBe(0);
      expect(state.evolutions.size).toBe(0);
    });
  });

  describe('addCharacterDynamic', () => {
    it('should add dynamic', () => {
      const next = addCharacterDynamic(state, 'd1', 'rivalry', 'intense', 'climaxing', 'c1', 'c2', 0.8, 0.7, 1);
      expect(next.dynamics.size).toBe(1);
      expect(next.totalDynamics).toBe(1);
    });
  });

  describe('addDynamicEvolution', () => {
    it('should add evolution', () => {
      let next = addCharacterDynamic(state, 'd1', 'rivalry', 'intense', 'climaxing', 'c1', 'c2', 0.8, 0.7, 1);
      next = addDynamicEvolution(next, 'e1', 'd1', 'forming', 'climaxing');
      expect(next.totalEvolutions).toBe(1);
    });
  });

  describe('getDynamicsByType', () => {
    it('should filter by type', () => {
      let next = addCharacterDynamic(state, 'd1', 'rivalry', 'intense', 'climaxing', 'c1', 'c2', 0.8, 0.7, 1);
      next = addCharacterDynamic(next, 'd2', 'romance', 'intense', 'climaxing', 'c1', 'c2', 0.8, 0.7, 1);
      const rival = getDynamicsByType(next, 'rivalry');
      expect(rival.length).toBe(1);
    });
  });

  describe('getDynamicsReport', () => {
    it('should return comprehensive report', () => {
      const report = getDynamicsReport(state);
      expect(report.totalDynamics).toBe(0);
      expect(typeof report.dynamicsMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getDynamicsReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetCharacterDynamicsEngineState', () => {
    it('should reset all state', () => {
      let next = addCharacterDynamic(state, 'd1', 'rivalry', 'intense', 'climaxing', 'c1', 'c2', 0.8, 0.7, 1);
      next = resetCharacterDynamicsEngineState();
      expect(next.dynamics.size).toBe(0);
      expect(next.totalDynamics).toBe(0);
    });
  });
});