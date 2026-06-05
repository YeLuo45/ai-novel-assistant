/**
 * V721 NarrativeIntelligenceCore Tests — Direction E Iter 1/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeIntelligenceCoreState,
  startProcess,
  updateProcessState,
  setIntelligenceMode,
  setCognitiveLevel,
  getProcessesByMode,
  getProcessesByIntelligenceState,
  reflect,
  getIntelligenceCoreReport,
  resetNarrativeIntelligenceCoreState,
  type NarrativeIntelligenceCoreState,
} from './NarrativeIntelligenceCore';

describe('NarrativeIntelligenceCore', () => {
  let state: NarrativeIntelligenceCoreState;

  beforeEach(() => { state = createNarrativeIntelligenceCoreState(); });

  describe('createNarrativeIntelligenceCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.processes.size).toBe(0);
      expect(state.totalProcesses).toBe(0);
    });

    it('should default to hybrid mode and deep level', () => {
      expect(state.currentMode).toBe('hybrid');
      expect(state.currentLevel).toBe('deep');
    });
  });

  describe('startProcess', () => {
    it('should start process', () => {
      const next = startProcess(state, 'p1', 'Analyze plot', 'analytical', 'input text');
      expect(next.processes.size).toBe(1);
      expect(next.totalProcesses).toBe(1);
    });

    it('should set initial state to awakening', () => {
      const next = startProcess(state, 'p1', 'Process', 'creative', 'input');
      expect(next.processes.get('p1')?.state).toBe('awakening');
    });
  });

  describe('updateProcessState', () => {
    it('should update state', () => {
      let next = startProcess(state, 'p1', 'Process', 'analytical', 'input');
      next = updateProcessState(next, 'p1', 'active', 'output', 0.8);
      expect(next.processes.get('p1')?.state).toBe('active');
      expect(next.processes.get('p1')?.qualityScore).toBe(0.8);
    });

    it('should increment completed when integrating', () => {
      let next = startProcess(state, 'p1', 'Process', 'analytical', 'input');
      next = updateProcessState(next, 'p1', 'integrating', 'output', 0.8);
      expect(next.completedProcesses).toBe(1);
      expect(next.activeProcesses).toBe(0);
    });
  });

  describe('setIntelligenceMode', () => {
    it('should set mode', () => {
      const next = setIntelligenceMode(state, 'creative');
      expect(next.currentMode).toBe('creative');
    });
  });

  describe('setCognitiveLevel', () => {
    it('should set level', () => {
      const next = setCognitiveLevel(state, 'meta');
      expect(next.currentLevel).toBe('meta');
    });
  });

  describe('getProcessesByMode', () => {
    it('should filter by mode', () => {
      let next = startProcess(state, 'p1', 'P1', 'analytical', 'input');
      next = startProcess(next, 'p2', 'P2', 'creative', 'input');
      const analytical = getProcessesByMode(next, 'analytical');
      expect(analytical.length).toBe(1);
    });
  });

  describe('getProcessesByIntelligenceState', () => {
    it('should filter by state', () => {
      let next = startProcess(state, 'p1', 'P1', 'analytical', 'input');
      next = startProcess(next, 'p2', 'P2', 'creative', 'input');
      next = updateProcessState(next, 'p1', 'active', 'out', 0.5);
      const active = getProcessesByIntelligenceState(next, 'active');
      expect(active.length).toBe(1);
    });
  });

  describe('reflect', () => {
    it('should add reflection to context', () => {
      let next = startProcess(state, 'p1', 'Process', 'analytical', 'input', 'context');
      next = reflect(next, 'p1', 'Process was good');
      expect(next.processes.get('p1')?.cognitiveState.context).toContain('Reflection');
    });
  });

  describe('getIntelligenceCoreReport', () => {
    it('should return comprehensive report', () => {
      const report = getIntelligenceCoreReport(state);
      expect(report.totalProcesses).toBe(0);
      expect(typeof report.intelligenceQuotient).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getIntelligenceCoreReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeIntelligenceCoreState', () => {
    it('should reset all state', () => {
      let next = startProcess(state, 'p1', 'Process', 'analytical', 'input');
      next = resetNarrativeIntelligenceCoreState();
      expect(next.processes.size).toBe(0);
      expect(next.totalProcesses).toBe(0);
    });
  });
});