import { describe, it, expect } from 'vitest';
import { createContextLifecycleState, birthContextEntry, decayContextEntry, expireContextEntry, archiveContextEntry, autoContextTransition, contextLifecycleHealth } from './ContextLifecycle';

describe('V2281 ContextLifecycle', () => {
  it('should create empty state', () => {
    const s = createContextLifecycleState();
    expect(s.entries.size).toBe(0);
  });

  it('should birth entry', () => {
    let s = createContextLifecycleState();
    s = birthContextEntry(s, 'k1', Date.now() + 1000, Date.now() + 2000);
    expect(s.entries.size).toBe(1);
  });

  it('should decay entry', () => {
    let s = createContextLifecycleState();
    s = birthContextEntry(s, 'k1', Date.now() + 1000, Date.now() + 2000);
    s = decayContextEntry(s, 'k1');
    expect(s.entries.get('k1')?.phase).toBe('decaying');
  });

  it('should expire entry', () => {
    let s = createContextLifecycleState();
    s = birthContextEntry(s, 'k1', Date.now() + 1000, Date.now() + 2000);
    s = expireContextEntry(s, 'k1');
    expect(s.entries.get('k1')?.phase).toBe('expired');
  });

  it('should archive entry', () => {
    let s = createContextLifecycleState();
    s = birthContextEntry(s, 'k1', Date.now() + 1000, Date.now() + 2000);
    s = archiveContextEntry(s, 'k1');
    expect(s.entries.get('k1')?.phase).toBe('archived');
  });

  it('should auto-transition', () => {
    let s = createContextLifecycleState();
    const now = Date.now();
    s = birthContextEntry(s, 'k1', now + 100, now + 200);
    s = autoContextTransition(s, now + 150);
    expect(s.entries.get('k1')?.phase).toBe('decaying');
  });

  it('should compute health', () => {
    let s = createContextLifecycleState();
    s = birthContextEntry(s, 'k1', Date.now() + 1000, Date.now() + 2000);
    s = decayContextEntry(s, 'k1');
    const h = contextLifecycleHealth(s);
    expect(h.active).toBe(1);
  });
});
