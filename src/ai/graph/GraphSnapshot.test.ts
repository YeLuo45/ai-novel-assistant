import { describe, it, expect } from 'vitest';
import { createGraphSnapshotState, snapshotGraph, restoreGraphSnapshot, currentGraphSnap, deleteGraphSnapshot, graphSnapChain, graphSnapshotHealth } from './GraphSnapshot';

describe('V2183 GraphSnapshot', () => {
  it('should create empty state', () => {
    const s = createGraphSnapshotState();
    expect(s.snapshots).toEqual([]);
  });

  it('should snapshot graph', () => {
    const { state, snap } = snapshotGraph(createGraphSnapshotState(), 'v1', 10, 20);
    expect(state.snapshots).toHaveLength(1);
    expect(snap.nodeCount).toBe(10);
  });

  it('should restore snapshot', () => {
    let s = createGraphSnapshotState();
    const a = snapshotGraph(s, 'v1', 10, 20);
    s = a.state;
    const b = snapshotGraph(s, 'v2', 15, 25, a.snap.id);
    s = b.state;
    const r = restoreGraphSnapshot(s, a.snap.id);
    expect(r.currentId).toBe(a.snap.id);
  });

  it('should get current', () => {
    let s = createGraphSnapshotState();
    s = snapshotGraph(s, 'v1', 10, 20).state;
    expect(currentGraphSnap(s)?.label).toBe('v1');
  });

  it('should not delete current', () => {
    let s = createGraphSnapshotState();
    s = snapshotGraph(s, 'v1', 10, 20).state;
    const cur = s.currentId!;
    const d = deleteGraphSnapshot(s, cur);
    expect(d.snapshots).toHaveLength(1);
  });

  it('should get chain', () => {
    let s = createGraphSnapshotState();
    const a = snapshotGraph(s, 'v1', 10, 20);
    s = a.state;
    const b = snapshotGraph(s, 'v2', 15, 25, a.snap.id);
    s = b.state;
    const chain = graphSnapChain(s, b.snap.id);
    expect(chain).toHaveLength(2);
  });

  it('should compute health', () => {
    let s = createGraphSnapshotState();
    s = snapshotGraph(s, 'v1', 10, 20).state;
    const h = graphSnapshotHealth(s);
    expect(h.current).toBe(true);
  });
});
