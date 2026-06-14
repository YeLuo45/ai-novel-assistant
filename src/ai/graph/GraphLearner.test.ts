import { describe, it, expect } from 'vitest';
import { createGraphLearnerState, createGraphRule, recordGraphHit, recordGraphMiss, getGraphWeight, topGraphEdges, setGraphLearningRate, graphLearnerHealth } from './GraphLearner';

describe('V2201 GraphLearner', () => {
  it('should create empty state', () => {
    const s = createGraphLearnerState();
    expect(s.rules.size).toBe(0);
  });

  it('should create rule', () => {
    let s = createGraphLearnerState();
    s = createGraphRule(s, 'e1');
    expect(s.rules.size).toBe(1);
  });

  it('should record hit', () => {
    let s = createGraphLearnerState(0.1);
    s = createGraphRule(s, 'e1', 0.5);
    s = recordGraphHit(s, 'e1');
    expect(getGraphWeight(s, 'e1')).toBe(0.6);
  });

  it('should record miss', () => {
    let s = createGraphLearnerState(0.1);
    s = createGraphRule(s, 'e1', 0.5);
    s = recordGraphMiss(s, 'e1');
    expect(getGraphWeight(s, 'e1')).toBe(0.4);
  });

  it('should clamp weight 0-1', () => {
    let s = createGraphLearnerState(0.1);
    s = createGraphRule(s, 'e1', 0.95);
    s = recordGraphHit(s, 'e1');
    expect(getGraphWeight(s, 'e1')).toBe(1);
  });

  it('should return default weight for unknown', () => {
    const s = createGraphLearnerState();
    expect(getGraphWeight(s, 'unknown')).toBe(0.5);
  });

  it('should rank top edges', () => {
    let s = createGraphLearnerState(0.1);
    s = createGraphRule(s, 'a', 0.3);
    s = createGraphRule(s, 'b', 0.8);
    const top = topGraphEdges(s, 2);
    expect(top[0].edgeId).toBe('b');
  });

  it('should set learning rate', () => {
    let s = createGraphLearnerState();
    s = setGraphLearningRate(s, 2);
    expect(s.learningRate).toBe(1);
  });

  it('should compute health', () => {
    let s = createGraphLearnerState();
    s = createGraphRule(s, 'e1');
    const h = graphLearnerHealth(s);
    expect(h.health).toBe(1);
  });
});
