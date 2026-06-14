// V2147 MemoryStorage - Direction F Iter 2/30
// Persistent key-value memory storage with versioning
// Source: thunderbolt
export interface MemoryVersion {
  versionId: string;
  data: string;
  ts: number;
}

export interface StoredMemory {
  key: string;
  versions: MemoryVersion[];
  currentVersionId: string;
}

export interface MemoryStorageState {
  store: Map<string, StoredMemory>;
  totalWrites: number;
}

export function createMemoryStorage(): MemoryStorageState {
  return { store: new Map(), totalWrites: 0 };
}

export function putMemory(state: MemoryStorageState, key: string, data: string): MemoryStorageState {
  const version: MemoryVersion = { versionId: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, data, ts: Date.now() };
  const existing = state.store.get(key);
  if (existing) {
    const newStore = new Map(state.store);
    newStore.set(key, { key, versions: [...existing.versions, version], currentVersionId: version.versionId });
    return { store: newStore, totalWrites: state.totalWrites + 1 };
  }
  const newStore = new Map(state.store);
  newStore.set(key, { key, versions: [version], currentVersionId: version.versionId });
  return { store: newStore, totalWrites: state.totalWrites + 1 };
}

export function getMemory(state: MemoryStorageState, key: string): string | null {
  return state.store.get(key)?.versions.find((v) => v.versionId === state.store.get(key)!.currentVersionId)?.data ?? null;
}

export function getVersion(state: MemoryStorageState, key: string, versionId: string): string | null {
  return state.store.get(key)?.versions.find((v) => v.versionId === versionId)?.data ?? null;
}

export function listKeys(state: MemoryStorageState): string[] {
  return Array.from(state.store.keys());
}

export function versionCount(state: MemoryStorageState, key: string): number {
  return state.store.get(key)?.versions.length ?? 0;
}

export function deleteMemory(state: MemoryStorageState, key: string): MemoryStorageState {
  const newStore = new Map(state.store);
  newStore.delete(key);
  return { ...state, store: newStore };
}

export function rollbackTo(state: MemoryStorageState, key: string, versionId: string): MemoryStorageState {
  const m = state.store.get(key);
  if (!m || !m.versions.some((v) => v.versionId === versionId)) return state;
  const newStore = new Map(state.store);
  newStore.set(key, { ...m, currentVersionId: versionId });
  return { ...state, store: newStore };
}

export function memoryStorageHealth(state: MemoryStorageState): { keys: number; totalWrites: number; health: number } {
  return { keys: state.store.size, totalWrites: state.totalWrites, health: state.store.size > 0 ? 1 : 0.5 };
}
