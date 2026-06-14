// V2185 GraphReplica - Direction G Iter 10/30
// Multi-region graph replication
// Source: nanobot
export interface GraphReplicaInfo {
  region: string;
  lastSync: number;
  lag: number;
  online: boolean;
}

export interface GraphReplicaState {
  primaryRegion: string | null;
  replicas: Map<string, GraphReplicaInfo>;
  totalReplications: number;
}

export function createGraphReplicaState(): GraphReplicaState {
  return { primaryRegion: null, replicas: new Map(), totalReplications: 0 };
}

export function setGraphPrimary(state: GraphReplicaState, region: string): GraphReplicaState {
  return { ...state, primaryRegion: region };
}

export function addGraphReplica(state: GraphReplicaState, region: string): GraphReplicaState {
  if (state.replicas.has(region)) return state;
  const replicas = new Map(state.replicas);
  replicas.set(region, { region, lastSync: Date.now(), lag: 0, online: true });
  return { ...state, replicas };
}

export function recordGraphSync(state: GraphReplicaState, region: string, lag = 0): GraphReplicaState {
  const r = state.replicas.get(region);
  if (!r) return state;
  const replicas = new Map(state.replicas);
  replicas.set(region, { ...r, lastSync: Date.now(), lag });
  return { ...state, replicas, totalReplications: state.totalReplications + 1 };
}

export function setGraphReplicaOnline(state: GraphReplicaState, region: string, online: boolean): GraphReplicaState {
  const r = state.replicas.get(region);
  if (!r) return state;
  const replicas = new Map(state.replicas);
  replicas.set(region, { ...r, online });
  return { ...state, replicas };
}

export function onlineGraphReplicas(state: GraphReplicaState): GraphReplicaInfo[] {
  return Array.from(state.replicas.values()).filter((r) => r.online);
}

export function graphReplicaHealth(state: GraphReplicaState): { total: number; online: number; lag: number; health: number } {
  const online = onlineGraphReplicas(state).length;
  const lag = Array.from(state.replicas.values()).reduce((m, r) => Math.max(m, r.lag), 0);
  return { total: state.replicas.size, online, lag, health: online > 0 ? 1 : 0 };
}
