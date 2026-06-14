import { describe, it, expect } from 'vitest';
import { createGraphReflectorState, reflectOnGraph, graphReflectionsForGraph, graphReflectionsForPeriod, avgGraphEffectiveness, lowPerformingGraphs, graphReflectorHealth } from './GraphReflector';

describe('V2202 GraphReflector', () => {
  it('should create empty state', () => {
    const s = createGraphReflectorState();
    expect(s.reflections.size).toBe(0);
  });

  it('should reflect', () => {
    let s = createGraphReflectorState();
    s = reflectOnGraph(s, 'g1', 'p1', 0.8, ['good']);
    expect(s.reflections.size).toBe(1);
  });

  it('should query by graph', () => {
    let s = createGraphReflectorState();
    s = reflectOnGraph(s, 'g1', 'p1', 0.5, []);
    s = reflectOnGraph(s, 'g2', 'p1', 0.7, []);
    expect(graphReflectionsForGraph(s, 'g1')).toHaveLength(1);
  });

  it('should query by period', () => {
    let s = createGraphReflectorState();
    s = reflectOnGraph(s, 'g1', 'p1', 0.5, []);
    s = reflectOnGraph(s, 'g1', 'p2', 0.7, []);
    expect(graphReflectionsForPeriod(s, 'p1')).toHaveLength(1);
  });

  it('should compute avg effectiveness', () => {
    let s = createGraphReflectorState();
    s = reflectOnGraph(s, 'g1', 'p1', 0.6, []);
    s = reflectOnGraph(s, 'g1', 'p2', 0.8, []);
    expect(avgGraphEffectiveness(s, 'g1')).toBeCloseTo(0.7);
  });

  it('should find low-performing graphs', () => {
    let s = createGraphReflectorState();
    s = reflectOnGraph(s, 'g1', 'p1', 0.1, []);
    s = reflectOnGraph(s, 'g2', 'p1', 0.9, []);
    expect(lowPerformingGraphs(s, 0.3)).toEqual(['g1']);
  });

  it('should compute health', () => {
    let s = createGraphReflectorState();
    s = reflectOnGraph(s, 'g1', 'p1', 0.5, []);
    const h = graphReflectorHealth(s);
    expect(h.health).toBe(1);
  });
});
