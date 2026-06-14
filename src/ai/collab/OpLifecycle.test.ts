import { describe, it, expect } from 'vitest';
import { createOpLifecycleState, createOpEntry, markOpApplied, markOpRejected, expireOp, autoExpireOps, countOpPhases, opLifecycleHealth } from './OpLifecycle';

describe('V2221 OpLifecycle', () => {
  it('should create empty state', () => {
    const s = createOpLifecycleState();
    expect(s.entries.size).toBe(0);
  });

  it('should create op entry', () => {
    let s = createOpLifecycleState();
    s = createOpEntry(s, 'op1');
    expect(s.entries.size).toBe(1);
  });

  it('should mark applied', () => {
    let s = createOpLifecycleState();
    s = createOpEntry(s, 'op1');
    s = markOpApplied(s, 'op1');
    expect(s.entries.get('op1')?.phase).toBe('applied');
  });

  it('should mark rejected', () => {
    let s = createOpLifecycleState();
    s = createOpEntry(s, 'op1');
    s = markOpRejected(s, 'op1');
    expect(s.entries.get('op1')?.phase).toBe('rejected');
  });

  it('should expire op', () => {
    let s = createOpLifecycleState();
    s = createOpEntry(s, 'op1');
    s = expireOp(s, 'op1');
    expect(s.entries.get('op1')?.phase).toBe('expired');
  });

  it('should auto-expire', () => {
    let s = createOpLifecycleState();
    s = createOpEntry(s, 'op1', 1);
    s = autoExpireOps(s, Date.now() + 1000);
    expect(s.entries.get('op1')?.phase).toBe('expired');
  });

  it('should count by phase', () => {
    let s = createOpLifecycleState();
    s = createOpEntry(s, 'a');
    s = createOpEntry(s, 'b');
    s = markOpApplied(s, 'a');
    const counts = countOpPhases(s);
    expect(counts.created).toBe(1);
  });

  it('should compute health', () => {
    let s = createOpLifecycleState();
    s = createOpEntry(s, 'op1');
    s = markOpApplied(s, 'op1');
    const h = opLifecycleHealth(s);
    expect(h.health).toBe(1);
  });
});
