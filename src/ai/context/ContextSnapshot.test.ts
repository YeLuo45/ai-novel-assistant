import { describe, it, expect } from 'vitest';
import { createContextSnapshotState, snapshotContext, restoreContextSnapshot, currentContextSnap, deleteContextSnapshot, contextSnapChain, contextSnapshotHealth } from './ContextSnapshot';

describe('V2273 ContextSnapshot', () => {
  it('should create empty state', () => {
    const s = createContextSnapshotState();
    expect(s.snapshots).toEqual([]);
  });

  it('should snapshot', () => {
    const { state, snap } = snapshotContext(createContextSnapshotState(), 'v1', 10, 500);
    expect(state.snapshots).toHaveLength(1);
    expect(snap.entries).toBe(10);
  });

  it('should restore', () => {
    let s = createContextSnapshotState();
    const a = snapshotContext(s, 'v1', 10, 500);
    s = a.state;
    const b = snapshotContext(s, 'v2', 20, 1000, a.snap.id);
    s = b.state;
    const r = restoreContextSnapshot(s, a.snap.id);
    expect(r.currentId).toBe(a.snap.id);
  });

  it('should get current', () => {
    let s = createContextSnapshotState();
    s = snapshotContext(s, 'v1', 10, 500).state;
    expect(currentContextSnap(s)?.label).toBe('v1');
  });

  it('should not delete current', () => {
    let s = createContextSnapshotState();
    s = snapshotContext(s, 'v1', 10, 500).state;
    const d = deleteContextSnapshot(s, s.currentId!);
    expect(d.snapshots).toHaveLength(1);
  });

  it('should compute chain', () => {
    let s = createContextSnapshotState();
    const a = snapshotContext(s, 'v1', 10, 500);
    s = a.state;
    const b = snapshotContext(s, 'v2', 20, 1000, a.snap.id);
    s = b.state;
    expect(contextSnapChain(s, b.snap.id)).toHaveLength(2);
  });

  it('should compute health', () => {
    let s = createContextSnapshotState();
    s = snapshotContext(s, 'v1', 10, 500).state;
    const h = contextSnapshotHealth(s);
    expect(h.current).toBe(true);
  });
});
