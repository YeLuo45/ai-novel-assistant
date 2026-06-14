// V2273 ContextSnapshot - Direction J Iter 8/30
// Point-in-time context snapshot
// Source: thunderbolt
export interface ContextSnap {
  id: string;
  label: string;
  entries: number;
  totalTokens: number;
  createdAt: number;
  parentId: string | null;
}

export interface ContextSnapshotState {
  snapshots: ContextSnap[];
  currentId: string | null;
}

export function createContextSnapshotState(): ContextSnapshotState {
  return { snapshots: [], currentId: null };
}

export function snapshotContext(state: ContextSnapshotState, label: string, entries: number, totalTokens: number, parentId: string | null = null): { state: ContextSnapshotState; snap: ContextSnap } {
  const snap: ContextSnap = { id: `ctxsnap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, label, entries, totalTokens, createdAt: Date.now(), parentId };
  return { state: { snapshots: [...state.snapshots, snap], currentId: snap.id }, snap };
}

export function restoreContextSnapshot(state: ContextSnapshotState, id: string): ContextSnapshotState {
  if (!state.snapshots.some((s) => s.id === id)) return state;
  return { ...state, currentId: id };
}

export function currentContextSnap(state: ContextSnapshotState): ContextSnap | undefined {
  return state.currentId ? state.snapshots.find((s) => s.id === state.currentId) : undefined;
}

export function deleteContextSnapshot(state: ContextSnapshotState, id: string): ContextSnapshotState {
  if (state.currentId === id) return state;
  if (state.snapshots.some((s) => s.parentId === id)) return state;
  return { ...state, snapshots: state.snapshots.filter((s) => s.id !== id) };
}

export function contextSnapChain(state: ContextSnapshotState, id: string): ContextSnap[] {
  const result: ContextSnap[] = [];
  let current = state.snapshots.find((s) => s.id === id);
  while (current) { result.unshift(current); current = current.parentId ? state.snapshots.find((s) => s.id === current!.parentId) : undefined; }
  return result;
}

export function contextSnapshotHealth(state: ContextSnapshotState): { count: number; current: boolean; health: number } {
  return { count: state.snapshots.length, current: state.currentId !== null, health: state.currentId !== null ? 1 : 0 };
}
