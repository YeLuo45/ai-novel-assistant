// V2318 SkillConsensus - Direction K Iter 23/30
// Distributed skill consensus
// Source: chatdev
export type SkillConsensusPhase = 'proposed' | 'voting' | 'committed' | 'rejected';

export interface SkillProposal {
  propId: string;
  key: string;
  proposedBy: string;
  phase: SkillConsensusPhase;
  votes: Map<string, boolean>;
}

export interface SkillConsensusStateType {
  proposals: Map<string, SkillProposal>;
  threshold: number;
}

export function createSkillConsensusState(threshold = 3): SkillConsensusStateType {
  return { proposals: new Map(), threshold };
}

export function proposeSkill(state: SkillConsensusStateType, propId: string, key: string, proposedBy: string): SkillConsensusStateType {
  if (state.proposals.has(propId)) return state;
  const proposals = new Map(state.proposals);
  proposals.set(propId, { propId, key, proposedBy, phase: 'proposed', votes: new Map() });
  return { ...state, proposals };
}

export function openSkillVoting(state: SkillConsensusStateType, propId: string): SkillConsensusStateType {
  const p = state.proposals.get(propId);
  if (!p) return state;
  const proposals = new Map(state.proposals);
  proposals.set(propId, { ...p, phase: 'voting' });
  return { ...state, proposals };
}

export function voteSkill(state: SkillConsensusStateType, propId: string, voter: string, approve: boolean): SkillConsensusStateType {
  const p = state.proposals.get(propId);
  if (!p || p.phase !== 'voting') return state;
  const votes = new Map(p.votes);
  votes.set(voter, approve);
  const proposals = new Map(state.proposals);
  proposals.set(propId, { ...p, votes });
  return { ...state, proposals };
}

export function tallySkillConsensus(state: SkillConsensusStateType, propId: string): SkillConsensusStateType {
  const p = state.proposals.get(propId);
  if (!p) return state;
  const yes = Array.from(p.votes.values()).filter((v) => v).length;
  const no = Array.from(p.votes.values()).filter((v) => !v).length;
  const total = p.votes.size;
  const newPhase: SkillConsensusPhase = total >= state.threshold && yes > no ? 'committed' : total >= state.threshold ? 'rejected' : p.phase;
  const proposals = new Map(state.proposals);
  proposals.set(propId, { ...p, phase: newPhase });
  return { ...state, proposals };
}

export function skillConsensusHealth(state: SkillConsensusStateType): { proposals: number; committed: number; health: number } {
  let committed = 0;
  for (const p of state.proposals.values()) if (p.phase === 'committed') committed++;
  return { proposals: state.proposals.size, committed, health: state.proposals.size > 0 ? 1 : 0.5 };
}
