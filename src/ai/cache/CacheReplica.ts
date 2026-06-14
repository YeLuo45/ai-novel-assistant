// V2245 CacheReplica - Direction I Iter 10/30
// Multi-region cache replication
// Source: nanobot
export interface CacheReplicaInfo {
  region: string;
  lastSync: number;
  lag: number;
  online: boolean;
}

export interface CacheReplicaState {
  primaryRegion: string | null;
  replicas: Map<string, CacheReplicaInfo>;
  totalReplications: number;
}

export function createCacheReplicaState(): CacheReplicaState {
  return { primaryRegion: null, replicas: new Map(), totalReplications: 0 };
}

export function setCachePrimary(state: CacheReplicaState, region: string): CacheReplicaState {
  return { ...state, primaryRegion: region };
}

export function addCacheReplica(state: CacheReplicaState, region: string): CacheReplicaState {
  if (state.replicas.has(region)) return state;
  const replicas = new Map(state.replicas);
  replicas.set(region, { region, lastSync: Date.now(), lag: 0, online: true });
  return { ...state, replicas };
}

export function recordCacheSync(state: CacheReplicaState, region: string, lag = 0): CacheReplicaState {
  const r = state.replicas.get(region);
  if (!r) return state;
  const replicas = new Map(state.replicas);
  replicas.set(region, { ...r, lastSync: Date.now(), lag });
  return { ...state, replicas, totalReplications: state.totalReplications + 1 };
}

export function setCacheReplicaOnline(state: CacheReplicaState, region: string, online: boolean): CacheReplicaState {
  const r = state.replicas.get(region);
  if (!r) return state;
  const replicas = new Map(state.replicas);
  replicas.set(region, { ...r, online });
  return { ...state, replicas };
}

export function onlineCacheReplicas(state: CacheReplicaState): CacheReplicaInfo[] {
  return Array.from(state.replicas.values()).filter((r) => r.online);
}

export function cacheReplicaHealth(state: CacheReplicaState): { total: number; online: number; lag: number; health: number } {
  const online = onlineCacheReplicas(state).length;
  const lag = Array.from(state.replicas.values()).reduce((m, r) => Math.max(m, r.lag), 0);
  return { total: state.replicas.size, online, lag, health: online > 0 ? 1 : 0 };
}
