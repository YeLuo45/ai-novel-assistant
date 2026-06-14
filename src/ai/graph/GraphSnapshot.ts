// V2183 GraphSnapshot - Direction G Iter 8/30
// Point-in-time graph snapshot
// Source: thunderbolt
export interface GraphSnap {
  id: string;
  label: string;
  nodeCount: number;
  edgeCount: number;
  createdAt: number;
  parentId: string | null;
}

export interface GraphSnapshotState {
  snapshots: GraphSnap[];
  currentId: string | null;
}

export function createGraphSnapshotState(): GraphSnapshotState {
  return { snapshots: [], currentId: null };
}

export function snapshotGraph(
  state: GraphSnapshotState,
  label: string,
  nodes: number,
  edges: number,
  parentId: string | null = null
): { state: GraphSnapshotState; snap: GraphSnap } {
  const snap: GraphSnap = {
    id: `gsnap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    label,
    nodeCount: nodes,
    edgeCount: edges,
    createdAt: Date.now(),
    parentId,
  };
  return { state: { snapshots: [...state.snapshots, snap], currentId: snap.id }, snap };
}

export function restoreGraphSnapshot(state: GraphSnapshotState, id: string): GraphSnapshotState {
  if (!state.snapshots.some((s) => s.id === id)) return state;
  return { ...state, currentId: id };
}

export function currentGraphSnap(state: GraphSnapshotState): GraphSnap | undefined {
  return state.currentId ? state.snapshots.find((s) => s.id === state.currentId) : undefined;
}

export function deleteGraphSnapshot(state: GraphSnapshotState, id: string): GraphSnapshotState {
  if (state.currentId === id) return state;
  if (state.snapshots.some((s) => s.parentId === id)) return state;
  return { ...state, snapshots: state.snapshots.filter((s) => s.id !== id) };
}

export function graphSnapChain(state: GraphSnapshotState, id: string): GraphSnap[] {
  const result: GraphSnap[] = [];
  let current = state.snapshots.find((s) => s.id === id);
  while (current) {
    result.unshift(current);
    current = current.parentId ? state.snapshots.find((s) => s.id === current!.parentId) : undefined;
  }
  return result;
}

export function graphSnapshotHealth(state: GraphSnapshotState): { count: number; current: boolean; health: number } {
  return { count: state.snapshots.length, current: state.currentId !== null, health: state.currentId !== null ? 1 : 0 };
}
