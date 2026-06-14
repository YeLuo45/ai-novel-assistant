import { describe, it, expect } from 'vitest';
import { createGraphLifecycleState, birthGraphEntry, activateGraphEntry, decayGraphEntry, expireGraphEntry, autoGraphTransition, countGraphPhase, graphLifecycleHealth } from './GraphLifecycle';

describe('V2191 GraphLifecycle', () => {
  it('should create empty state', () => {
    const s = createGraphLifecycleState();
    expect(s.entries.size).toBe(0);
  });

  it('should birth entry', () => {
    let s = createGraphLifecycleState();
    s = birthGraphEntry(s, 'g1');
    expect(s.entries.size).toBe(1);
  });

  it('should activate entry', () => {
    let s = createGraphLifecycleState();
    s = birthGraphEntry(s, 'g1');
    s = activateGraphEntry(s, 'g1');
    expect(s.entries.get('g1')?.phase).toBe('active');
  });

  it('should decay entry', () => {
    let s = createGraphLifecycleState();
    s = birthGraphEntry(s, 'g1');
    s = decayGraphEntry(s, 'g1');
    expect(s.entries.get('g1')?.phase).toBe('decay');
  });

  it('should expire entry', () => {
    let s = createGraphLifecycleState();
    s = birthGraphEntry(s, 'g1');
    s = expireGraphEntry(s, 'g1');
    expect(s.entries.get('g1')?.phase).toBe('expire');
  });

  it('should auto-transition expired', () => {
    let s = createGraphLifecycleState();
    s = birthGraphEntry(s, 'g1', 1);
    s = autoGraphTransition(s, Date.now() + 1000);
    expect(s.entries.get('g1')?.phase).toBe('expire');
  });

  it('should count by phase', () => {
    let s = createGraphLifecycleState();
    s = birthGraphEntry(s, 'a');
    s = birthGraphEntry(s, 'b');
    s = activateGraphEntry(s, 'a');
    const counts = countGraphPhase(s);
    expect(counts.create).toBe(1);
    expect(counts.active).toBe(1);
  });

  it('should compute health', () => {
    let s = createGraphLifecycleState();
    s = birthGraphEntry(s, 'g1');
    const h = graphLifecycleHealth(s);
    expect(h.active).toBe(1);
  });
});
