// V2198 GraphConsensus - Direction G Iter 23/30
// Distributed consensus on graph updates
// Source: chatdev
export type GraphConsensusState = 'proposed' | 'voting' | 'committed' | 'rejected';

export interface GraphProposal {
  propId: string;
  graphId: string;
  proposedBy: string;
  state: GraphConsensusState;
  votes: Map<string, boolean>;
  createdAt: number;
}

export interface GraphConsensusStateType {
  proposals: Map<string, GraphProposal>;
  threshold: number;
}

export function createGraphConsensusState(threshold = 3): GraphConsensusStateType {
  return { proposals: new Map(), threshold };
}

export function proposeGraph(state: GraphConsensusStateType, propId: string, graphId: string, proposedBy: string): GraphConsensusStateType {
  if (state.proposals.has(propId)) return state;
  const proposals = new Map(state.proposals);
  proposals.set(propId, { propId, graphId, proposedBy, state: 'proposed', votes: new Map(), createdAt: Date.now() });
  return { ...state, proposals };
}

export function openGraphVoting(state: GraphConsensusStateType, propId: string): GraphConsensusStateType {
  const p = state.proposals.get(propId);
  if (!p) return state;
  const proposals = new Map(state.proposals);
  proposals.set(propId, { ...p, state: 'voting' });
  return { ...state, proposals };
}

export function voteGraph(state: GraphConsensusStateType, propId: string, voter: string, approve: boolean): GraphConsensusStateType {
  const p = state.proposals.get(propId);
  if (!p || p.state !== 'voting') return state;
  const votes = new Map(p.votes);
  votes.set(voter, approve);
  const proposals = new Map(state.proposals);
  proposals.set(propId, { ...p, votes });
  return { ...state, proposals };
}

export function tallyGraphConsensus(state: GraphConsensusStateType, propId: string): GraphConsensusStateType {
  const p = state.proposals.get(propId);
  if (!p) return state;
  const yes = Array.from(p.votes.values()).filter((v) => v).length;
  const no = Array.from(p.votes.values()).filter((v) => !v).length;
  const total = p.votes.size;
  const newState: GraphConsensusState = total >= state.threshold && yes > no ? 'committed' : total >= state.threshold ? 'rejected' : p.state;
  const proposals = new Map(state.proposals);
  proposals.set(propId, { ...p, state: newState });
  return { ...state, proposals };
}

export function graphConsensusHealth(state: GraphConsensusStateType): { proposals: number; committed: number; health: number } {
  let committed = 0;
  for (const p of state.proposals.values()) if (p.state === 'committed') committed++;
  return { proposals: state.proposals.size, committed, health: state.proposals.size > 0 ? 1 : 0.5 };
}
