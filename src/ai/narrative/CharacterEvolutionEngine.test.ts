/**
 * V787 CharacterEvolutionEngine Tests — Direction C Iter 7/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCharacterEvolutionEngineState,
  createCharacterEvolution,
  addEvolutionEvent,
  resolveEvolutionEvent,
  getEventsByCharacter,
  getEventsByType,
  getEvolutionReport,
  resetCharacterEvolutionEngineState,
  type CharacterEvolutionEngineState,
} from './CharacterEvolutionEngine';

describe('CharacterEvolutionEngine', () => {
  let state: CharacterEvolutionEngineState;

  beforeEach(() => { state = createCharacterEvolutionEngineState(); });

  describe('createCharacterEvolutionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.characters.size).toBe(0);
      expect(state.events.size).toBe(0);
    });
  });

  describe('createCharacterEvolution', () => {
    it('should create character evolution', () => {
      const next = createCharacterEvolution(state, 'c1');
      expect(next.characters.size).toBe(1);
      expect(next.totalCharacters).toBe(1);
    });
  });

  describe('addEvolutionEvent', () => {
    it('should add event', () => {
      const next = addEvolutionEvent(state, 'e1', 'c1', 'growth', 'transforming', 'personal', 'learned something', 'mentor', 5);
      expect(next.totalEvents).toBe(1);
    });

    it('should create character if not exists', () => {
      const next = addEvolutionEvent(state, 'e1', 'c1', 'growth', 'transforming', 'personal', 'desc', 'trigger', 5);
      expect(next.characters.has('c1')).toBe(true);
    });

    it('should track breakthroughs', () => {
      const next = addEvolutionEvent(state, 'e1', 'c1', 'breakthrough', 'transformed', 'personal', 'breakthrough!', 'trigger', 5);
      expect(next.characters.get('c1')?.breakthroughs).toBe(1);
    });

    it('should track crises', () => {
      const next = addEvolutionEvent(state, 'e1', 'c1', 'crisis', 'struggling', 'personal', 'crisis!', 'trigger', 5);
      expect(next.characters.get('c1')?.crises).toBe(1);
    });
  });

  describe('resolveEvolutionEvent', () => {
    it('should resolve event', () => {
      let next = addEvolutionEvent(state, 'e1', 'c1', 'growth', 'transforming', 'personal', 'desc', 'trigger', 5);
      next = resolveEvolutionEvent(next, 'e1');
      expect(next.events.get('e1')?.resolved).toBe(true);
    });
  });

  describe('getEventsByCharacter', () => {
    it('should return character events', () => {
      let next = addEvolutionEvent(state, 'e1', 'c1', 'growth', 'transforming', 'personal', 'desc', 'trigger', 5);
      next = addEvolutionEvent(next, 'e2', 'c2', 'growth', 'transforming', 'personal', 'desc', 'trigger', 5);
      const events = getEventsByCharacter(next, 'c1');
      expect(events.length).toBe(1);
    });
  });

  describe('getEventsByType', () => {
    it('should filter by type', () => {
      let next = addEvolutionEvent(state, 'e1', 'c1', 'growth', 'transforming', 'personal', 'desc', 'trigger', 5);
      next = addEvolutionEvent(next, 'e2', 'c1', 'crisis', 'struggling', 'personal', 'desc', 'trigger', 6);
      const growths = getEventsByType(next, 'growth');
      expect(growths.length).toBe(1);
    });
  });

  describe('getEvolutionReport', () => {
    it('should return comprehensive report', () => {
      const report = getEvolutionReport(state);
      expect(report.totalCharacters).toBe(0);
      expect(typeof report.evolutionMomentum).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getEvolutionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetCharacterEvolutionEngineState', () => {
    it('should reset all state', () => {
      let next = createCharacterEvolution(state, 'c1');
      next = resetCharacterEvolutionEngineState();
      expect(next.characters.size).toBe(0);
      expect(next.totalCharacters).toBe(0);
    });
  });
});