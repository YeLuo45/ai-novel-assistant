/**
 * V1089 NarrativeExpansionEngine Tests — Direction D Iter 12/20 (Round 6)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeExpansionEngineState,
  addExpansionEvent,
  addExpansionArc,
  getExpansionEventsByType,
  getExpansionReport,
  resetNarrativeExpansionEngineState,
  type NarrativeExpansionEngineState,
} from './NarrativeExpansionEngine';

describe('NarrativeExpansionEngine', () => {
  let state: NarrativeExpansionEngineState;

  beforeEach(() => { state = createNarrativeExpansionEngineState(); });

  describe('createNarrativeExpansionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.events.size).toBe(0);
      expect(state.arcs.size).toBe(0);
    });
  });

  describe('addExpansionEvent', () => {
    it('should add event', () => {
      const next = addExpansionEvent(state, 'e1', 'descriptive', 'rich', 'important', 'desc', 0.3, 0.9);
      expect(next.events.size).toBe(1);
      expect(next.totalEvents).toBe(1);
    });
  });

  describe('addExpansionArc', () => {
    it('should add arc', () => {
      let next = addExpansionEvent(state, 'e1', 'descriptive', 'rich', 'important', 'desc', 0.3, 0.9);
      next = addExpansionArc(next, 'a1', ['e1']);
      expect(next.totalArcs).toBe(1);
    });
  });

  describe('getExpansionEventsByType', () => {
    it('should filter by type', () => {
      let next = addExpansionEvent(state, 'e1', 'descriptive', 'rich', 'important', 'desc', 0.3, 0.9);
      next = addExpansionEvent(next, 'e2', 'emotional', 'rich', 'important', 'desc', 0.3, 0.9);
      const desc = getExpansionEventsByType(next, 'descriptive');
      expect(desc.length).toBe(1);
    });
  });

  describe('getExpansionReport', () => {
    it('should return comprehensive report', () => {
      const report = getExpansionReport(state);
      expect(report.totalEvents).toBe(0);
      expect(typeof report.expansionMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getExpansionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeExpansionEngineState', () => {
    it('should reset all state', () => {
      let next = addExpansionEvent(state, 'e1', 'descriptive', 'rich', 'important', 'desc', 0.3, 0.9);
      next = resetNarrativeExpansionEngineState();
      expect(next.events.size).toBe(0);
      expect(next.totalEvents).toBe(0);
    });
  });
});