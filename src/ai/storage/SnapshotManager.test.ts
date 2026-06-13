import { describe, it, expect } from 'vitest';
import {
  createSnapshotChain,
  createSnapshot,
  restoreSnapshot,
  getSnapshot,
  getCurrent,
  getAncestry,
  deleteSnapshot,
  chainSize,
  listSnapshots,
  snapshotHealth,
} from './SnapshotManager';

describe('V2133 SnapshotManager', () => {
  it('should create empty chain', () => {
    const c = createSnapshotChain();
    expect(c.snapshots).toEqual([]);
    expect(c.currentId).toBe(null);
  });

  it('should create a snapshot', () => {
    const { chain, snapshot } = createSnapshot(createSnapshotChain(), 'v1', 'data');
    expect(chain.snapshots).toHaveLength(1);
    expect(chain.currentId).toBe(snapshot.id);
  });

  it('should restore to a snapshot', () => {
    let c = createSnapshotChain();
    const a = createSnapshot(c, 'v1', 'a');
    c = a.chain;
    const b = createSnapshot(c, 'v2', 'b', a.snapshot.id);
    c = b.chain;
    const restored = restoreSnapshot(c, a.snapshot.id);
    expect(restored.currentId).toBe(a.snapshot.id);
  });

  it('should get current snapshot', () => {
    let c = createSnapshotChain();
    c = createSnapshot(c, 'v1', 'data').chain;
    const cur = getCurrent(c);
    expect(cur?.label).toBe('v1');
  });

  it('should get ancestry chain', () => {
    let c = createSnapshotChain();
    const a = createSnapshot(c, 'v1', 'a');
    c = a.chain;
    const b = createSnapshot(c, 'v2', 'b', a.snapshot.id);
    c = b.chain;
    const c2 = createSnapshot(c, 'v3', 'c', b.snapshot.id);
    c = c2.chain;
    const ancestry = getAncestry(c, c2.snapshot.id);
    expect(ancestry).toHaveLength(3);
    expect(ancestry[0].label).toBe('v1');
  });

  it('should not delete current snapshot', () => {
    let c = createSnapshotChain();
    c = createSnapshot(c, 'v1', 'a').chain;
    const cur = getCurrent(c)!;
    const d = deleteSnapshot(c, cur.id);
    expect(d.snapshots).toHaveLength(1);
  });

  it('should not delete snapshot with children', () => {
    let c = createSnapshotChain();
    const a = createSnapshot(c, 'v1', 'a');
    c = a.chain;
    c = createSnapshot(c, 'v2', 'b', a.snapshot.id).chain;
    const d = deleteSnapshot(c, a.snapshot.id);
    expect(d.snapshots).toHaveLength(2);
  });

  it('should compute chain size', () => {
    let c = createSnapshotChain();
    c = createSnapshot(c, 'a', '12345').chain;
    c = createSnapshot(c, 'b', '678').chain;
    expect(chainSize(c)).toBe(8);
  });

  it('should list snapshots by time', () => {
    let c = createSnapshotChain();
    c = createSnapshot(c, 'a', 'x').chain;
    c = createSnapshot(c, 'b', 'y').chain;
    const list = listSnapshots(c);
    expect(list).toHaveLength(2);
  });

  it('should compute snapshot health', () => {
    let c = createSnapshotChain();
    c = createSnapshot(c, 'a', 'x').chain;
    const h = snapshotHealth(c);
    expect(h.currentSet).toBe(true);
    expect(h.health).toBe(1);
  });
});
