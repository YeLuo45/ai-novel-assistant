/**
 * V695 ScenePacingEngine Tests — Direction B Iter 6/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createScenePacingState,
  addScene,
  setCurrentPattern,
  getScenesByMood,
  getScenesByPurpose,
  getPacingCurve,
  detectPacingImbalance,
  getPacingReport,
  resetScenePacingState,
  type ScenePacingState,
} from './ScenePacingEngine';

describe('ScenePacingEngine', () => {
  let state: ScenePacingState;

  beforeEach(() => { state = createScenePacingState(); });

  describe('createScenePacingState', () => {
    it('should initialize with defaults', () => {
      expect(state.scenes.size).toBe(0);
      expect(state.totalScenes).toBe(0);
    });

    it('should default to linear pattern', () => {
      expect(state.currentPattern).toBe('linear');
    });
  });

  describe('addScene', () => {
    it('should add scene', () => {
      const next = addScene(state, 's1', 'Opening', 'peaceful', 'exposition', 1000, 0.3, 'linear');
      expect(next.scenes.size).toBe(1);
      expect(next.totalScenes).toBe(1);
    });

    it('should clamp tension', () => {
      const next = addScene(state, 's1', 'Scene', 'tense', 'climax', 1000, 1.5, 'linear');
      expect(next.scenes.get('s1')?.tension).toBe(1);
    });

    it('should track position', () => {
      let next = addScene(state, 's1', 'First', 'peaceful', 'exposition', 1000);
      next = addScene(next, 's2', 'Second', 'tense', 'climax', 1000);
      expect(next.scenes.get('s2')?.position).toBe(1);
    });
  });

  describe('setCurrentPattern', () => {
    it('should set pattern', () => {
      const next = setCurrentPattern(state, 'oscillating');
      expect(next.currentPattern).toBe('oscillating');
    });
  });

  describe('getScenesByMood', () => {
    it('should filter by mood', () => {
      let next = addScene(state, 's1', 'Scene 1', 'peaceful', 'exposition', 1000);
      next = addScene(next, 's2', 'Scene 2', 'tense', 'climax', 1000);
      const peaceful = getScenesByMood(next, 'peaceful');
      expect(peaceful.length).toBe(1);
    });
  });

  describe('getScenesByPurpose', () => {
    it('should filter by purpose', () => {
      let next = addScene(state, 's1', 'Scene 1', 'peaceful', 'exposition', 1000);
      next = addScene(next, 's2', 'Scene 2', 'tense', 'climax', 1000);
      const exposition = getScenesByPurpose(next, 'exposition');
      expect(exposition.length).toBe(1);
    });
  });

  describe('getPacingCurve', () => {
    it('should return tension curve', () => {
      let next = addScene(state, 's1', 'First', 'peaceful', 'exposition', 1000, 0.3);
      next = addScene(next, 's2', 'Second', 'tense', 'climax', 1000, 0.8);
      const curve = getPacingCurve(next);
      expect(curve[0]?.tension).toBe(0.3);
      expect(curve[1]?.tension).toBe(0.8);
    });
  });

  describe('detectPacingImbalance', () => {
    it('should detect high tension', () => {
      let next = addScene(state, 's1', 'Scene', 'tense', 'climax', 1000, 0.95);
      const result = detectPacingImbalance(next);
      expect(result.imbalanced).toBe(true);
    });

    it('should detect low tension', () => {
      let next = addScene(state, 's1', 'Scene', 'peaceful', 'breathing', 1000, 0.05);
      const result = detectPacingImbalance(next);
      expect(result.imbalanced).toBe(true);
    });

    it('should return balanced for moderate tension', () => {
      let next = addScene(state, 's1', 'Scene', 'peaceful', 'exposition', 1000, 0.5);
      const result = detectPacingImbalance(next);
      expect(result.imbalanced).toBe(false);
    });
  });

  describe('getPacingReport', () => {
    it('should return comprehensive report', () => {
      const report = getPacingReport(state);
      expect(report.totalScenes).toBe(0);
      expect(typeof report.averageTension).toBe('number');
    });

    it('should include issues for imbalanced pacing', () => {
      let next = addScene(state, 's1', 'Scene', 'tense', 'climax', 1000, 0.95);
      const report = getPacingReport(next);
      expect(report.imbalanced).toBe(true);
    });
  });

  describe('resetScenePacingState', () => {
    it('should reset all state', () => {
      let next = addScene(state, 's1', 'Scene', 'peaceful', 'exposition', 1000);
      next = resetScenePacingState();
      expect(next.scenes.size).toBe(0);
      expect(next.totalScenes).toBe(0);
    });
  });
});