// V2305 SkillReplica - Direction K Iter 10/30
// Multi-region skill replication
// Source: nanobot
export interface SkillReplicaInfo {
  region: string;
  lastSync: number;
  lag: number;
  online: boolean;
}

export interface SkillReplicaState {
  primaryRegion: string | null;
  replicas: Map<string, SkillReplicaInfo>;
  totalReplications: number;
}

export function createSkillReplicaState(): SkillReplicaState {
  return { primaryRegion: null, replicas: new Map(), totalReplications: 0 };
}

export function setSkillPrimary(state: SkillReplicaState, region: string): SkillReplicaState {
  return { ...state, primaryRegion: region };
}

export function addSkillReplica(state: SkillReplicaState, region: string): SkillReplicaState {
  if (state.replicas.has(region)) return state;
  const replicas = new Map(state.replicas);
  replicas.set(region, { region, lastSync: Date.now(), lag: 0, online: true });
  return { ...state, replicas };
}

export function recordSkillSync(state: SkillReplicaState, region: string, lag = 0): SkillReplicaState {
  const r = state.replicas.get(region);
  if (!r) return state;
  const replicas = new Map(state.replicas);
  replicas.set(region, { ...r, lastSync: Date.now(), lag });
  return { ...state, replicas, totalReplications: state.totalReplications + 1 };
}

export function setSkillReplicaOnline(state: SkillReplicaState, region: string, online: boolean): SkillReplicaState {
  const r = state.replicas.get(region);
  if (!r) return state;
  const replicas = new Map(state.replicas);
  replicas.set(region, { ...r, online });
  return { ...state, replicas };
}

export function onlineSkillReplicas(state: SkillReplicaState): SkillReplicaInfo[] {
  return Array.from(state.replicas.values()).filter((r) => r.online);
}

export function skillReplicaHealth(state: SkillReplicaState): { total: number; online: number; lag: number; health: number } {
  const online = onlineSkillReplicas(state).length;
  const lag = Array.from(state.replicas.values()).reduce((m, r) => Math.max(m, r.lag), 0);
  return { total: state.replicas.size, online, lag, health: online > 0 ? 1 : 0 };
}
