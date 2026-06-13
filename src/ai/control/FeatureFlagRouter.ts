// V2139 FeatureFlagRouter - Direction A Iter 24/30
// 特性开关路由 - 灰度发布
// Source: chatdev (feature gating)

export type FlagState = 'on' | 'off' | 'rollout';

export interface FeatureFlag {
  flagId: string;
  name: string;
  state: FlagState;
  rolloutPct: number; // 0-100
  createdAt: number;
  cohort: string;
}

export interface FlagStateMap {
  flags: Map<string, FeatureFlag>;
  evaluations: Map<string, { allowed: number; denied: number }>;
}

export function createFlagState(): FlagStateMap {
  return { flags: new Map(), evaluations: new Map() };
}

export function addFlag(state: FlagStateMap, flag: FeatureFlag): FlagStateMap {
  const flags = new Map(state.flags);
  flags.set(flag.flagId, flag);
  return { ...state, flags };
}

export function setFlag(state: FlagStateMap, flagId: string, flagState: FlagState, rolloutPct = 100): FlagStateMap {
  const flag = state.flags.get(flagId);
  if (!flag) return state;
  const flags = new Map(state.flags);
  flags.set(flagId, { ...flag, state: flagState, rolloutPct });
  return { ...state, flags };
}

/** Deterministic rollout based on userId hash */
export function isEnabled(state: FlagStateMap, flagId: string, userId: string): boolean {
  const flag = state.flags.get(flagId);
  if (!flag) return false;
  if (flag.state === 'off') return false;
  if (flag.state === 'on') return true;
  // Rollout: hash userId, mod 100
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) & 0x7fffffff;
  return h % 100 < flag.rolloutPct;
}

/** Record an evaluation */
export function recordEvaluation(state: FlagStateMap, flagId: string, allowed: boolean): FlagStateMap {
  const evaluations = new Map(state.evaluations);
  const cur = evaluations.get(flagId) || { allowed: 0, denied: 0 };
  evaluations.set(flagId, { allowed: cur.allowed + (allowed ? 1 : 0), denied: cur.denied + (allowed ? 0 : 1) });
  return { ...state, evaluations };
}

/** Evaluate + record */
export function evaluate(state: FlagStateMap, flagId: string, userId: string): boolean {
  const allowed = isEnabled(state, flagId, userId);
  return recordEvaluation(state, flagId, allowed).evaluations.get(flagId)?.allowed !== undefined;
}

export function getFlag(state: FlagStateMap, flagId: string): FeatureFlag | undefined {
  return state.flags.get(flagId);
}

export function listFlags(state: FlagStateMap): FeatureFlag[] {
  return Array.from(state.flags.values());
}

export function flagStats(state: FlagStateMap, flagId: string): { allowed: number; denied: number; total: number } {
  const e = state.evaluations.get(flagId) || { allowed: 0, denied: 0 };
  return { allowed: e.allowed, denied: e.denied, total: e.allowed + e.denied };
}

export function flagHealth(state: FlagStateMap): { totalFlags: number; activeFlags: number; health: number } {
  const total = state.flags.size;
  const active = Array.from(state.flags.values()).filter((f) => f.state !== 'off').length;
  return { totalFlags: total, activeFlags: active, health: total > 0 ? 1 : 0.5 };
}
