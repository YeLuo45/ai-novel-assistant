/**
 * V1191 NarrativeTimeAnchorEngine Tests — Direction G Iter 3/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTimeAnchorEngineState,
  addTimeAnchor,
  addTimeAnchorField,
  getTimeAnchorsByType,
  getTimeAnchorReport,
  resetNarrativeTimeAnchorEngineState,
  type NarrativeTimeAnchorEngineState,
} from './NarrativeTimeAnchorEngine';

describe('NarrativeTimeAnchorEngine', () => {
  let state: NarrativeTimeAnchorEngineState;

  beforeEach(() => { state = createNarrativeTimeAnchorEngineState(); });

  describe('createNarrativeTimeAnchorEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.anchors.size).toBe(0);
      expect(state.fields.size).toBe(0);
    });
  });

  describe('addTimeAnchor', () => {
    it('should add anchor', () => {
      const next = addTimeAnchor(state, 'a1', 'milestone', 'unbreakable', 'searing', 'desc', 0.95, 0.9, 1);
      expect(next.anchors.size).toBe(1);
      expect(next.totalAnchors).toBe(1);
    });
  });

  describe('addTimeAnchorField', () => {
    it('should add field', () => {
      let next = addTimeAnchor(state, 'a1', 'milestone', 'unbreakable', 'searing', 'desc', 0.95, 0.9, 1);
      next = addTimeAnchorField(next, 'f1', ['a1']);
      expect(next.totalFields).toBe(1);
    });
  });

  describe('getTimeAnchorsByType', () => {
    it('should filter by type', () => {
      let next = addTimeAnchor(state, 'a1', 'milestone', 'unbreakable', 'searing', 'desc', 0.95, 0.9, 1);
      next = addTimeAnchor(next, 'a2', 'event', 'unbreakable', 'searing', 'desc', 0.95, 0.9, 1);
      const milestone = getTimeAnchorsByType(next, 'milestone');
      expect(milestone.length).toBe(1);
    });
  });

  describe('getTimeAnchorReport', () => {
    it('should return comprehensive report', () => {
      const report = getTimeAnchorReport(state);
      expect(report.totalAnchors).toBe(0);
      expect(typeof report.timeAnchorMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTimeAnchorReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTimeAnchorEngineState', () => {
    it('should reset all state', () => {
      let next = addTimeAnchor(state, 'a1', 'milestone', 'unbreakable', 'searing', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeTimeAnchorEngineState();
      expect(next.anchors.size).toBe(0);
      expect(next.totalAnchors).toBe(0);
    });
  });
});