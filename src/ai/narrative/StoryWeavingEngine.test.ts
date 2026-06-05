/**
 * V759 StoryWeavingEngine Tests — Direction B Iter 2/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createStoryWeavingEngineState,
  addStoryThread,
  connectThreads,
  advanceThread,
  setWeavePattern,
  getThreadsByType,
  getConnectionsFromThread,
  getWeavingReport,
  resetStoryWeavingEngineState,
  type StoryWeavingEngineState,
} from './StoryWeavingEngine';

describe('StoryWeavingEngine', () => {
  let state: StoryWeavingEngineState;

  beforeEach(() => { state = createStoryWeavingEngineState(); });

  describe('createStoryWeavingEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.threads.size).toBe(0);
      expect(state.weavePattern).toBe('linear');
    });
  });

  describe('addStoryThread', () => {
    it('should add thread', () => {
      const next = addStoryThread(state, 't1', 'Main Plot', 'main_plot', 1, 10, 5);
      expect(next.threads.size).toBe(1);
      expect(next.totalThreads).toBe(1);
    });
  });

  describe('connectThreads', () => {
    it('should connect threads', () => {
      let next = addStoryThread(state, 't1', 'Main', 'main_plot');
      next = addStoryThread(next, 't2', 'Sub', 'subplot');
      next = connectThreads(next, 'c1', 't1', 't2', 'cause', 0.8, 5);
      expect(next.totalConnections).toBe(1);
    });

    it('should clamp strength', () => {
      let next = addStoryThread(state, 't1', 'Main', 'main_plot');
      next = addStoryThread(next, 't2', 'Sub', 'subplot');
      next = connectThreads(next, 'c1', 't1', 't2', 'cause', 1.5, 5);
      expect(next.connections.get('c1')?.strength).toBe(1);
    });
  });

  describe('advanceThread', () => {
    it('should advance thread', () => {
      let next = addStoryThread(state, 't1', 'Main', 'main_plot', 1, 10);
      next = advanceThread(next, 't1', 5);
      expect(next.threads.get('t1')?.currentPosition).toBe(5);
      expect(next.threads.get('t1')?.status).toBe('developing');
    });

    it('should mark as resolved at end', () => {
      let next = addStoryThread(state, 't1', 'Main', 'main_plot', 1, 10);
      next = advanceThread(next, 't1', 10);
      expect(next.threads.get('t1')?.status).toBe('resolved');
    });

    it('should return state for unknown thread', () => {
      const next = advanceThread(state, 'unknown', 5);
      expect(next.totalThreads).toBe(0);
    });
  });

  describe('setWeavePattern', () => {
    it('should set pattern', () => {
      const next = setWeavePattern(state, 'braided');
      expect(next.weavePattern).toBe('braided');
    });
  });

  describe('getThreadsByType', () => {
    it('should filter by type', () => {
      let next = addStoryThread(state, 't1', 'Main', 'main_plot');
      next = addStoryThread(next, 't2', 'Sub', 'subplot');
      const mains = getThreadsByType(next, 'main_plot');
      expect(mains.length).toBe(1);
    });
  });

  describe('getConnectionsFromThread', () => {
    it('should return outgoing connections', () => {
      let next = addStoryThread(state, 't1', 'Main', 'main_plot');
      next = addStoryThread(next, 't2', 'Sub', 'subplot');
      next = connectThreads(next, 'c1', 't1', 't2', 'cause', 0.8, 5);
      const conns = getConnectionsFromThread(next, 't1');
      expect(conns.length).toBe(1);
    });
  });

  describe('getWeavingReport', () => {
    it('should return comprehensive report', () => {
      const report = getWeavingReport(state);
      expect(report.totalThreads).toBe(0);
      expect(typeof report.weavingComplexity).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWeavingReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetStoryWeavingEngineState', () => {
    it('should reset all state', () => {
      let next = addStoryThread(state, 't1', 'Main', 'main_plot');
      next = resetStoryWeavingEngineState();
      expect(next.threads.size).toBe(0);
      expect(next.totalThreads).toBe(0);
    });
  });
});