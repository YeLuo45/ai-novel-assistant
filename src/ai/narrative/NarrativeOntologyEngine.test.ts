/**
 * V885 NarrativeOntologyEngine Tests — Direction C Iter 5/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeOntologyEngineState,
  addEntity,
  addEntityRelationship,
  createEntityCategory,
  getEntitiesByType,
  getOntologyReport,
  resetNarrativeOntologyEngineState,
  type NarrativeOntologyEngineState,
} from './NarrativeOntologyEngine';

describe('NarrativeOntologyEngine', () => {
  let state: NarrativeOntologyEngineState;

  beforeEach(() => { state = createNarrativeOntologyEngineState(); });

  describe('createNarrativeOntologyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entities.size).toBe(0);
      expect(state.categories.size).toBe(0);
    });
  });

  describe('addEntity', () => {
    it('should add entity', () => {
      const next = addEntity(state, 'e1', 'Sword', 'object', 'real', 'desc', 1, 'pivotal');
      expect(next.entities.size).toBe(1);
      expect(next.significantEntities).toBe(1);
    });
  });

  describe('addEntityRelationship', () => {
    it('should add relationship', () => {
      let next = addEntity(state, 'e1', 'A', 'person', 'real', 'desc', 1);
      next = addEntity(next, 'e2', 'B', 'person', 'real', 'desc', 1);
      next = addEntityRelationship(next, 'e1', 'e2');
      expect(next.entities.get('e1')?.relationships.length).toBe(1);
    });
  });

  describe('createEntityCategory', () => {
    it('should create category', () => {
      const next = createEntityCategory(state, 'c1', 'Main Characters', ['e1'], 'desc', 1);
      expect(next.totalCategories).toBe(1);
    });
  });

  describe('getEntitiesByType', () => {
    it('should filter by type', () => {
      let next = addEntity(state, 'e1', 'A', 'person', 'real', 'desc', 1);
      next = addEntity(next, 'e2', 'B', 'place', 'real', 'desc', 1);
      const persons = getEntitiesByType(next, 'person');
      expect(persons.length).toBe(1);
    });
  });

  describe('getOntologyReport', () => {
    it('should return comprehensive report', () => {
      const report = getOntologyReport(state);
      expect(report.totalEntities).toBe(0);
      expect(typeof report.ontologyRichness).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getOntologyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeOntologyEngineState', () => {
    it('should reset all state', () => {
      let next = addEntity(state, 'e1', 'A', 'person', 'real', 'desc', 1);
      next = resetNarrativeOntologyEngineState();
      expect(next.entities.size).toBe(0);
      expect(next.totalEntities).toBe(0);
    });
  });
});