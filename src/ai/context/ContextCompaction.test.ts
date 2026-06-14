import { describe, it, expect } from 'vitest';
import { createContextCompactionState, enqueueContextEntry, runContextCompaction, contextCompactionHealth } from './ContextCompaction';

describe('V2277 ContextCompaction', () => {
  it('should create empty state', () => {
    const s = createContextCompactionState();
    expect(s.segments).toEqual([]);
  });

  it('should enqueue', () => {
    let s = createContextCompactionState();
    s = enqueueContextEntry(s, 'k1', { x: 1 });
    expect(s.pending.size).toBe(1);
  });

  it('should run compaction', () => {
    let s = createContextCompactionState();
    s = enqueueContextEntry(s, 'k1', 'a');
    s = enqueueContextEntry(s, 'k2', 'b');
    s = runContextCompaction(s);
    expect(s.segments).toHaveLength(1);
  });

  it('should not compact empty', () => {
    let s = createContextCompactionState();
    s = runContextCompaction(s);
    expect(s.segments).toEqual([]);
  });

  it('should dedupe by key', () => {
    let s = createContextCompactionState();
    s = enqueueContextEntry(s, 'k1', 'a');
    s = enqueueContextEntry(s, 'k1', 'b');
    s = runContextCompaction(s);
    expect(s.segments[0].finalCount).toBe(1);
  });

  it('should compute health', () => {
    const s = createContextCompactionState();
    const h = contextCompactionHealth(s);
    expect(h.health).toBe(0.5);
  });
});
