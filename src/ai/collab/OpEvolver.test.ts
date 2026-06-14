import { describe, it, expect } from 'vitest';
import { createOpEvolverState, observeOpPattern, detectOpEvolution, opEvolutionEventsByKind, opEvolutionEventCount, opEvolverHealth } from './OpEvolver';

describe('V2233 OpEvolver', () => {
  it('should create empty state', () => {
    const s = createOpEvolverState();
    expect(s.events).toEqual([]);
  });

  it('should observe pattern', () => {
    let s = createOpEvolverState();
    s = observeOpPattern(s, 'p1', ['newKind'], ['oldA,oldB']);
    expect(s.patterns.size).toBe(1);
  });

  it('should accumulate', () => {
    let s = createOpEvolverState();
    s = observeOpPattern(s, 'p1', [], []);
    s = observeOpPattern(s, 'p1', [], []);
    expect(s.patterns.get('p1')?.observations).toBe(2);
  });

  it('should detect add_kind', () => {
    let s = createOpEvolverState();
    for (let i = 0; i < 5; i++) s = observeOpPattern(s, 'p1', ['newKind'], []);
    s = detectOpEvolution(s, 5);
    expect(opEvolutionEventsByKind(s, 'add_kind').length).toBeGreaterThan(0);
  });

  it('should detect merge_kind', () => {
    let s = createOpEvolverState();
    for (let i = 0; i < 5; i++) s = observeOpPattern(s, 'p1', [], ['a,b']);
    s = detectOpEvolution(s, 5);
    expect(opEvolutionEventsByKind(s, 'merge_kind').length).toBeGreaterThan(0);
  });

  it('should not detect below threshold', () => {
    let s = createOpEvolverState();
    s = observeOpPattern(s, 'p1', ['newKind'], []);
    s = detectOpEvolution(s, 5);
    expect(opEvolutionEventCount(s)).toBe(0);
  });

  it('should compute health', () => {
    let s = createOpEvolverState();
    s = observeOpPattern(s, 'p1', ['a'], []);
    const h = opEvolverHealth(s);
    expect(h.health).toBe(0.5);
  });
});
