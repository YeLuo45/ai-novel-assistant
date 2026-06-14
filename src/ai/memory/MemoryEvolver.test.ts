import { describe, it, expect } from 'vitest';
import { createMemoryEvolverState, observePattern, detectEvolution, eventsByKind, eventCount, memoryEvolverHealth } from './MemoryEvolver';

describe('V2173 MemoryEvolver', () => {
  it('should create empty state', () => {
    const s = createMemoryEvolverState();
    expect(s.events).toEqual([]);
  });

  it('should observe pattern', () => {
    let s = createMemoryEvolverState();
    s = observePattern(s, 'p1', ['field1'], []);
    expect(s.patterns.size).toBe(1);
  });

  it('should accumulate observations', () => {
    let s = createMemoryEvolverState();
    s = observePattern(s, 'p1', ['a'], []);
    s = observePattern(s, 'p1', ['b'], []);
    expect(s.patterns.get('p1')?.observations).toBe(2);
  });

  it('should detect evolution when threshold met', () => {
    let s = createMemoryEvolverState();
    for (let i = 0; i < 5; i++) s = observePattern(s, 'p1', ['newField'], []);
    s = detectEvolution(s, 5);
    expect(eventsByKind(s, 'add_field').length).toBeGreaterThan(0);
  });

  it('should not detect evolution below threshold', () => {
    let s = createMemoryEvolverState();
    s = observePattern(s, 'p1', ['newField'], []);
    s = detectEvolution(s, 5);
    expect(eventCount(s)).toBe(0);
  });

  it('should detect remove_field evolution', () => {
    let s = createMemoryEvolverState();
    for (let i = 0; i < 5; i++) s = observePattern(s, 'p1', [], ['oldField']);
    s = detectEvolution(s, 5);
    expect(eventsByKind(s, 'remove_field').length).toBeGreaterThan(0);
  });

  it('should compute health', () => {
    let s = createMemoryEvolverState();
    s = observePattern(s, 'p1', ['a'], []);
    const h = memoryEvolverHealth(s);
    expect(h.health).toBe(0.5);
  });
});
