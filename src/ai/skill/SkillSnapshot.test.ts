import { describe, it, expect } from 'vitest';
import { createSkillSnapshotState, snapshotSkill, restoreSkillSnapshot, currentSkillSnap, deleteSkillSnapshot, skillSnapChain, skillSnapshotHealth } from './SkillSnapshot';

describe('V2303 SkillSnapshot', () => {
  it('should create empty state', () => {
    const s = createSkillSnapshotState();
    expect(s.snapshots).toEqual([]);
  });

  it('should snapshot', () => {
    const { state, snap } = snapshotSkill(createSkillSnapshotState(), 'v1', 10, 500);
    expect(state.snapshots).toHaveLength(1);
    expect(snap.entries).toBe(10);
  });

  it('should restore', () => {
    let s = createSkillSnapshotState();
    const a = snapshotSkill(s, 'v1', 10, 500);
    s = a.state;
    const b = snapshotSkill(s, 'v2', 20, 1000, a.snap.id);
    s = b.state;
    const r = restoreSkillSnapshot(s, a.snap.id);
    expect(r.currentId).toBe(a.snap.id);
  });

  it('should get current', () => {
    let s = createSkillSnapshotState();
    s = snapshotSkill(s, 'v1', 10, 500).state;
    expect(currentSkillSnap(s)?.label).toBe('v1');
  });

  it('should not delete current', () => {
    let s = createSkillSnapshotState();
    s = snapshotSkill(s, 'v1', 10, 500).state;
    const d = deleteSkillSnapshot(s, s.currentId!);
    expect(d.snapshots).toHaveLength(1);
  });

  it('should compute chain', () => {
    let s = createSkillSnapshotState();
    const a = snapshotSkill(s, 'v1', 10, 500);
    s = a.state;
    const b = snapshotSkill(s, 'v2', 20, 1000, a.snap.id);
    s = b.state;
    expect(skillSnapChain(s, b.snap.id)).toHaveLength(2);
  });

  it('should compute health', () => {
    let s = createSkillSnapshotState();
    s = snapshotSkill(s, 'v1', 10, 500).state;
    const h = skillSnapshotHealth(s);
    expect(h.current).toBe(true);
  });
});
