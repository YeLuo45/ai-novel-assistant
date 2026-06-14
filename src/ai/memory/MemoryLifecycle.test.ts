import { describe, it, expect } from 'vitest';
import { createMemoryLifecycleState, birth, mature, decay, expire, autoTransition, countByPhase, ageOf, memoryLifecycleHealth } from './MemoryLifecycle';

describe('V2161 MemoryLifecycle', () => {
  it('should create empty state', () => {
    const s = createMemoryLifecycleState();
    expect(s.entries.size).toBe(0);
  });

  it('should birth entry', () => {
    let s = createMemoryLifecycleState();
    s = birth(s, 'm1');
    expect(s.entries.size).toBe(1);
  });

  it('should mature entry', () => {
    let s = createMemoryLifecycleState();
    s = birth(s, 'm1');
    s = mature(s, 'm1');
    expect(s.entries.get('m1')?.phase).toBe('mature');
  });

  it('should decay entry', () => {
    let s = createMemoryLifecycleState();
    s = birth(s, 'm1');
    s = decay(s, 'm1');
    expect(s.entries.get('m1')?.phase).toBe('decay');
  });

  it('should expire entry', () => {
    let s = createMemoryLifecycleState();
    s = birth(s, 'm1');
    s = expire(s, 'm1');
    expect(s.entries.get('m1')?.phase).toBe('expire');
  });

  it('should auto-transition expired', () => {
    let s = createMemoryLifecycleState();
    s = birth(s, 'm1', 0.01, 1); // 1ms max age
    s = autoTransition(s, Date.now() + 1000);
    expect(s.entries.get('m1')?.phase).toBe('expire');
  });

  it('should count by phase', () => {
    let s = createMemoryLifecycleState();
    s = birth(s, 'a');
    s = birth(s, 'b');
    s = mature(s, 'a');
    const counts = countByPhase(s);
    expect(counts.create).toBe(1);
    expect(counts.mature).toBe(1);
  });

  it('should compute age', () => {
    let s = createMemoryLifecycleState();
    const t = Date.now();
    s = birth(s, 'm1');
    expect(ageOf(s, 'm1', t + 5000)).toBeGreaterThanOrEqual(0);
  });

  it('should compute health', () => {
    let s = createMemoryLifecycleState();
    s = birth(s, 'm1');
    const h = memoryLifecycleHealth(s);
    expect(h.active).toBe(1);
  });
});
