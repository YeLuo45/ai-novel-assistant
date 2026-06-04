/**
 * V689 PlotProgressionEngine Tests — Direction B Iter 3/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPlotProgressionState,
  addMainBeat,
  addSubplot,
  addSubplotBeat,
  updateBeatStatus,
  getBeatsByElement,
  getSubplotBeats,
  getProgressionReport,
  resetPlotProgressionState,
  type PlotProgressionState,
} from './PlotProgressionEngine';

describe('PlotProgressionEngine', () => {
  let state: PlotProgressionState;

  beforeEach(() => { state = createPlotProgressionState(); });

  describe('createPlotProgressionState', () => {
    it('should initialize with defaults', () => {
      expect(state.mainPlotBeats.size).toBe(0);
      expect(state.subplots.size).toBe(0);
    });

    it('should have default progression score', () => {
      expect(state.progressionScore).toBe(0.5);
    });
  });

  describe('addMainBeat', () => {
    it('should add main beat', () => {
      const next = addMainBeat(state, 'b1', 'Inciting Incident', 'Hero called', 'setup', 1, 0.8);
      expect(next.mainPlotBeats.size).toBe(1);
      expect(next.totalBeats).toBe(1);
    });

    it('should set status to active', () => {
      const next = addMainBeat(state, 'b1', 'Beat', 'Desc', 'setup', 1);
      expect(next.mainPlotBeats.get('b1')?.status).toBe('active');
    });
  });

  describe('addSubplot', () => {
    it('should add subplot', () => {
      const next = addSubplot(state, 'romance', 'romance');
      expect(next.subplotCount).toBe(1);
      expect(next.subplots.size).toBe(1);
    });
  });

  describe('addSubplotBeat', () => {
    it('should add subplot beat', () => {
      let next = addSubplot(state, 'romance', 'romance');
      next = addSubplotBeat(next, 'romance', 'rb1', 'First Meeting', 'Heroes meet', 'setup', 1, 0.6);
      expect(next.totalBeats).toBe(1);
    });

    it('should track subplot type', () => {
      let next = addSubplot(state, 'romance', 'romance');
      next = addSubplotBeat(next, 'romance', 'rb1', 'Beat', 'Desc', 'setup', 1);
      const beats = getSubplotBeats(next, 'romance');
      expect(beats[0]?.subplot).toBe('romance');
    });
  });

  describe('updateBeatStatus', () => {
    it('should update main beat status', () => {
      let next = addMainBeat(state, 'b1', 'Beat', 'Desc', 'setup', 1);
      next = updateBeatStatus(next, 'b1', 'resolved');
      expect(next.mainPlotBeats.get('b1')?.status).toBe('resolved');
    });

    it('should update subplot beat status', () => {
      let next = addSubplot(state, 'romance', 'romance');
      next = addSubplotBeat(next, 'romance', 'rb1', 'Beat', 'Desc', 'setup', 1);
      next = updateBeatStatus(next, 'rb1', 'resolved');
      const beats = getSubplotBeats(next, 'romance');
      expect(beats[0]?.status).toBe('resolved');
    });
  });

  describe('getBeatsByElement', () => {
    it('should filter by element', () => {
      let next = addMainBeat(state, 'b1', 'Setup', 'Desc', 'setup', 1);
      next = addMainBeat(next, 'b2', 'Climax', 'Desc', 'climax', 5);
      const setupBeats = getBeatsByElement(next, 'setup');
      expect(setupBeats.length).toBe(1);
    });

    it('should include subplot beats', () => {
      let next = addSubplot(state, 'romance', 'romance');
      next = addSubplotBeat(next, 'romance', 'rb1', 'Beat', 'Desc', 'climax', 5);
      const climaxBeats = getBeatsByElement(next, 'climax');
      expect(climaxBeats.length).toBe(1);
    });
  });

  describe('getSubplotBeats', () => {
    it('should return subplot beats', () => {
      let next = addSubplot(state, 'romance', 'romance');
      next = addSubplotBeat(next, 'romance', 'rb1', 'Beat 1', 'Desc', 'setup', 1);
      next = addSubplotBeat(next, 'romance', 'rb2', 'Beat 2', 'Desc', 'climax', 5);
      const beats = getSubplotBeats(next, 'romance');
      expect(beats.length).toBe(2);
    });

    it('should return empty for unknown subplot', () => {
      const beats = getSubplotBeats(state, 'unknown');
      expect(beats).toEqual([]);
    });
  });

  describe('getProgressionReport', () => {
    it('should return comprehensive report', () => {
      const report = getProgressionReport(state);
      expect(report.totalBeats).toBe(0);
      expect(typeof report.progressionScore).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getProgressionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetPlotProgressionState', () => {
    it('should reset all state', () => {
      let next = addMainBeat(state, 'b1', 'Beat', 'Desc', 'setup', 1);
      next = resetPlotProgressionState();
      expect(next.mainPlotBeats.size).toBe(0);
      expect(next.totalBeats).toBe(0);
    });
  });
});