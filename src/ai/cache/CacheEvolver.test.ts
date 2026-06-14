import { describe, it, expect } from 'vitest';
import { createCacheEvolverState, observeCachePattern, detectCacheEvolution, cacheEvolutionEventsByKind, cacheEvolutionEventCount, cacheEvolverHealth } from './CacheEvolver';

describe('V2263 CacheEvolver', () => {
  it('should create empty state', () => {
    const s = createCacheEvolverState();
    expect(s.events).toEqual([]);
  });

  it('should observe pattern', () => {
    let s = createCacheEvolverState();
    s = observeCachePattern(s, 'p1', ['newField'], ['a,b']);
    expect(s.patterns.size).toBe(1);
  });

  it('should accumulate', () => {
    let s = createCacheEvolverState();
    s = observeCachePattern(s, 'p1', [], []);
    s = observeCachePattern(s, 'p1', [], []);
    expect(s.patterns.get('p1')?.observations).toBe(2);
  });

  it('should detect add_field', () => {
    let s = createCacheEvolverState();
    for (let i = 0; i < 5; i++) s = observeCachePattern(s, 'p1', ['newField'], []);
    s = detectCacheEvolution(s, 5);
    expect(cacheEvolutionEventsByKind(s, 'add_field').length).toBeGreaterThan(0);
  });

  it('should detect merge_field', () => {
    let s = createCacheEvolverState();
    for (let i = 0; i < 5; i++) s = observeCachePattern(s, 'p1', [], ['a,b']);
    s = detectCacheEvolution(s, 5);
    expect(cacheEvolutionEventsByKind(s, 'merge_field').length).toBeGreaterThan(0);
  });

  it('should not detect below threshold', () => {
    let s = createCacheEvolverState();
    s = observeCachePattern(s, 'p1', ['newField'], []);
    s = detectCacheEvolution(s, 5);
    expect(cacheEvolutionEventCount(s)).toBe(0);
  });

  it('should compute health', () => {
    let s = createCacheEvolverState();
    s = observeCachePattern(s, 'p1', ['a'], []);
    const h = cacheEvolverHealth(s);
    expect(h.health).toBe(0.5);
  });
});
