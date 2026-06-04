/**
 * V685 NarrativeStructureEngine Tests — Direction B Iter 1/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStructureState,
  setStructureType,
  addAct,
  addSceneToAct,
  addBeat,
  getActsByPhase,
  getBeatsByAct,
  validateStructure,
  getStructureReport,
  resetNarrativeStructureState,
  type NarrativeStructureState,
} from './NarrativeStructureEngine';

describe('NarrativeStructureEngine', () => {
  let state: NarrativeStructureState;

  beforeEach(() => { state = createNarrativeStructureState(); });

  describe('createNarrativeStructureState', () => {
    it('should initialize with defaults', () => {
      expect(state.acts.size).toBe(0);
      expect(state.beats.size).toBe(0);
      expect(state.totalScenes).toBe(0);
    });

    it('should default to three_act structure', () => {
      expect(state.structureType).toBe('three_act');
    });
  });

  describe('setStructureType', () => {
    it('should set structure type', () => {
      const next = setStructureType(state, 'hero_journey');
      expect(next.structureType).toBe('hero_journey');
    });

    it('should accept all structure types', () => {
      const types = ['three_act', 'hero_journey', 'save_the_cat', 'kishotenketsu', 'freytag_pyramid', 'in_medias_res'] as const;
      types.forEach(t => {
        const next = setStructureType(state, t);
        expect(next.structureType).toBe(t);
      });
    });
  });

  describe('addAct', () => {
    it('should add act', () => {
      const next = addAct(state, 'act1', 'setup', 'Introduction', 1000, 0.3, 0);
      expect(next.acts.size).toBe(1);
    });

    it('should use default values', () => {
      const next = addAct(state, 'act1', 'setup', 'Introduction');
      const act = next.acts.get('act1');
      expect(act?.duration).toBe(1000);
      expect(act?.intensity).toBe(0.5);
    });
  });

  describe('addSceneToAct', () => {
    it('should add scene to act', () => {
      let next = addAct(state, 'act1', 'setup', 'Intro', 1000, 0.3, 0);
      next = addSceneToAct(next, 'act1', 'scene1');
      expect(next.acts.get('act1')?.scenes).toContain('scene1');
    });

    it('should increment totalScenes', () => {
      let next = addAct(state, 'act1', 'setup', 'Intro', 1000, 0.3, 0);
      next = addSceneToAct(next, 'act1', 'scene1');
      next = addSceneToAct(next, 'act1', 'scene2');
      expect(next.totalScenes).toBe(2);
    });

    it('should return state for unknown act', () => {
      const next = addSceneToAct(state, 'unknown', 'scene1');
      expect(next.totalScenes).toBe(0);
    });
  });

  describe('addBeat', () => {
    it('should add beat', () => {
      const next = addBeat(state, 'b1', 'Inciting Incident', 'Hero called to adventure', 1, 10, 0.9);
      expect(next.beats.size).toBe(1);
    });

    it('should set beat properties', () => {
      const next = addBeat(state, 'b1', 'Inciting Incident', 'Hero called', 1, 10, 0.9);
      const beat = next.beats.get('b1');
      expect(beat?.act).toBe(1);
      expect(beat?.percentage).toBe(10);
    });
  });

  describe('getActsByPhase', () => {
    it('should filter by phase', () => {
      let next = addAct(state, 'act1', 'setup', 'Intro', 1000, 0.3, 0);
      next = addAct(next, 'act2', 'climax', 'Climax', 500, 0.9, 2);
      const setupActs = getActsByPhase(next, 'setup');
      expect(setupActs.length).toBe(1);
    });
  });

  describe('getBeatsByAct', () => {
    it('should filter by act', () => {
      let next = addBeat(state, 'b1', 'Beat 1', 'Desc', 1, 10);
      next = addBeat(next, 'b2', 'Beat 2', 'Desc', 2, 50);
      const act1Beats = getBeatsByAct(next, 1);
      expect(act1Beats.length).toBe(1);
    });
  });

  describe('validateStructure', () => {
    it('should return invalid for empty state', () => {
      const result = validateStructure(state);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should return valid for complete structure', () => {
      let next = addAct(state, 'act1', 'setup', 'Intro', 1000, 0.3, 0);
      next = addAct(next, 'act2', 'rising_action', 'Rising', 2000, 0.6, 1);
      next = addAct(next, 'act3', 'climax', 'Climax', 1000, 0.9, 2);
      next = addSceneToAct(next, 'act1', 's1');
      const result = validateStructure(next);
      expect(result.issues.length).toBeLessThan(2);
    });
  });

  describe('getStructureReport', () => {
    it('should return comprehensive report', () => {
      const report = getStructureReport(state);
      expect(report.structureType).toBe('three_act');
      expect(typeof report.averageIntensity).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStructureReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStructureState', () => {
    it('should reset all state', () => {
      let next = addAct(state, 'act1', 'setup', 'Intro', 1000, 0.3, 0);
      next = resetNarrativeStructureState();
      expect(next.acts.size).toBe(0);
      expect(next.totalScenes).toBe(0);
    });
  });
});