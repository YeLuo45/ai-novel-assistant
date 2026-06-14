// V2275 ContextReplica - Direction J Iter 10/30
// Multi-region context replication
// Source: nanobot
export interface ContextReplicaInfo {
  region: string;
  lastSync: number;
  lag: number;
  online: boolean;
}

export interface ContextReplicaState {
  primaryRegion: string | null;
  replicas: Map<string, ContextReplicaInfo>;
  totalReplications: number;
}

export function createContextReplicaState(): ContextReplicaState {
  return { primaryRegion: null, replicas: new Map(), totalReplications: 0 };
}

export function setContextPrimary(state: ContextReplicaState, region: string): ContextReplicaState {
  return { ...state, primaryRegion: region };
}

export function addContextReplica(state: ContextReplicaState, region: string): ContextReplicaState {
  if (state.replicas.has(region)) return state;
  const replicas = new Map(state.replicas);
  replicas.set(region, { region, lastSync: Date.now(), lag: 0, online: true });
  return { ...state, replicas };
}

export function recordContextSync(state: ContextReplicaState, region: string, lag = 0): ContextReplicaState {
  const r = state.replicas.get(region);
  if (!r) return state;
  const replicas = new Map(state.replicas);
  replicas.set(region, { ...r, lastSync: Date.now(), lag });
  return { ...state, replicas, totalReplications: state.totalReplications + 1 };
}

export function setContextReplicaOnline(state: ContextReplicaState, region: string, online: boolean): ContextReplicaState {
  const r = state.replicas.get(region);
  if (!r) return state;
  const replicas = new Map(state.replicas);
  replicas.set(region, { ...r, online });
  return { ...state, replicas };
}

export function onlineContextReplicas(state: ContextReplicaState): ContextReplicaInfo[] {
  return Array.from(state.replicas.values()).filter((r) => r.online);
}

export function contextReplicaHealth(state: ContextReplicaState): { total: number; online: number; lag: number; health: number } {
  const online = onlineContextReplicas(state).length;
  const lag = Array.from(state.replicas.values()).reduce((m, r) => Math.max(m, r.lag), 0);
  return { total: state.replicas.size, online, lag, health: online > 0 ? 1 : 0 };
}
