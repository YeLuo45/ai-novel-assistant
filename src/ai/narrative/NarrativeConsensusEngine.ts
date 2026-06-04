/**
 * V662 NarrativeConsensusEngine — Direction E Iter 8/9
 * Narrative consensus engine: multi-perspective resolution + decision making
 * Sources: chatdev consensus + thunderbolt decision + nanobot resolution
 */

export type ConsensusLevel = 'divergent' | 'negotiating' | 'converging' | 'agreed';
export type DecisionType = 'heuristic' | 'analytical' | 'creative' | 'hybrid';

export interface Perspective {
  perspectiveId: string;
  label: string;
  weight: number;
  position: string;
  confidence: number;
}

export interface ConsensusState {
  perspectives: Map<string, Perspective>;
  consensusLevel: ConsensusLevel;
  decisionType: DecisionType;
  decisionMade: boolean;
  decisionRationale: string;
}

export interface ConsensusResult {
  consensusReached: boolean;
  consensusLevel: ConsensusLevel;
  dominantPerspective: string | null;
  confidence: number;
  rationale: string;
}

// Factory
export function createConsensusState(): ConsensusState {
  return {
    perspectives: new Map(),
    consensusLevel: 'divergent',
    decisionType: 'hybrid',
    decisionMade: false,
    decisionRationale: '',
  };
}

// Add perspective
export function addPerspective(
  state: ConsensusState,
  perspectiveId: string,
  label: string,
  weight: number,
  position: string,
  confidence: number
): ConsensusState {
  const perspective: Perspective = { perspectiveId, label, weight, position, confidence };
  const perspectives = new Map(state.perspectives).set(perspectiveId, perspective);
  return recomputeConsensus({ ...state, perspectives });
}

// Update perspective position
export function updatePerspectivePosition(
  state: ConsensusState,
  perspectiveId: string,
  newPosition: string
): ConsensusState {
  const perspective = state.perspectives.get(perspectiveId);
  if (!perspective) return state;

  const updatedPerspective: Perspective = { ...perspective, position: newPosition };
  const perspectives = new Map(state.perspectives).set(perspectiveId, updatedPerspective);
  return recomputeConsensus({ ...state, perspectives });
}

// Compute consensus level
function computeConsensusLevel(state: ConsensusState): ConsensusLevel {
  if (state.perspectives.size < 2) return 'divergent';

  const perspectives = Array.from(state.perspectives.values());
  const positions = perspectives.map(p => p.position);
  const uniquePositions = new Set(positions).size;

  if (uniquePositions === 1) return 'agreed';
  if (uniquePositions === 2) return 'converging';

  // Check for partial agreement
  const weightSum = perspectives.reduce((s, p) => s + p.weight, 0);
  const dominantWeight = Math.max(...perspectives.map(p => p.weight));
  if (dominantWeight / weightSum > 0.7) return 'negotiating';

  return 'divergent';
}

// Recompute consensus
function recomputeConsensus(state: ConsensusState): ConsensusState {
  const consensusLevel = computeConsensusLevel(state);
  return { ...state, consensusLevel };
}

// Make decision
export function makeDecision(
  state: ConsensusState,
  rationale: string
): { state: ConsensusState; result: ConsensusResult | null } {
  if (state.consensusLevel === 'divergent') {
    return { state, result: null };
  }

  const perspectives = Array.from(state.perspectives.values());
  const dominant = perspectives.reduce((best, p) => p.weight > best.weight ? p : best, perspectives[0]);

  const result: ConsensusResult = {
    consensusReached: state.consensusLevel === 'agreed' || state.consensusLevel === 'converging',
    consensusLevel: state.consensusLevel,
    dominantPerspective: dominant?.perspectiveId ?? null,
    confidence: dominant?.confidence ?? 0.5,
    rationale,
  };

  const updatedState: ConsensusState = {
    ...state,
    decisionMade: true,
    decisionRationale: rationale,
  };

  return { state: updatedState, result };
}

// Set decision type
export function setDecisionType(state: ConsensusState, decisionType: DecisionType): ConsensusState {
  return { ...state, decisionType };
}

// Get consensus report
export function getConsensusReport(state: ConsensusState): {
  perspectiveCount: number;
  consensusLevel: ConsensusLevel;
  decisionType: DecisionType;
  decisionMade: boolean;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.consensusLevel === 'divergent') recommendations.push('Perspectives divergent — encourage negotiation');
  if (state.consensusLevel === 'negotiating') recommendations.push('Negotiating consensus — facilitate convergence');
  if (!state.decisionMade && state.perspectives.size >= 2) recommendations.push('No decision made — reach consensus');

  return {
    perspectiveCount: state.perspectives.size,
    consensusLevel: state.consensusLevel,
    decisionType: state.decisionType,
    decisionMade: state.decisionMade,
    recommendations,
  };
}

// Reset consensus state
export function resetConsensusState(): ConsensusState {
  return createConsensusState();
}