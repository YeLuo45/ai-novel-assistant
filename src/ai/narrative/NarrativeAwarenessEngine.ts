/**
 * V812 NarrativeAwarenessEngine — Direction E Iter 2/9 (Round 3)
 * Narrative awareness engine: situation awareness + self-awareness
 * Sources: nanobot awareness + chatdev + thunderbolt
 */

export type AwarenessLayer = 'stimulus' | 'perception' | 'comprehension' | 'projection';
export type AwarenessMode = 'passive' | 'active' | 'reflective' | 'anticipatory';
export type AwarenessFocus = 'self' | 'narrative' | 'reader' | 'world' | 'meta';

export interface AwarenessState {
  stateId: string;
  layer: AwarenessLayer;
  mode: AwarenessMode;
  focus: AwarenessFocus;
  clarity: number;
  breadth: number;
  depth: number;
  timestamp: number;
}

export interface AwarenessCheck {
  checkId: string;
  focus: AwarenessFocus;
  question: string;
  answer: string;
  accuracy: number;
  confidence: number;
  timestamp: number;
}

export interface NarrativeAwarenessEngineState {
  states: Map<string, AwarenessState>;
  checks: Map<string, AwarenessCheck>;
  totalStates: number;
  totalChecks: number;
  averageClarity: number;
  averageBreadth: number;
  averageDepth: number;
  overallAwareness: number;
  awarenessMomentum: number;
}

// Factory
export function createNarrativeAwarenessEngineState(): NarrativeAwarenessEngineState {
  return {
    states: new Map(),
    checks: new Map(),
    totalStates: 0,
    totalChecks: 0,
    averageClarity: 0.5,
    averageBreadth: 0.5,
    averageDepth: 0.5,
    overallAwareness: 0.5,
    awarenessMomentum: 0.5,
  };
}

// Record awareness
export function recordAwareness(
  state: NarrativeAwarenessEngineState,
  stateId: string,
  layer: AwarenessLayer,
  mode: AwarenessMode,
  focus: AwarenessFocus,
  clarity: number = 0.5,
  breadth: number = 0.5,
  depth: number = 0.5
): NarrativeAwarenessEngineState {
  const awarenessState: AwarenessState = {
    stateId, layer, mode, focus,
    clarity: Math.min(1, Math.max(0, clarity)),
    breadth: Math.min(1, Math.max(0, breadth)),
    depth: Math.min(1, Math.max(0, depth)),
    timestamp: Date.now(),
  };
  const states = new Map(state.states).set(stateId, awarenessState);
  return recomputeAwareness({ ...state, states, totalStates: states.size });
}

// Perform awareness check
export function performAwarenessCheck(
  state: NarrativeAwarenessEngineState,
  checkId: string,
  focus: AwarenessFocus,
  question: string,
  answer: string,
  accuracy: number = 0.5,
  confidence: number = 0.5
): NarrativeAwarenessEngineState {
  const check: AwarenessCheck = {
    checkId, focus, question, answer,
    accuracy: Math.min(1, Math.max(0, accuracy)),
    confidence: Math.min(1, Math.max(0, confidence)),
    timestamp: Date.now(),
  };
  const checks = new Map(state.checks).set(checkId, check);
  return recomputeAwareness({ ...state, checks, totalChecks: checks.size });
}

// Get states by focus
export function getStatesByFocus(state: NarrativeAwarenessEngineState, focus: AwarenessFocus): AwarenessState[] {
  return Array.from(state.states.values()).filter(s => s.focus === focus);
}

// Get checks by focus
export function getChecksByFocus(state: NarrativeAwarenessEngineState, focus: AwarenessFocus): AwarenessCheck[] {
  return Array.from(state.checks.values()).filter(c => c.focus === focus);
}

// Get awareness report
export function getAwarenessReport(state: NarrativeAwarenessEngineState): {
  totalStates: number;
  totalChecks: number;
  averageClarity: number;
  averageBreadth: number;
  averageDepth: number;
  overallAwareness: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalStates === 0) recommendations.push('No states — record awareness');
  if (state.averageClarity < 0.4) recommendations.push('Low clarity — focus more');
  if (state.overallAwareness < 0.5) recommendations.push('Low awareness — strengthen');

  return {
    totalStates: state.totalStates,
    totalChecks: state.totalChecks,
    averageClarity: Math.round(state.averageClarity * 100) / 100,
    averageBreadth: Math.round(state.averageBreadth * 100) / 100,
    averageDepth: Math.round(state.averageDepth * 100) / 100,
    overallAwareness: Math.round(state.overallAwareness * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAwareness(state: NarrativeAwarenessEngineState): NarrativeAwarenessEngineState {
  const states = Array.from(state.states.values());
  const averageClarity = states.length === 0 ? 0.5
    : states.reduce((s, a) => s + a.clarity, 0) / states.length;
  const averageBreadth = states.length === 0 ? 0.5
    : states.reduce((s, a) => s + a.breadth, 0) / states.length;
  const averageDepth = states.length === 0 ? 0.5
    : states.reduce((s, a) => s + a.depth, 0) / states.length;

  const checks = Array.from(state.checks.values());
  const awarenessMomentum = checks.length === 0 ? 0.5
    : checks.reduce((s, c) => s + (c.accuracy + c.confidence) / 2, 0) / checks.length;

  const overallAwareness = (averageClarity * 0.4 + averageBreadth * 0.3 + averageDepth * 0.3);

  return { ...state, averageClarity, averageBreadth, averageDepth, awarenessMomentum, overallAwareness };
}

// Reset awareness state
export function resetNarrativeAwarenessEngineState(): NarrativeAwarenessEngineState {
  return createNarrativeAwarenessEngineState();
}