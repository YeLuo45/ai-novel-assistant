// V2288 ContextConsensus - Direction J Iter 23/30
// Distributed context consensus
// Source: chatdev
export type ContextConsensusPhase = 'proposed' | 'voting' | 'committed' | 'rejected';

export interface ContextProposal {
  propId: string;
  key: string;
  proposedBy: string;
  phase: ContextConsensusPhase;
  votes: Map<string, boolean>;
}

export interface ContextConsensusStateType {
  proposals: Map<string, ContextProposal>;
  threshold: number;
}

export function createContextConsensusState(threshold = 3): ContextConsensusStateType {
  return { proposals: new Map(), threshold };
}

export function proposeContext(state: ContextConsensusStateType, propId: string, key: string, proposedBy: string): ContextConsensusStateType {
  if (state.proposals.has(propId)) return state;
  const proposals = new Map(state.proposals);
  proposals.set(propId, { propId, key, proposedBy, phase: 'proposed', votes: new Map() });
  return { ...state, proposals };
}

export function openContextVoting(state: ContextConsensusStateType, propId: string): ContextConsensusStateType {
  const p = state.proposals.get(propId);
  if (!p) return state;
  const proposals = new Map(state.proposals);
  proposals.set(propId, { ...p, phase: 'voting' });
  return { ...state, proposals };
}

export function voteContext(state: ContextConsensusStateType, propId: string, voter: string, approve: boolean): ContextConsensusStateType {
  const p = state.proposals.get(propId);
  if (!p || p.phase !== 'voting') return state;
  const votes = new Map(p.votes);
  votes.set(voter, approve);
  const proposals = new Map(state.proposals);
  proposals.set(propId, { ...p, votes });
  return { ...state, proposals };
}

export function tallyContextConsensus(state: ContextConsensusStateType, propId: string): ContextConsensusStateType {
  const p = state.proposals.get(propId);
  if (!p) return state;
  const yes = Array.from(p.votes.values()).filter((v) => v).length;
  const no = Array.from(p.votes.values()).filter((v) => !v).length;
  const total = p.votes.size;
  const newPhase: ContextConsensusPhase = total >= state.threshold && yes > no ? 'committed' : total >= state.threshold ? 'rejected' : p.phase;
  const proposals = new Map(state.proposals);
  proposals.set(propId, { ...p, phase: newPhase });
  return { ...state, proposals };
}

export function contextConsensusHealth(state: ContextConsensusStateType): { proposals: number; committed: number; health: number } {
  let committed = 0;
  for (const p of state.proposals.values()) if (p.phase === 'committed') committed++;
  return { proposals: state.proposals.size, committed, health: state.proposals.size > 0 ? 1 : 0.5 };
}
