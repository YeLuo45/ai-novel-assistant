/**
 * V649 UnifiedNarrativeEngine Tests — Direction E Iter 1/9
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createUnifiedNarrativeState,
  addSemanticNode,
  connectNodes,
  setUnderstandingLevel,
  setActiveLayers,
  analyzeUnderstanding,
  getUnifiedNarrativeReport,
  resetUnifiedNarrativeState,
  type UnifiedNarrativeState,
} from './UnifiedNarrativeEngine';

describe('UnifiedNarrativeEngine', () => {
  let state: UnifiedNarrativeState;

  beforeEach(() => { state = createUnifiedNarrativeState(); });

  describe('createUnifiedNarrativeState', () => {
    it('should initialize with defaults', () => {
      expect(state.semanticNodes.size).toBe(0);
      expect(state.activeLayers.size).toBe(2);
      expect(state.contextWindow).toBe(5);
    });

    it('should start at literal understanding', () => {
      expect(state.understandingLevel).toBe('literal');
    });
  });

  describe('addSemanticNode', () => {
    it('should add semantic node', () => {
      const next = addSemanticNode(state, 'n1', 'concept', 'Test content', 0.6, 'semantic');
      expect(next.semanticNodes.size).toBe(1);
    });

    it('should set node properties', () => {
      const next = addSemanticNode(state, 'n1', 'event', 'Important event', 0.8, 'pragmatic');
      expect(next.semanticNodes.get('n1')?.weight).toBe(0.8);
      expect(next.semanticNodes.get('n1')?.layer).toBe('pragmatic');
    });

    it('should use default weight', () => {
      const next = addSemanticNode(state, 'n1', 'concept', 'Content');
      expect(next.semanticNodes.get('n1')?.weight).toBe(0.5);
    });
  });

  describe('connectNodes', () => {
    it('should connect two nodes', () => {
      let next = addSemanticNode(state, 'n1', 'concept', 'Node 1');
      next = addSemanticNode(next, 'n2', 'concept', 'Node 2');
      next = connectNodes(next, 'n1', 'n2');
      expect(next.semanticNodes.get('n1')?.connections).toContain('n2');
      expect(next.semanticNodes.get('n2')?.connections).toContain('n1');
    });

    it('should return state if node not found', () => {
      const next = connectNodes(state, 'unknown', 'other');
      expect(next.semanticNodes.size).toBe(0);
    });
  });

  describe('setUnderstandingLevel', () => {
    it('should set understanding level', () => {
      const next = setUnderstandingLevel(state, 'inferential');
      expect(next.understandingLevel).toBe('inferential');
    });

    it('should accept all levels', () => {
      const levels = ['literal', 'inferential', 'implicative', 'generic'] as const;
      levels.forEach(level => {
        const next = setUnderstandingLevel(state, level);
        expect(next.understandingLevel).toBe(level);
      });
    });
  });

  describe('setActiveLayers', () => {
    it('should set active layers', () => {
      const next = setActiveLayers(state, ['semantic', 'pragmatic']);
      expect(next.activeLayers.size).toBe(2);
      expect(next.activeLayers.has('semantic')).toBe(true);
      expect(next.activeLayers.has('pragmatic')).toBe(true);
    });
  });

  describe('analyzeUnderstanding', () => {
    it('should return understanding at literal level for basic nodes', () => {
      const result = analyzeUnderstanding(state, 'test content');
      expect(result.level).toBe('literal');
    });

    it('should upgrade to inferential with semantic+contextual', () => {
      let next = addSemanticNode(state, 'n1', 'concept', 'Node', 0.7, 'semantic');
      next = addSemanticNode(next, 'n2', 'event', 'Event', 0.6, 'contextual');
      const result = analyzeUnderstanding(next, 'content');
      expect(['inferential', 'implicative', 'generic']).toContain(result.level);
    });

    it('should include key insights from high weight nodes', () => {
      let next = addSemanticNode(state, 'n1', 'concept', 'Important concept', 0.9, 'semantic');
      next = addSemanticNode(next, 'n2', 'concept', 'Less important', 0.3, 'semantic');
      const result = analyzeUnderstanding(next, 'content');
      expect(result.keyInsights).toContain('Important concept');
    });

    it('should include layers in analysis', () => {
      const result = analyzeUnderstanding(state, 'content');
      expect(Array.isArray(result.layers)).toBe(true);
    });
  });

  describe('getUnifiedNarrativeReport', () => {
    it('should return comprehensive report', () => {
      const report = getUnifiedNarrativeReport(state);
      expect(report.nodeCount).toBe(0);
      expect(typeof report.coherenceScore).toBe('number');
    });

    it('should include recommendations', () => {
      const report = getUnifiedNarrativeReport(state);
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should count nodes correctly', () => {
      let next = addSemanticNode(state, 'n1', 'concept', 'One');
      next = addSemanticNode(next, 'n2', 'event', 'Two');
      const report = getUnifiedNarrativeReport(next);
      expect(report.nodeCount).toBe(2);
    });
  });

  describe('resetUnifiedNarrativeState', () => {
    it('should reset all state', () => {
      let next = addSemanticNode(state, 'n1', 'concept', 'Node');
      next = setUnderstandingLevel(next, 'inferential');
      next = resetUnifiedNarrativeState();
      expect(next.semanticNodes.size).toBe(0);
      expect(next.understandingLevel).toBe('literal');
    });
  });
});