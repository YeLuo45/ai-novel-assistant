// V2258 CacheConsensus - Direction I Iter 23/30
// Distributed cache consensus
// Source: chatdev
export type CacheConsensusPhase = 'proposed' | 'voting' | 'committed' | 'rejected';

export interface CacheProposal {
  propId: string;
  key: string;
  proposedBy: string;
  phase: CacheConsensusPhase;
  votes: Map<string, boolean>;
}

export interface CacheConsensusStateType {
  proposals: Map<string, CacheProposal>;
  threshold: number;
}

export function createCacheConsensusState(threshold = 3): CacheConsensusStateType {
  return { proposals: new Map(), threshold };
}

export function proposeCache(state: CacheConsensusStateType, propId: string, key: string, proposedBy: string): CacheConsensusStateType {
  if (state.proposals.has(propId)) return state;
  const proposals = new Map(state.proposals);
  proposals.set(propId, { propId, key, proposedBy, phase: 'proposed', votes: new Map() });
  return { ...state, proposals };
}

export function openCacheVoting(state: CacheConsensusStateType, propId: string): CacheConsensusStateType {
  const p = state.proposals.get(propId);
  if (!p) return state;
  const proposals = new Map(state.proposals);
  proposals.set(propId, { ...p, phase: 'voting' });
  return { ...state, proposals };
}

export function voteCache(state: CacheConsensusStateType, propId: string, voter: string, approve: boolean): CacheConsensusStateType {
  const p = state.proposals.get(propId);
  if (!p || p.phase !== 'voting') return state;
  const votes = new Map(p.votes);
  votes.set(voter, approve);
  const proposals = new Map(state.proposals);
  proposals.set(propId, { ...p, votes });
  return { ...state, proposals };
}

export function tallyCacheConsensus(state: CacheConsensusStateType, propId: string): CacheConsensusStateType {
  const p = state.proposals.get(propId);
  if (!p) return state;
  const yes = Array.from(p.votes.values()).filter((v) => v).length;
  const no = Array.from(p.votes.values()).filter((v) => !v).length;
  const total = p.votes.size;
  const newPhase: CacheConsensusPhase = total >= state.threshold && yes > no ? 'committed' : total >= state.threshold ? 'rejected' : p.phase;
  const proposals = new Map(state.proposals);
  proposals.set(propId, { ...p, phase: newPhase });
  return { ...state, proposals };
}

export function cacheConsensusHealth(state: CacheConsensusStateType): { proposals: number; committed: number; health: number } {
  let committed = 0;
  for (const p of state.proposals.values()) if (p.phase === 'committed') committed++;
  return { proposals: state.proposals.size, committed, health: state.proposals.size > 0 ? 1 : 0.5 };
}
