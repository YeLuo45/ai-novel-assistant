/**
 * V1079 NarrativeGroundingEngine Tests — Direction D Iter 7/20 (Round 6)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeGroundingEngineState,
  addGroundingEvent,
  addGroundingLayer,
  getGroundingEventsByMode,
  getGroundingReport,
  resetNarrativeGroundingEngineState,
  type NarrativeGroundingEngineState,
} from './NarrativeGroundingEngine';

describe('NarrativeGroundingEngine', () => {
  let state: NarrativeGroundingEngineState;

  beforeEach(() => { state = createNarrativeGroundingEngineState(); });

  describe('createNarrativeGroundingEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.events.size).toBe(0);
      expect(state.layers.size).toBe(0);
    });
  });

  describe('addGroundingEvent', () => {
    it('should add event', () => {
      const next = addGroundingEvent(state, 'e1', 'sensory', 'vivid', 'intimate', 'desc', 0.9, 0.8, 1);
      expect(next.events.size).toBe(1);
      expect(next.totalEvents).toBe(1);
    });
  });

  describe('addGroundingLayer', () => {
    it('should add layer', () => {
      let next = addGroundingEvent(state, 'e1', 'sensory', 'vivid', 'intimate', 'desc', 0.9, 0.8, 1);
      next = addGroundingLayer(next, 'l1', ['e1']);
      expect(next.totalLayers).toBe(1);
    });
  });

  describe('getGroundingEventsByMode', () => {
    it('should filter by mode', () => {
      let next = addGroundingEvent(state, 'e1', 'sensory', 'vivid', 'intimate', 'desc', 0.9, 0.8, 1);
      next = addGroundingEvent(next, 'e2', 'emotional', 'vivid', 'intimate', 'desc', 0.9, 0.8, 1);
      const sens = getGroundingEventsByMode(next, 'sensory');
      expect(sens.length).toBe(1);
    });
  });

  describe('getGroundingReport', () => {
    it('should return comprehensive report', () => {
      const report = getGroundingReport(state);
      expect(report.totalEvents).toBe(0);
      expect(typeof report.groundingMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getGroundingReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeGroundingEngineState', () => {
    it('should reset all state', () => {
      let next = addGroundingEvent(state, 'e1', 'sensory', 'vivid', 'intimate', 'desc', 0.9, 0.8, 1);
      next = resetNarrativeGroundingEngineState();
      expect(next.events.size).toBe(0);
      expect(next.totalEvents).toBe(0);
    });
  });
});