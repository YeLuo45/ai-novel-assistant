/**
 * V963 NarrativePerceptionCore Tests — Direction E Iter 14/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativePerceptionCoreState,
  addPerceptionDetail,
  addPerceptionScene,
  getDetailsByChannel,
  getPerceptionCoreReport,
  resetNarrativePerceptionCoreState,
  type NarrativePerceptionCoreState,
} from './NarrativePerceptionCore';

describe('NarrativePerceptionCore', () => {
  let state: NarrativePerceptionCoreState;

  beforeEach(() => { state = createNarrativePerceptionCoreState(); });

  describe('createNarrativePerceptionCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.details.size).toBe(0);
      expect(state.scenes.size).toBe(0);
    });
  });

  describe('addPerceptionDetail', () => {
    it('should add detail', () => {
      const next = addPerceptionDetail(state, 'd1', 'visual', 'vivid', 'integrated', 'desc', 0.8, 0.7, 1);
      expect(next.details.size).toBe(1);
      expect(next.totalDetails).toBe(1);
    });
  });

  describe('addPerceptionScene', () => {
    it('should add scene', () => {
      let next = addPerceptionDetail(state, 'd1', 'visual', 'vivid', 'integrated', 'desc', 0.8, 0.7, 1);
      next = addPerceptionScene(next, 's1', 'main scene', ['d1']);
      expect(next.totalScenes).toBe(1);
    });
  });

  describe('getDetailsByChannel', () => {
    it('should filter by channel', () => {
      let next = addPerceptionDetail(state, 'd1', 'visual', 'vivid', 'integrated', 'desc', 0.8, 0.7, 1);
      next = addPerceptionDetail(next, 'd2', 'auditory', 'vivid', 'integrated', 'desc', 0.8, 0.7, 1);
      const visual = getDetailsByChannel(next, 'visual');
      expect(visual.length).toBe(1);
    });
  });

  describe('getPerceptionCoreReport', () => {
    it('should return comprehensive report', () => {
      const report = getPerceptionCoreReport(state);
      expect(report.totalDetails).toBe(0);
      expect(typeof report.perceptionMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getPerceptionCoreReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativePerceptionCoreState', () => {
    it('should reset all state', () => {
      let next = addPerceptionDetail(state, 'd1', 'visual', 'vivid', 'integrated', 'desc', 0.8, 0.7, 1);
      next = resetNarrativePerceptionCoreState();
      expect(next.details.size).toBe(0);
      expect(next.totalDetails).toBe(0);
    });
  });
});