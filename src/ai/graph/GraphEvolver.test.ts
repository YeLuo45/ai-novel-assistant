import { describe, it, expect } from 'vitest';
import { createGraphEvolverState, observeGraphPattern, detectGraphEvolution, graphEvolutionEventsByKind, graphEvolutionEventCount, graphEvolverHealth } from './GraphEvolver';

describe('V2203 GraphEvolver', () => {
  it('should create empty state', () => {
    const s = createGraphEvolverState();
    expect(s.events).toEqual([]);
  });

  it('should observe pattern', () => {
    let s = createGraphEvolverState();
    s = observeGraphPattern(s, 'p1', ['newNode'], ['newEdge']);
    expect(s.patterns.size).toBe(1);
  });

  it('should accumulate observations', () => {
    let s = createGraphEvolverState();
    s = observeGraphPattern(s, 'p1', [], []);
    s = observeGraphPattern(s, 'p1', [], []);
    expect(s.patterns.get('p1')?.observations).toBe(2);
  });

  it('should detect add_node evolution', () => {
    let s = createGraphEvolverState();
    for (let i = 0; i < 5; i++) s = observeGraphPattern(s, 'p1', ['newNode'], []);
    s = detectGraphEvolution(s, 5);
    expect(graphEvolutionEventsByKind(s, 'add_node').length).toBeGreaterThan(0);
  });

  it('should detect add_edge evolution', () => {
    let s = createGraphEvolverState();
    for (let i = 0; i < 5; i++) s = observeGraphPattern(s, 'p1', [], ['newEdge']);
    s = detectGraphEvolution(s, 5);
    expect(graphEvolutionEventsByKind(s, 'add_edge').length).toBeGreaterThan(0);
  });

  it('should not detect below threshold', () => {
    let s = createGraphEvolverState();
    s = observeGraphPattern(s, 'p1', ['newNode'], []);
    s = detectGraphEvolution(s, 5);
    expect(graphEvolutionEventCount(s)).toBe(0);
  });

  it('should compute health', () => {
    let s = createGraphEvolverState();
    s = observeGraphPattern(s, 'p1', ['a'], []);
    const h = graphEvolverHealth(s);
    expect(h.health).toBe(0.5);
  });
});
