/**
 * V853 SceneArchitectureEngine Tests — Direction B Iter 4/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSceneArchitectureEngineState,
  createScene,
  updateSceneComponent,
  addSceneTransition,
  getScenesByFunction,
  getSceneArchitectureReport,
  resetSceneArchitectureEngineState,
  type SceneArchitectureEngineState,
} from './SceneArchitectureEngine';

describe('SceneArchitectureEngine', () => {
  let state: SceneArchitectureEngineState;

  beforeEach(() => { state = createSceneArchitectureEngineState(); });

  describe('createSceneArchitectureEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.scenes.size).toBe(0);
      expect(state.transitions.size).toBe(0);
    });
  });

  describe('createScene', () => {
    it('should create scene', () => {
      const next = createScene(state, 's1', 'Opening', 'exposition', 'Castle', 1, 'tense');
      expect(next.scenes.size).toBe(1);
      expect(next.totalScenes).toBe(1);
    });
  });

  describe('updateSceneComponent', () => {
    it('should update component', () => {
      let next = createScene(state, 's1', 'Opening', 'exposition', 'Castle', 1);
      next = updateSceneComponent(next, 's1', 'action', 0.8);
      expect(next.scenes.get('s1')?.components.get('action')).toBe(0.8);
    });

    it('should clamp value', () => {
      let next = createScene(state, 's1', 'Opening', 'exposition', 'Castle', 1);
      next = updateSceneComponent(next, 's1', 'action', 1.5);
      expect(next.scenes.get('s1')?.components.get('action')).toBe(1);
    });
  });

  describe('addSceneTransition', () => {
    it('should add transition', () => {
      const next = addSceneTransition(state, 't1', 's1', 's2', 'cut', 0.8);
      expect(next.totalTransitions).toBe(1);
    });
  });

  describe('getScenesByFunction', () => {
    it('should filter by function', () => {
      let next = createScene(state, 's1', 'Opening', 'exposition', 'Castle', 1);
      next = createScene(next, 's2', 'Battle', 'climax', 'Field', 5);
      const expositions = getScenesByFunction(next, 'exposition');
      expect(expositions.length).toBe(1);
    });
  });

  describe('getSceneArchitectureReport', () => {
    it('should return comprehensive report', () => {
      const report = getSceneArchitectureReport(state);
      expect(report.totalScenes).toBe(0);
      expect(typeof report.averageEffectiveness).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getSceneArchitectureReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetSceneArchitectureEngineState', () => {
    it('should reset all state', () => {
      let next = createScene(state, 's1', 'Opening', 'exposition', 'Castle', 1);
      next = resetSceneArchitectureEngineState();
      expect(next.scenes.size).toBe(0);
      expect(next.totalScenes).toBe(0);
    });
  });
});