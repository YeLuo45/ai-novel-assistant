import { describe, it, expect } from 'vitest';
import { createMemorySnapshotChain, createMemorySnapshot, restoreMemorySnapshot, currentSnapshot, snapshotById, deleteMemorySnapshot, snapshotChain, totalSize, memorySnapshotHealth } from './MemorySnapshot';

describe('V2153 MemorySnapshot', () => {
  it('should create empty chain', () => {
    const c = createMemorySnapshotChain();
    expect(c.snapshots).toEqual([]);
  });

  it('should create snapshot', () => {
    const { chain, snapshot } = createMemorySnapshot(createMemorySnapshotChain(), 'v1', 'data');
    expect(chain.snapshots).toHaveLength(1);
    expect(chain.currentId).toBe(snapshot.id);
  });

  it('should restore to snapshot', () => {
    let c = createMemorySnapshotChain();
    const a = createMemorySnapshot(c, 'v1', 'a');
    c = a.chain;
    const b = createMemorySnapshot(c, 'v2', 'b', a.snapshot.id);
    c = b.chain;
    const r = restoreMemorySnapshot(c, a.snapshot.id);
    expect(r.currentId).toBe(a.snapshot.id);
  });

  it('should get current snapshot', () => {
    let c = createMemorySnapshotChain();
    c = createMemorySnapshot(c, 'v1', 'a').chain;
    expect(currentSnapshot(c)?.label).toBe('v1');
  });

  it('should get snapshot by id', () => {
    let c = createMemorySnapshotChain();
    c = createMemorySnapshot(c, 'v1', 'a').chain;
    const s = c.snapshots[0];
    expect(snapshotById(c, s.id)?.id).toBe(s.id);
  });

  it('should not delete current snapshot', () => {
    let c = createMemorySnapshotChain();
    c = createMemorySnapshot(c, 'v1', 'a').chain;
    const cur = c.currentId!;
    const d = deleteMemorySnapshot(c, cur);
    expect(d.snapshots).toHaveLength(1);
  });

  it('should get snapshot chain', () => {
    let c = createMemorySnapshotChain();
    const a = createMemorySnapshot(c, 'v1', 'a');
    c = a.chain;
    const b = createMemorySnapshot(c, 'v2', 'b', a.snapshot.id);
    c = b.chain;
    const chain = snapshotChain(c, b.snapshot.id);
    expect(chain).toHaveLength(2);
  });

  it('should compute total size', () => {
    let c = createMemorySnapshotChain();
    c = createMemorySnapshot(c, 'a', '12345').chain;
    c = createMemorySnapshot(c, 'b', '678').chain;
    expect(totalSize(c)).toBe(8);
  });

  it('should compute health', () => {
    let c = createMemorySnapshotChain();
    c = createMemorySnapshot(c, 'a', 'x').chain;
    const h = memorySnapshotHealth(c);
    expect(h.current).toBe(true);
    expect(h.health).toBe(1);
  });
});
