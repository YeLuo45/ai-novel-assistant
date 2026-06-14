import { describe, it, expect } from 'vitest';
import { createCompactionState, enqueueCompact, runCompaction, pendingCount, totalCompression, setRatio, memoryCompactionHealth } from './MemoryCompaction';

describe('V2158 MemoryCompaction', () => {
  it('should create empty state', () => {
    const s = createCompactionState();
    expect(pendingCount(s)).toBe(0);
  });

  it('should enqueue content', () => {
    let s = createCompactionState();
    s = enqueueCompact(s, 'id1', 'some content here');
    expect(pendingCount(s)).toBe(1);
  });

  it('should run compaction', () => {
    let s = createCompactionState();
    s = enqueueCompact(s, 'id1', 'a  b  c');
    s = enqueueCompact(s, 'id2', 'd  e  f');
    s = runCompaction(s);
    expect(s.compacted).toHaveLength(1);
    expect(pendingCount(s)).toBe(0);
  });

  it('should not compact empty', () => {
    let s = createCompactionState();
    s = runCompaction(s);
    expect(s.compacted).toHaveLength(0);
  });

  it('should compute compression ratio', () => {
    let s = createCompactionState(0.5);
    s = enqueueCompact(s, 'id1', 'a'.repeat(100));
    s = runCompaction(s);
    expect(totalCompression(s)).toBeGreaterThan(0);
  });

  it('should set ratio clamped 0-1', () => {
    let s = createCompactionState();
    s = setRatio(s, 2);
    expect(s.ratio).toBe(1);
    s = setRatio(s, -1);
    expect(s.ratio).toBe(0);
  });

  it('should compute health', () => {
    const s = createCompactionState();
    const h = memoryCompactionHealth(s);
    expect(h.health).toBe(0.5);
  });
});
