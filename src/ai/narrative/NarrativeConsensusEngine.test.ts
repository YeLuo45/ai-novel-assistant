/**
 * V663 NarrativeConsensusEngine Tests — Direction E Iter 8/9
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createConsensusState,
  addPerspective,
  updatePerspectivePosition,
  makeDecision,
  setDecisionType,
  getConsensusReport,
  resetConsensusState,
  type ConsensusState,
} from './NarrativeConsensusEngine';

describe('NarrativeConsensusEngine', () => {
  let state: ConsensusState;

  beforeEach(() => { state = createConsensusState(); });

  describe('createConsensusState', () => {
    it('should initialize with defaults', () => {
      expect(state.perspectives.size).toBe(0);
      expect(state.consensusLevel).toBe('divergent');
      expect(state.decisionMade).toBe(false);
    });

    it('should have hybrid decision type', () => {
      expect(state.decisionType).toBe('hybrid');
    });
  });

  describe('addPerspective', () => {
    it('should add perspective', () => {
      const next = addPerspective(state, 'p1', 'Protagonist', 0.8, 'save world', 0.9);
      expect(next.perspectives.size).toBe(1);
    });

    it('should set perspective properties', () => {
      const next = addPerspective(state, 'p1', 'Antagonist', 0.6, 'rule world', 0.7);
      expect(next.perspectives.get('p1')?.label).toBe('Antagonist');
      expect(next.perspectives.get('p1')?.position).toBe('rule world');
    });

    it('should update consensus level', () => {
      let next = addPerspective(state, 'p1', 'P1', 0.5, 'option A', 0.8);
      next = addPerspective(next, 'p2', 'P2', 0.5, 'option A', 0.8);
      expect(next.consensusLevel).toBe('agreed');
    });
  });

  describe('updatePerspectivePosition', () => {
    it('should update position', () => {
      let next = addPerspective(state, 'p1', 'P1', 0.5, 'old position', 0.8);
      next = updatePerspectivePosition(next, 'p1', 'new position');
      expect(next.perspectives.get('p1')?.position).toBe('new position');
    });

    it('should recompute consensus', () => {
      let next = addPerspective(state, 'p1', 'P1', 0.5, 'position A', 0.8);
      next = addPerspective(next, 'p2', 'P2', 0.5, 'position B', 0.8);
      next = updatePerspectivePosition(next, 'p1', 'position B');
      expect(next.consensusLevel).toBe('agreed');
    });
  });

  describe('makeDecision', () => {
    it('should make decision when converged', () => {
      let next = addPerspective(state, 'p1', 'P1', 0.6, 'same', 0.9);
      next = addPerspective(next, 'p2', 'P2', 0.4, 'same', 0.7);
      const { result } = makeDecision(next, 'Chose dominant perspective');
      expect(result).toBeTruthy();
      expect(result?.consensusReached).toBe(true);
    });

    it('should return null when divergent', () => {
      const { result } = makeDecision(state, 'Decision');
      expect(result).toBeNull();
    });

    it('should set decision rationale', () => {
      let next = addPerspective(state, 'p1', 'P1', 0.6, 'same', 0.9);
      next = addPerspective(next, 'p2', 'P2', 0.4, 'same', 0.7);
      const { state: updated } = makeDecision(next, 'Rationale for decision');
      expect(updated.decisionMade).toBe(true);
      expect(updated.decisionRationale).toBe('Rationale for decision');
    });
  });

  describe('setDecisionType', () => {
    it('should set decision type', () => {
      const next = setDecisionType(state, 'analytical');
      expect(next.decisionType).toBe('analytical');
    });

    it('should accept all decision types', () => {
      const types = ['heuristic', 'analytical', 'creative', 'hybrid'] as const;
      types.forEach(type => {
        const next = setDecisionType(state, type);
        expect(next.decisionType).toBe(type);
      });
    });
  });

  describe('getConsensusReport', () => {
    it('should return comprehensive report', () => {
      const report = getConsensusReport(state);
      expect(report.perspectiveCount).toBe(0);
      expect(typeof report.consensusLevel).toBe('string');
    });

    it('should include recommendations', () => {
      const report = getConsensusReport(state);
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should report decision status', () => {
      let next = addPerspective(state, 'p1', 'P1', 0.6, 'same', 0.9);
      next = addPerspective(next, 'p2', 'P2', 0.4, 'same', 0.7);
      const { state: decided } = makeDecision(next, 'Decision');
      const report = getConsensusReport(decided);
      expect(report.decisionMade).toBe(true);
    });
  });

  describe('resetConsensusState', () => {
    it('should reset all state', () => {
      let next = addPerspective(state, 'p1', 'P1', 0.6, 'same', 0.9);
      next = addPerspective(next, 'p2', 'P2', 0.4, 'same', 0.7);
      const { state: decided } = makeDecision(next, 'Decision');
      const reset = resetConsensusState();
      expect(reset.perspectives.size).toBe(0);
      expect(reset.decisionMade).toBe(false);
    });
  });
});