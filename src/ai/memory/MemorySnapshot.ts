// V2153 MemorySnapshot - Direction F Iter 8/30
// Point-in-time memory snapshot
// Source: thunderbolt
export interface MemorySnapshot {
  id: string;
  label: string;
  dataHash: string;
  size: number;
  createdAt: number;
  parentId: string | null;
}

export interface MemorySnapshotChain {
  snapshots: MemorySnapshot[];
  currentId: string | null;
}

export function createMemorySnapshotChain(): MemorySnapshotChain {
  return { snapshots: [], currentId: null };
}

function fnv(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function createMemorySnapshot(
  chain: MemorySnapshotChain,
  label: string,
  data: string,
  parentId: string | null = null
): { chain: MemorySnapshotChain; snapshot: MemorySnapshot } {
  const snap: MemorySnapshot = {
    id: `msnap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    label,
    dataHash: fnv(data),
    size: data.length,
    createdAt: Date.now(),
    parentId,
  };
  return { chain: { snapshots: [...chain.snapshots, snap], currentId: snap.id }, snapshot: snap };
}

export function restoreMemorySnapshot(chain: MemorySnapshotChain, id: string): MemorySnapshotChain {
  if (!chain.snapshots.some((s) => s.id === id)) return chain;
  return { ...chain, currentId: id };
}

export function currentSnapshot(chain: MemorySnapshotChain): MemorySnapshot | undefined {
  return chain.currentId ? chain.snapshots.find((s) => s.id === chain.currentId) : undefined;
}

export function snapshotById(chain: MemorySnapshotChain, id: string): MemorySnapshot | undefined {
  return chain.snapshots.find((s) => s.id === id);
}

export function deleteMemorySnapshot(chain: MemorySnapshotChain, id: string): MemorySnapshotChain {
  if (chain.currentId === id) return chain;
  if (chain.snapshots.some((s) => s.parentId === id)) return chain;
  return { ...chain, snapshots: chain.snapshots.filter((s) => s.id !== id) };
}

export function snapshotChain(chain: MemorySnapshotChain, id: string): MemorySnapshot[] {
  const result: MemorySnapshot[] = [];
  let current = snapshotById(chain, id);
  while (current) {
    result.unshift(current);
    current = current.parentId ? snapshotById(chain, current.parentId) : undefined;
  }
  return result;
}

export function totalSize(chain: MemorySnapshotChain): number {
  return chain.snapshots.reduce((s, snap) => s + snap.size, 0);
}

export function memorySnapshotHealth(chain: MemorySnapshotChain): { count: number; current: boolean; totalBytes: number; health: number } {
  return { count: chain.snapshots.length, current: chain.currentId !== null, totalBytes: totalSize(chain), health: chain.currentId !== null ? 1 : 0 };
}
