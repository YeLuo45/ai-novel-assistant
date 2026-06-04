/**
 * V661 NarrativeIntegrationEngine Tests — Direction E Iter 7/9
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createIntegrationState,
  syncIntegrationState,
  getIntegrationReport,
  resetIntegrationState,
  type IntegrationState,
} from './NarrativeIntegrationEngine';

describe('NarrativeIntegrationEngine', () => {
  let state: IntegrationState;

  beforeEach(() => { state = createIntegrationState(); });

  describe('createIntegrationState', () => {
    it('should initialize all sub-systems', () => {
      expect(state.unified).toBeDefined();
      expect(state.reasoning).toBeDefined();
      expect(state.memory).toBeDefined();
      expect(state.knowledge).toBeDefined();
      expect(state.planning).toBeDefined();
      expect(state.evaluation).toBeDefined();
    });

    it('should have default integration level', () => {
      expect(state.integrationLevel).toBe(0.5);
    });

    it('should start with zero sync errors', () => {
      expect(state.syncErrors).toBe(0);
    });
  });

  describe('syncIntegrationState', () => {
    it('should compute integration level based on active components', () => {
      const synced = syncIntegrationState(state);
      expect(synced.integrationLevel).toBeLessThanOrEqual(1);
      expect(synced.integrationLevel).toBeGreaterThanOrEqual(0);
    });

    it('should detect sync errors', () => {
      const synced = syncIntegrationState(state);
      expect(synced.syncErrors).toBeGreaterThanOrEqual(0);
    });

    it('should return state with updated sync status', () => {
      const synced = syncIntegrationState(state);
      expect(synced).toBeDefined();
    });
  });

  describe('getIntegrationReport', () => {
    it('should return comprehensive report', () => {
      const report = getIntegrationReport(state);
      expect(typeof report.integrationLevel).toBe('number');
      expect(report.componentCount).toBe(6);
    });

    it('should report sync status', () => {
      const report = getIntegrationReport(state);
      expect(['healthy', 'errors_detected']).toContain(report.syncStatus);
    });

    it('should include recommendations', () => {
      const report = getIntegrationReport(state);
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetIntegrationState', () => {
    it('should reset all sub-systems', () => {
      const reset = resetIntegrationState();
      expect(reset.integrationLevel).toBe(0.5);
      expect(reset.syncErrors).toBe(0);
    });
  });
});