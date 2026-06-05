/**
 * V753 ContextAwarenessEngine Tests — Direction A Iter 8/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createContextAwarenessEngineState,
  captureAwarenessSignal,
  createAwarenessSnapshot,
  setAwarenessLevel,
  getSignalsByType,
  getSignalsBySignalType,
  getSnapshot,
  getAwarenessReport,
  resetContextAwarenessEngineState,
  type ContextAwarenessEngineState,
} from './ContextAwarenessEngine';

describe('ContextAwarenessEngine', () => {
  let state: ContextAwarenessEngineState;

  beforeEach(() => { state = createContextAwarenessEngineState(); });

  describe('createContextAwarenessEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.signals.size).toBe(0);
      expect(state.currentLevel).toBe('moderate');
    });
  });

  describe('captureAwarenessSignal', () => {
    it('should capture signal', () => {
      const next = captureAwarenessSignal(state, 's1', 'self', 'explicit', 'I am here', 0.8, 0.9);
      expect(next.signals.size).toBe(1);
      expect(next.totalSignals).toBe(1);
    });

    it('should clamp values', () => {
      const next = captureAwarenessSignal(state, 's1', 'self', 'explicit', 'content', 1.5, -0.1);
      expect(next.signals.get('s1')?.strength).toBe(1);
      expect(next.signals.get('s1')?.reliability).toBe(0);
    });
  });

  describe('createAwarenessSnapshot', () => {
    it('should create snapshot', () => {
      let next = captureAwarenessSignal(state, 's1', 'self', 'explicit', 'content', 0.8);
      next = createAwarenessSnapshot(next, 'snap1', 'full', 'all', ['s1']);
      expect(next.totalSnapshots).toBe(1);
      expect(next.snapshots.get('snap1')?.totalSignals).toBe(1);
    });

    it('should handle unknown signal ids', () => {
      const next = createAwarenessSnapshot(state, 'snap1', 'full', 'all', ['unknown']);
      expect(next.snapshots.get('snap1')?.totalSignals).toBe(0);
    });
  });

  describe('setAwarenessLevel', () => {
    it('should set level', () => {
      const next = setAwarenessLevel(state, 'omniscient');
      expect(next.currentLevel).toBe('omniscient');
    });
  });

  describe('getSignalsByType', () => {
    it('should filter by type', () => {
      let next = captureAwarenessSignal(state, 's1', 'self', 'explicit', 'content', 0.8);
      next = captureAwarenessSignal(next, 's2', 'environment', 'explicit', 'content', 0.8);
      const self = getSignalsByType(next, 'self');
      expect(self.length).toBe(1);
    });
  });

  describe('getSignalsBySignalType', () => {
    it('should filter by signal type', () => {
      let next = captureAwarenessSignal(state, 's1', 'self', 'explicit', 'content', 0.8);
      next = captureAwarenessSignal(next, 's2', 'self', 'inferred', 'content', 0.8);
      const explicit = getSignalsBySignalType(next, 'explicit');
      expect(explicit.length).toBe(1);
    });
  });

  describe('getSnapshot', () => {
    it('should return snapshot', () => {
      const next = createAwarenessSnapshot(state, 'snap1', 'full', 'all');
      const snap = getSnapshot(next, 'snap1');
      expect(snap?.snapshotId).toBe('snap1');
    });

    it('should return null for unknown snapshot', () => {
      const snap = getSnapshot(state, 'unknown');
      expect(snap).toBeNull();
    });
  });

  describe('getAwarenessReport', () => {
    it('should return comprehensive report', () => {
      const report = getAwarenessReport(state);
      expect(report.totalSignals).toBe(0);
      expect(typeof report.awarenessScore).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAwarenessReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetContextAwarenessEngineState', () => {
    it('should reset all state', () => {
      let next = captureAwarenessSignal(state, 's1', 'self', 'explicit', 'content', 0.8);
      next = resetContextAwarenessEngineState();
      expect(next.signals.size).toBe(0);
      expect(next.totalSignals).toBe(0);
    });
  });
});