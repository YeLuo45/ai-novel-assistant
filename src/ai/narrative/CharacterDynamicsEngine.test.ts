/**
 * V867 CharacterDynamicsEngine Tests — Direction B Iter 11/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCharacterDynamicsEngineState,
  createCharacterGroup,
  addGroupMember,
  recordGroupEvent,
  updateGroupCohesion,
  getGroupsByDynamic,
  getCharacterDynamicsReport,
  resetCharacterDynamicsEngineState,
  type CharacterDynamicsEngineState,
} from './CharacterDynamicsEngine';

describe('CharacterDynamicsEngine', () => {
  let state: CharacterDynamicsEngineState;

  beforeEach(() => { state = createCharacterDynamicsEngineState(); });

  describe('createCharacterDynamicsEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.groups.size).toBe(0);
      expect(state.members.size).toBe(0);
    });
  });

  describe('createCharacterGroup', () => {
    it('should create group', () => {
      const next = createCharacterGroup(state, 'g1', 'Fellowship', 'collaboration', 1);
      expect(next.groups.size).toBe(1);
      expect(next.totalGroups).toBe(1);
    });
  });

  describe('addGroupMember', () => {
    it('should add member', () => {
      let next = createCharacterGroup(state, 'g1', 'Fellowship', 'collaboration', 1);
      next = addGroupMember(next, 'm1', 'g1', 'c1', 'leader', 0.8);
      expect(next.totalMembers).toBe(1);
    });

    it('should update group', () => {
      let next = createCharacterGroup(state, 'g1', 'Fellowship', 'collaboration', 1);
      next = addGroupMember(next, 'm1', 'g1', 'c1', 'leader');
      expect(next.groups.get('g1')?.members.length).toBe(1);
    });
  });

  describe('recordGroupEvent', () => {
    it('should record event', () => {
      let next = createCharacterGroup(state, 'g1', 'Fellowship', 'collaboration', 1);
      next = recordGroupEvent(next, 'e1', 'g1', 'alliance', 'joined forces', 5, 0.7);
      expect(next.totalEvents).toBe(1);
    });
  });

  describe('updateGroupCohesion', () => {
    it('should update', () => {
      let next = createCharacterGroup(state, 'g1', 'Fellowship', 'collaboration', 1);
      next = updateGroupCohesion(next, 'g1', 0.9, 0.85);
      expect(next.groups.get('g1')?.cohesion).toBe(0.9);
    });
  });

  describe('getGroupsByDynamic', () => {
    it('should filter by dynamic', () => {
      let next = createCharacterGroup(state, 'g1', 'Fellowship', 'collaboration', 1);
      next = createCharacterGroup(next, 'g2', 'Rivals', 'conflict', 1);
      const collab = getGroupsByDynamic(next, 'collaboration');
      expect(collab.length).toBe(1);
    });
  });

  describe('getCharacterDynamicsReport', () => {
    it('should return comprehensive report', () => {
      const report = getCharacterDynamicsReport(state);
      expect(report.totalGroups).toBe(0);
      expect(typeof report.dynamicsRichness).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCharacterDynamicsReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetCharacterDynamicsEngineState', () => {
    it('should reset all state', () => {
      let next = createCharacterGroup(state, 'g1', 'Fellowship', 'collaboration', 1);
      next = resetCharacterDynamicsEngineState();
      expect(next.groups.size).toBe(0);
      expect(next.totalGroups).toBe(0);
    });
  });
});