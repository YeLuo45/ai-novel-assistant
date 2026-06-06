/**
 * V1255 NarrativeAudienceConnectionEngine Tests — Direction H Iter 15/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAudienceConnectionEngineState,
  addAudienceConnection,
  addAudienceConnectionWeb,
  getAudienceConnectionsByType,
  getAudienceConnectionReport,
  resetNarrativeAudienceConnectionEngineState,
  type NarrativeAudienceConnectionEngineState,
} from './NarrativeAudienceConnectionEngine';

describe('NarrativeAudienceConnectionEngine', () => {
  let state: NarrativeAudienceConnectionEngineState;

  beforeEach(() => { state = createNarrativeAudienceConnectionEngineState(); });

  describe('createNarrativeAudienceConnectionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.connections.size).toBe(0);
      expect(state.webs.size).toBe(0);
    });
  });

  describe('addAudienceConnection', () => {
    it('should add connection', () => {
      const next = addAudienceConnection(state, 'c1', 'transcendent', 'soul_level', 'unified', 'desc', 0.95, 0.9, 1);
      expect(next.connections.size).toBe(1);
      expect(next.totalConnections).toBe(1);
    });
  });

  describe('addAudienceConnectionWeb', () => {
    it('should add web', () => {
      let next = addAudienceConnection(state, 'c1', 'transcendent', 'soul_level', 'unified', 'desc', 0.95, 0.9, 1);
      next = addAudienceConnectionWeb(next, 'w1', ['c1']);
      expect(next.totalWebs).toBe(1);
    });
  });

  describe('getAudienceConnectionsByType', () => {
    it('should filter by type', () => {
      let next = addAudienceConnection(state, 'c1', 'transcendent', 'soul_level', 'unified', 'desc', 0.95, 0.9, 1);
      next = addAudienceConnection(next, 'c2', 'emotional', 'soul_level', 'unified', 'desc', 0.95, 0.9, 1);
      const transcendent = getAudienceConnectionsByType(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getAudienceConnectionReport', () => {
    it('should return comprehensive report', () => {
      const report = getAudienceConnectionReport(state);
      expect(report.totalConnections).toBe(0);
      expect(typeof report.audienceConnectionMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAudienceConnectionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAudienceConnectionEngineState', () => {
    it('should reset all state', () => {
      let next = addAudienceConnection(state, 'c1', 'transcendent', 'soul_level', 'unified', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeAudienceConnectionEngineState();
      expect(next.connections.size).toBe(0);
      expect(next.totalConnections).toBe(0);
    });
  });
});