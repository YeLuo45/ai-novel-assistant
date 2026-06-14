import { describe, it, expect } from 'vitest';
import { createContextEvolverState, observeContextPattern, detectContextEvolution, contextEvolutionEventsByKind, contextEvolutionEventCount, contextEvolverHealth } from './ContextEvolver';

describe('V2293 ContextEvolver', () => {
  it('should create empty state', () => {
    const s = createContextEvolverState();
    expect(s.events).toEqual([]);
  });

  it('should observe pattern', () => {
    let s = createContextEvolverState();
    s = observeContextPattern(s, 'p1', ['newField'], ['a,b']);
    expect(s.patterns.size).toBe(1);
  });

  it('should accumulate', () => {
    let s = createContextEvolverState();
    s = observeContextPattern(s, 'p1', [], []);
    s = observeContextPattern(s, 'p1', [], []);
    expect(s.patterns.get('p1')?.observations).toBe(2);
  });

  it('should detect add_field', () => {
    let s = createContextEvolverState();
    for (let i = 0; i < 5; i++) s = observeContextPattern(s, 'p1', ['newField'], []);
    s = detectContextEvolution(s, 5);
    expect(contextEvolutionEventsByKind(s, 'add_field').length).toBeGreaterThan(0);
  });

  it('should detect merge_field', () => {
    let s = createContextEvolverState();
    for (let i = 0; i < 5; i++) s = observeContextPattern(s, 'p1', [], ['a,b']);
    s = detectContextEvolution(s, 5);
    expect(contextEvolutionEventsByKind(s, 'merge_field').length).toBeGreaterThan(0);
  });

  it('should not detect below threshold', () => {
    let s = createContextEvolverState();
    s = observeContextPattern(s, 'p1', ['newField'], []);
    s = detectContextEvolution(s, 5);
    expect(contextEvolutionEventCount(s)).toBe(0);
  });

  it('should compute health', () => {
    let s = createContextEvolverState();
    s = observeContextPattern(s, 'p1', ['a'], []);
    const h = contextEvolverHealth(s);
    expect(h.health).toBe(0.5);
  });
});
