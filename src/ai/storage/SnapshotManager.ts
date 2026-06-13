// V2133 SnapshotManager - Direction A Iter 18/30
// 快照管理 - 时间点恢复
// Source: ruflo (snapshot / point-in-time recovery)

export interface DataSnapshot {
  id: string;
  label: string;
  data: string;
  createdAt: number;
  parentId: string | null;
  sizeBytes: number;
}

export interface SnapshotChain {
  snapshots: DataSnapshot[];
  currentId: string | null;
}

export function createSnapshotChain(): SnapshotChain {
  return { snapshots: [], currentId: null };
}

/** Create a new snapshot, optionally linked to a parent */
export function createSnapshot(
  chain: SnapshotChain,
  label: string,
  data: string,
  parentId: string | null = null
): { chain: SnapshotChain; snapshot: DataSnapshot } {
  const snap: DataSnapshot = {
    id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    data,
    createdAt: Date.now(),
    parentId,
    sizeBytes: data.length,
  };
  return {
    chain: { snapshots: [...chain.snapshots, snap], currentId: snap.id },
    snapshot: snap,
  };
}

/** Restore chain to a specific snapshot */
export function restoreSnapshot(chain: SnapshotChain, snapshotId: string): SnapshotChain {
  if (!chain.snapshots.some((s) => s.id === snapshotId)) return chain;
  return { ...chain, currentId: snapshotId };
}

/** Get snapshot by id */
export function getSnapshot(chain: SnapshotChain, id: string): DataSnapshot | undefined {
  return chain.snapshots.find((s) => s.id === id);
}

/** Get current snapshot */
export function getCurrent(chain: SnapshotChain): DataSnapshot | undefined {
  return chain.currentId ? getSnapshot(chain, chain.currentId) : undefined;
}

/** Get parent chain (ancestors) */
export function getAncestry(chain: SnapshotChain, snapshotId: string): DataSnapshot[] {
  const ancestry: DataSnapshot[] = [];
  let current = getSnapshot(chain, snapshotId);
  while (current) {
    ancestry.unshift(current);
    current = current.parentId ? getSnapshot(chain, current.parentId) : undefined;
  }
  return ancestry;
}

/** Delete a snapshot (only if not current and no children) */
export function deleteSnapshot(chain: SnapshotChain, id: string): SnapshotChain {
  if (chain.currentId === id) return chain;
  if (chain.snapshots.some((s) => s.parentId === id)) return chain;
  return { ...chain, snapshots: chain.snapshots.filter((s) => s.id !== id) };
}

/** Get total chain size */
export function chainSize(chain: SnapshotChain): number {
  return chain.snapshots.reduce((s, snap) => s + snap.sizeBytes, 0);
}

/** List snapshots sorted by time */
export function listSnapshots(chain: SnapshotChain): DataSnapshot[] {
  return [...chain.snapshots].sort((a, b) => a.createdAt - b.createdAt);
}

/** Snapshot health metric */
export function snapshotHealth(chain: SnapshotChain): { count: number; currentSet: boolean; totalBytes: number; health: number } {
  const health = chain.currentId !== null ? 1 : 0;
  return { count: chain.snapshots.length, currentSet: chain.currentId !== null, totalBytes: chainSize(chain), health };
}
