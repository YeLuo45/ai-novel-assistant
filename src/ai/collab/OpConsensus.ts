// V2228 OpConsensus - Direction H Iter 23/30
// Distributed op consensus
// Source: chatdev
export type OpConsensusState = 'proposed' | 'voting' | 'committed' | 'rejected';

export interface OpProposal {
  propId: string;
  opId: string;
  proposedBy: string;
  state: OpConsensusState;
  votes: Map<string, boolean>;
}

export interface OpConsensusStateType {
  proposals: Map<string, OpProposal>;
  threshold: number;
}

export function createOpConsensusState(threshold = 3): OpConsensusStateType {
  return { proposals: new Map(), threshold };
}

export function proposeOp(state: OpConsensusStateType, propId: string, opId: string, proposedBy: string): OpConsensusStateType {
  if (state.proposals.has(propId)) return state;
  const proposals = new Map(state.proposals);
  proposals.set(propId, { propId, opId, proposedBy, state: 'proposed', votes: new Map() });
  return { ...state, proposals };
}

export function openOpVoting(state: OpConsensusStateType, propId: string): OpConsensusStateType {
  const p = state.proposals.get(propId);
  if (!p) return state;
  const proposals = new Map(state.proposals);
  proposals.set(propId, { ...p, state: 'voting' });
  return { ...state, proposals };
}

export function voteOp(state: OpConsensusStateType, propId: string, voter: string, approve: boolean): OpConsensusStateType {
  const p = state.proposals.get(propId);
  if (!p || p.state !== 'voting') return state;
  const votes = new Map(p.votes);
  votes.set(voter, approve);
  const proposals = new Map(state.proposals);
  proposals.set(propId, { ...p, votes });
  return { ...state, proposals };
}

export function tallyOpConsensus(state: OpConsensusStateType, propId: string): OpConsensusStateType {
  const p = state.proposals.get(propId);
  if (!p) return state;
  const yes = Array.from(p.votes.values()).filter((v) => v).length;
  const no = Array.from(p.votes.values()).filter((v) => !v).length;
  const total = p.votes.size;
  const newState: OpConsensusState = total >= state.threshold && yes > no ? 'committed' : total >= state.threshold ? 'rejected' : p.state;
  const proposals = new Map(state.proposals);
  proposals.set(propId, { ...p, state: newState });
  return { ...state, proposals };
}

export function opConsensusHealth(state: OpConsensusStateType): { proposals: number; committed: number; health: number } {
  let committed = 0;
  for (const p of state.proposals.values()) if (p.state === 'committed') committed++;
  return { proposals: state.proposals.size, committed, health: state.proposals.size > 0 ? 1 : 0.5 };
}
