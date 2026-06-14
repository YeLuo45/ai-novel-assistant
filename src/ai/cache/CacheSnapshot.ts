// V2243 CacheSnapshot - Direction I Iter 8/30
// Point-in-time cache snapshot
// Source: thunderbolt
export interface CacheSnap {
  id: string;
  label: string;
  entryCount: number;
  totalBytes: number;
  createdAt: number;
  parentId: string | null;
}

export interface CacheSnapshotState {
  snapshots: CacheSnap[];
  currentId: string | null;
}

export function createCacheSnapshotState(): CacheSnapshotState {
  return { snapshots: [], currentId: null };
}

export function snapshotCache(state: CacheSnapshotState, label: string, entryCount: number, totalBytes: number, parentId: string | null = null): { state: CacheSnapshotState; snap: CacheSnap } {
  const snap: CacheSnap = { id: `csnap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, label, entryCount, totalBytes, createdAt: Date.now(), parentId };
  return { state: { snapshots: [...state.snapshots, snap], currentId: snap.id }, snap };
}

export function restoreCacheSnapshot(state: CacheSnapshotState, id: string): CacheSnapshotState {
  if (!state.snapshots.some((s) => s.id === id)) return state;
  return { ...state, currentId: id };
}

export function currentCacheSnap(state: CacheSnapshotState): CacheSnap | undefined {
  return state.currentId ? state.snapshots.find((s) => s.id === state.currentId) : undefined;
}

export function deleteCacheSnapshot(state: CacheSnapshotState, id: string): CacheSnapshotState {
  if (state.currentId === id) return state;
  if (state.snapshots.some((s) => s.parentId === id)) return state;
  return { ...state, snapshots: state.snapshots.filter((s) => s.id !== id) };
}

export function cacheSnapChain(state: CacheSnapshotState, id: string): CacheSnap[] {
  const result: CacheSnap[] = [];
  let current = state.snapshots.find((s) => s.id === id);
  while (current) {
    result.unshift(current);
    current = current.parentId ? state.snapshots.find((s) => s.id === current!.parentId) : undefined;
  }
  return result;
}

export function cacheSnapshotHealth(state: CacheSnapshotState): { count: number; current: boolean; health: number } {
  return { count: state.snapshots.length, current: state.currentId !== null, health: state.currentId !== null ? 1 : 0 };
}
