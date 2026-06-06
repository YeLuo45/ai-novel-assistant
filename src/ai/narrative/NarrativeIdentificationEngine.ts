/**
 * V1116 NarrativeIdentificationEngine — Direction E Iter 6/20 (Round 5)
 * Identification engine: reader identification with character
 * Sources: ruflo identification + thunderbolt + nanobot
 */

export type IdentificationMode = 'wishful' | 'empathic' | 'self_reflective' | 'mimetic' | 'ironic' | 'symbiotic';
export type IdentificationDepth = 'superficial' | 'shallow' | 'medium' | 'deep' | 'complete';
export type IdentificationStability = 'fragile' | 'fluctuating' | 'stable' | 'strong' | 'unbreakable';

export interface Identification {
  identificationId: string;
  mode: IdentificationMode;
  depth: IdentificationDepth;
  stability: IdentificationStability;
  description: string;
  alignment: number;
  empathy: number;
  chapter: number;
}

export interface IdentificationArc {
  arcId: string,
  identificationIds: string[],
  cumulativeAlignment: number,
  stability: number,
}

export interface NarrativeIdentificationEngineState {
  identifications: Map<string, Identification>;
  arcs: Map<string, IdentificationArc>;
  totalIdentifications: number;
  totalArcs: number;
  averageAlignment: number;
  averageEmpathy: number;
  arcStability: number;
  identificationMastery: number;
}

// Factory
export function createNarrativeIdentificationEngineState(): NarrativeIdentificationEngineState {
  return {
    identifications: new Map(),
    arcs: new Map(),
    totalIdentifications: 0,
    totalArcs: 0,
    averageAlignment: 0.5,
    averageEmpathy: 0.5,
    arcStability: 0.5,
    identificationMastery: 0.5,
  };
}

// Add identification
export function addIdentification(
  state: NarrativeIdentificationEngineState,
  identificationId: string,
  mode: IdentificationMode,
  depth: IdentificationDepth,
  stability: IdentificationStability,
  description: string,
  alignment: number,
  empathy: number,
  chapter: number
): NarrativeIdentificationEngineState {
  const identification: Identification = { identificationId, mode, depth, stability, description, alignment, empathy, chapter };
  const identifications = new Map(state.identifications).set(identificationId, identification);
  return recomputeIdentification({ ...state, identifications, totalIdentifications: identifications.size });
}

// Add arc
export function addIdentificationArc(
  state: NarrativeIdentificationEngineState,
  arcId: string,
  identificationIds: string[]
): NarrativeIdentificationEngineState {
  const identifications = identificationIds.map(id => state.identifications.get(id)).filter((i): i is Identification => i !== undefined);
  const cumulativeAlignment = identifications.length === 0 ? 0
    : identifications.reduce((s, i) => s + i.alignment, 0) / identifications.length;
  const stability = identifications.length === 0 ? 0.5
    : identifications.reduce((s, i) => s + (i.stability === 'unbreakable' ? 1 : i.stability === 'strong' ? 0.85 : i.stability === 'stable' ? 0.7 : i.stability === 'fluctuating' ? 0.4 : 0.2), 0) / identifications.length;
  const arc: IdentificationArc = { arcId, identificationIds, cumulativeAlignment, stability };
  const arcs = new Map(state.arcs).set(arcId, arc);
  return recomputeIdentification({ ...state, arcs, totalArcs: arcs.size });
}

// Get identifications by mode
export function getIdentificationsByMode(state: NarrativeIdentificationEngineState, mode: IdentificationMode): Identification[] {
  return Array.from(state.identifications.values()).filter(i => i.mode === mode);
}

// Get identification report
export function getIdentificationReport(state: NarrativeIdentificationEngineState): {
  totalIdentifications: number;
  totalArcs: number;
  averageAlignment: number;
  averageEmpathy: number;
  identificationMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalIdentifications === 0) recommendations.push('No identifications — add identifications');
  if (state.averageAlignment < 0.5) recommendations.push('Low alignment — strengthen');
  if (state.identificationMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalIdentifications: state.totalIdentifications,
    totalArcs: state.totalArcs,
    averageAlignment: Math.round(state.averageAlignment * 100) / 100,
    averageEmpathy: Math.round(state.averageEmpathy * 100) / 100,
    identificationMastery: Math.round(state.identificationMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeIdentification(state: NarrativeIdentificationEngineState): NarrativeIdentificationEngineState {
  const identifications = Array.from(state.identifications.values());
  const averageAlignment = identifications.length === 0 ? 0.5
    : identifications.reduce((s, i) => s + i.alignment, 0) / identifications.length;
  const averageEmpathy = identifications.length === 0 ? 0.5
    : identifications.reduce((s, i) => s + i.empathy, 0) / identifications.length;

  const arcs = Array.from(state.arcs.values());
  const arcStability = arcs.length === 0 ? 0.5
    : arcs.reduce((s, a) => s + a.stability, 0) / arcs.length;

  const identificationMastery = (averageAlignment * 0.4 + averageEmpathy * 0.3 + arcStability * 0.3);

  return { ...state, averageAlignment, averageEmpathy, arcStability, identificationMastery };
}

// Reset
export function resetNarrativeIdentificationEngineState(): NarrativeIdentificationEngineState {
  return createNarrativeIdentificationEngineState();
}