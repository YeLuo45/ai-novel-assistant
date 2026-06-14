// V2168 MemoryConsensus - Direction F Iter 23/30
// Distributed consensus on memory updates
// Source: chatdev
export type ConsensusState = 'proposed' | 'voting' | 'committed' | 'rejected';

export interface ConsensusProposal {
  propId: string;
  memId: string;
  proposedBy: string;
  state: ConsensusState;
  votes: Map<string, boolean>; // voter → approve
  createdAt: number;
}

export interface MemoryConsensusState {
  proposals: Map<string, ConsensusProposal>;
  threshold: number; // minimum votes required
}

export function createMemoryConsensusState(threshold = 3): MemoryConsensusState {
  return { proposals: new Map(), threshold };
}

export function propose(state: MemoryConsensusState, propId: string, memId: string, proposedBy: string): MemoryConsensusState {
  if (state.proposals.has(propId)) return state;
  const proposals = new Map(state.proposals);
  proposals.set(propId, { propId, memId, proposedBy, state: 'proposed', votes: new Map(), createdAt: Date.now() });
  return { ...state, proposals };
}

export function openVoting(state: MemoryConsensusState, propId: string): MemoryConsensusState {
  const p = state.proposals.get(propId);
  if (!p) return state;
  const proposals = new Map(state.proposals);
  proposals.set(propId, { ...p, state: 'voting' });
  return { ...state, proposals };
}

export function vote(state: MemoryConsensusState, propId: string, voter: string, approve: boolean): MemoryConsensusState {
  const p = state.proposals.get(propId);
  if (!p || p.state !== 'voting') return state;
  const votes = new Map(p.votes);
  votes.set(voter, approve);
  const proposals = new Map(state.proposals);
  proposals.set(propId, { ...p, votes });
  return { ...state, proposals };
}

export function tallyConsensus(state: MemoryConsensusState, propId: string): MemoryConsensusState {
  const p = state.proposals.get(propId);
  if (!p) return state;
  const yes = Array.from(p.votes.values()).filter((v) => v).length;
  const no = Array.from(p.votes.values()).filter((v) => !v).length;
  const total = p.votes.size;
  const state2: ConsensusState = total >= state.threshold && yes > no ? 'committed' : total >= state.threshold ? 'rejected' : p.state;
  const proposals = new Map(state.proposals);
  proposals.set(propId, { ...p, state: state2 });
  return { ...state, proposals };
}

export function getProposal(state: MemoryConsensusState, propId: string): ConsensusProposal | undefined {
  return state.proposals.get(propId);
}

export function memoryConsensusHealth(state: MemoryConsensusState): { proposals: number; committed: number; rejected: number; health: number } {
  let committed = 0, rejected = 0;
  for (const p of state.proposals.values()) {
    if (p.state === 'committed') committed++;
    if (p.state === 'rejected') rejected++;
  }
  return { proposals: state.proposals.size, committed, rejected, health: state.proposals.size > 0 ? 1 : 0.5 };
}
