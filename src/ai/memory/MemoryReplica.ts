// V2156 MemoryReplica - Direction F Iter 11/30
// Multi-region replication
// Source: nanobot
export interface Replica {
  region: string;
  lastSync: number;
  lag: number;
  online: boolean;
}

export interface MemoryReplicaState {
  primaryRegion: string | null;
  replicas: Map<string, Replica>;
  totalReplications: number;
}

export function createMemoryReplicaState(): MemoryReplicaState {
  return { primaryRegion: null, replicas: new Map(), totalReplications: 0 };
}

export function setPrimary(state: MemoryReplicaState, region: string): MemoryReplicaState {
  return { ...state, primaryRegion: region };
}

export function addReplica(state: MemoryReplicaState, region: string): MemoryReplicaState {
  if (state.replicas.has(region)) return state;
  const replicas = new Map(state.replicas);
  replicas.set(region, { region, lastSync: Date.now(), lag: 0, online: true });
  return { ...state, replicas };
}

export function recordSync(state: MemoryReplicaState, region: string, lag = 0): MemoryReplicaState {
  const r = state.replicas.get(region);
  if (!r) return state;
  const replicas = new Map(state.replicas);
  replicas.set(region, { ...r, lastSync: Date.now(), lag });
  return { ...state, replicas, totalReplications: state.totalReplications + 1 };
}

export function setReplicaOnline(state: MemoryReplicaState, region: string, online: boolean): MemoryReplicaState {
  const r = state.replicas.get(region);
  if (!r) return state;
  const replicas = new Map(state.replicas);
  replicas.set(region, { ...r, online });
  return { ...state, replicas };
}

export function onlineReplicas(state: MemoryReplicaState): Replica[] {
  return Array.from(state.replicas.values()).filter((r) => r.online);
}

export function maxLag(state: MemoryReplicaState): number {
  return Array.from(state.replicas.values()).reduce((m, r) => Math.max(m, r.lag), 0);
}

export function replicaHealth(state: MemoryReplicaState): { total: number; online: number; lag: number; health: number } {
  const online = onlineReplicas(state).length;
  const lag = maxLag(state);
  const health = online > 0 ? (lag < 1000 ? 1 : 0.5) : 0;
  return { total: state.replicas.size, online, lag, health };
}
