/**
 * V1020 NarrativeTransitionEngine — Direction B Iter 13/15 (Round 5)
 * Transition engine: narrative transitions + flow
 * Sources: thunderbolt transition + ruflo + nanobot
 */

export type TransitionType = 'cut' | 'dissolve' | 'match' | 'bridge' | 'intercut' | 'pan';
export type TransitionSmoothness = 'abrupt' | 'rough' | 'smooth' | 'elegant' | 'seamless';
export type TransitionPurpose = 'time' | 'place' | 'pov' | 'mood' | 'theme' | 'pacing';

export interface Transition {
  transitionId: string;
  type: TransitionType;
  smoothness: TransitionSmoothness;
  purpose: TransitionPurpose;
  description: string;
  flow: number;
  grace: number;
  chapter: number;
}

export interface TransitionSequence {
  sequenceId: string,
  transitionIds: string[],
  cumulativeSmoothness: number,
  effect: number,
}

export interface NarrativeTransitionEngineState {
  transitions: Map<string, Transition>;
  sequences: Map<string, TransitionSequence>;
  totalTransitions: number;
  totalSequences: number;
  averageFlow: number;
  averageGrace: number;
  sequenceSmoothness: number;
  transitionMastery: number;
}

// Factory
export function createNarrativeTransitionEngineState(): NarrativeTransitionEngineState {
  return {
    transitions: new Map(),
    sequences: new Map(),
    totalTransitions: 0,
    totalSequences: 0,
    averageFlow: 0.5,
    averageGrace: 0.5,
    sequenceSmoothness: 0.5,
    transitionMastery: 0.5,
  };
}

// Add transition
export function addTransition(
  state: NarrativeTransitionEngineState,
  transitionId: string,
  type: TransitionType,
  smoothness: TransitionSmoothness,
  purpose: TransitionPurpose,
  description: string,
  flow: number,
  grace: number,
  chapter: number
): NarrativeTransitionEngineState {
  const transition: Transition = { transitionId, type, smoothness, purpose, description, flow, grace, chapter };
  const transitions = new Map(state.transitions).set(transitionId, transition);
  return recomputeTransition({ ...state, transitions, totalTransitions: transitions.size });
}

// Create sequence
export function createTransitionSequence(
  state: NarrativeTransitionEngineState,
  sequenceId: string,
  transitionIds: string[]
): NarrativeTransitionEngineState {
  const transitions = transitionIds.map(id => state.transitions.get(id)).filter((t): t is Transition => t !== undefined);
  const cumulativeSmoothness = transitions.length === 0 ? 0.5
    : transitions.reduce((s, t) => s + t.flow, 0) / transitions.length;
  const effect = transitions.length === 0 ? 0.5
    : transitions.reduce((s, t) => s + t.grace, 0) / transitions.length;
  const sequence: TransitionSequence = { sequenceId, transitionIds, cumulativeSmoothness, effect };
  const sequences = new Map(state.sequences).set(sequenceId, sequence);
  return recomputeTransition({ ...state, sequences, totalSequences: sequences.size });
}

// Get transitions by type
export function getTransitionsByType(state: NarrativeTransitionEngineState, type: TransitionType): Transition[] {
  return Array.from(state.transitions.values()).filter(t => t.type === type);
}

// Get transition report
export function getTransitionReport(state: NarrativeTransitionEngineState): {
  totalTransitions: number;
  totalSequences: number;
  averageFlow: number;
  sequenceSmoothness: number;
  transitionMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalTransitions === 0) recommendations.push('No transitions — add transitions');
  if (state.averageFlow < 0.5) recommendations.push('Low flow — improve');
  if (state.transitionMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalTransitions: state.totalTransitions,
    totalSequences: state.totalSequences,
    averageFlow: Math.round(state.averageFlow * 100) / 100,
    sequenceSmoothness: Math.round(state.sequenceSmoothness * 100) / 100,
    transitionMastery: Math.round(state.transitionMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTransition(state: NarrativeTransitionEngineState): NarrativeTransitionEngineState {
  const transitions = Array.from(state.transitions.values());
  const averageFlow = transitions.length === 0 ? 0.5
    : transitions.reduce((s, t) => s + t.flow, 0) / transitions.length;
  const averageGrace = transitions.length === 0 ? 0.5
    : transitions.reduce((s, t) => s + t.grace, 0) / transitions.length;

  const sequences = Array.from(state.sequences.values());
  const sequenceSmoothness = sequences.length === 0 ? 0.5
    : sequences.reduce((s, sq) => s + sq.cumulativeSmoothness, 0) / sequences.length;

  const transitionMastery = (averageFlow * 0.4 + averageGrace * 0.3 + sequenceSmoothness * 0.3);

  return { ...state, averageFlow, averageGrace, sequenceSmoothness, transitionMastery };
}

// Reset
export function resetNarrativeTransitionEngineState(): NarrativeTransitionEngineState {
  return createNarrativeTransitionEngineState();
}