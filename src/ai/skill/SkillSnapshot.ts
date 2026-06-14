// V2303 SkillSnapshot - Direction K Iter 8/30
// Point-in-time skill snapshot
// Source: thunderbolt
export interface SkillSnap {
  id: string;
  label: string;
  entries: number;
  totalTokens: number;
  createdAt: number;
  parentId: string | null;
}

export interface SkillSnapshotState {
  snapshots: SkillSnap[];
  currentId: string | null;
}

export function createSkillSnapshotState(): SkillSnapshotState {
  return { snapshots: [], currentId: null };
}

export function snapshotSkill(state: SkillSnapshotState, label: string, entries: number, totalTokens: number, parentId: string | null = null): { state: SkillSnapshotState; snap: SkillSnap } {
  const snap: SkillSnap = { id: `ssnap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, label, entries, totalTokens, createdAt: Date.now(), parentId };
  return { state: { snapshots: [...state.snapshots, snap], currentId: snap.id }, snap };
}

export function restoreSkillSnapshot(state: SkillSnapshotState, id: string): SkillSnapshotState {
  if (!state.snapshots.some((s) => s.id === id)) return state;
  return { ...state, currentId: id };
}

export function currentSkillSnap(state: SkillSnapshotState): SkillSnap | undefined {
  return state.currentId ? state.snapshots.find((s) => s.id === state.currentId) : undefined;
}

export function deleteSkillSnapshot(state: SkillSnapshotState, id: string): SkillSnapshotState {
  if (state.currentId === id) return state;
  if (state.snapshots.some((s) => s.parentId === id)) return state;
  return { ...state, snapshots: state.snapshots.filter((s) => s.id !== id) };
}

export function skillSnapChain(state: SkillSnapshotState, id: string): SkillSnap[] {
  const result: SkillSnap[] = [];
  let current = state.snapshots.find((s) => s.id === id);
  while (current) { result.unshift(current); current = current.parentId ? state.snapshots.find((s) => s.id === current!.parentId) : undefined; }
  return result;
}

export function skillSnapshotHealth(state: SkillSnapshotState): { count: number; current: boolean; health: number } {
  return { count: state.snapshots.length, current: state.currentId !== null, health: state.currentId !== null ? 1 : 0 };
}
