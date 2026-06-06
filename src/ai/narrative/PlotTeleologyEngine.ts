/**
 * V1038 PlotTeleologyEngine — Direction C Iter 7/20 (Round 5)
 * Plot teleology engine: purpose + goals of plot
 * Sources: ruflo teleology + thunderbolt + nanobot
 */

export type TeleologicalCause = 'final' | 'efficient' | 'formal' | 'material' | 'transcendent';
export type TeleologicalPurpose = 'growth' | 'transformation' | 'restoration' | 'revelation' | 'justice' | 'love';
export type TeleologicalScope = 'micro' | 'meso' | 'macro' | 'meta';

export interface PlotTeleology {
  teleologyId: string;
  cause: TeleologicalCause;
  purpose: TeleologicalPurpose;
  scope: TeleologicalScope;
  description: string;
  purposiveness: number;
  meaningfulness: number;
  chapter: number;
}

export interface TeleologicalArc {
  arcId: string,
  teleologyIds: string[],
  meaningfulness: number,
  coherence: number,
}

export interface PlotTeleologyEngineState {
  teleologies: Map<string, PlotTeleology>;
  arcs: Map<string, TeleologicalArc>;
  totalTeleologies: number;
  totalArcs: number;
  averagePurposiveness: number;
  averageMeaningfulness: number;
  arcCoherence: number;
  teleologyMastery: number;
}

// Factory
export function createPlotTeleologyEngineState(): PlotTeleologyEngineState {
  return {
    teleologies: new Map(),
    arcs: new Map(),
    totalTeleologies: 0,
    totalArcs: 0,
    averagePurposiveness: 0.5,
    averageMeaningfulness: 0.5,
    arcCoherence: 0.5,
    teleologyMastery: 0.5,
  };
}

// Add teleology
export function addPlotTeleology(
  state: PlotTeleologyEngineState,
  teleologyId: string,
  cause: TeleologicalCause,
  purpose: TeleologicalPurpose,
  scope: TeleologicalScope,
  description: string,
  purposiveness: number,
  meaningfulness: number,
  chapter: number
): PlotTeleologyEngineState {
  const teleology: PlotTeleology = { teleologyId, cause, purpose, scope, description, purposiveness, meaningfulness, chapter };
  const teleologies = new Map(state.teleologies).set(teleologyId, teleology);
  return recomputeTeleology({ ...state, teleologies, totalTeleologies: teleologies.size });
}

// Add arc
export function addTeleologicalArc(
  state: PlotTeleologyEngineState,
  arcId: string,
  teleologyIds: string[]
): PlotTeleologyEngineState {
  const teleologies = teleologyIds.map(id => state.teleologies.get(id)).filter((t): t is PlotTeleology => t !== undefined);
  const meaningfulness = teleologies.length === 0 ? 0
    : teleologies.reduce((s, t) => s + t.meaningfulness, 0) / teleologies.length;
  const coherence = teleologies.length < 2 ? 0.5
    : 1 - Math.abs(teleologies[0].purposiveness - teleologies[teleologies.length - 1].purposiveness);
  const arc: TeleologicalArc = { arcId, teleologyIds, meaningfulness, coherence };
  const arcs = new Map(state.arcs).set(arcId, arc);
  return recomputeTeleology({ ...state, arcs, totalArcs: arcs.size });
}

// Get teleologies by cause
export function getTeleologiesByCause(state: PlotTeleologyEngineState, cause: TeleologicalCause): PlotTeleology[] {
  return Array.from(state.teleologies.values()).filter(t => t.cause === cause);
}

// Get teleology report
export function getTeleologyReport(state: PlotTeleologyEngineState): {
  totalTeleologies: number;
  totalArcs: number;
  averagePurposiveness: number;
  averageMeaningfulness: number;
  teleologyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalTeleologies === 0) recommendations.push('No teleologies — add plot teleologies');
  if (state.averageMeaningfulness < 0.5) recommendations.push('Low meaningfulness — strengthen');
  if (state.teleologyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalTeleologies: state.totalTeleologies,
    totalArcs: state.totalArcs,
    averagePurposiveness: Math.round(state.averagePurposiveness * 100) / 100,
    averageMeaningfulness: Math.round(state.averageMeaningfulness * 100) / 100,
    teleologyMastery: Math.round(state.teleologyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTeleology(state: PlotTeleologyEngineState): PlotTeleologyEngineState {
  const teleologies = Array.from(state.teleologies.values());
  const averagePurposiveness = teleologies.length === 0 ? 0.5
    : teleologies.reduce((s, t) => s + t.purposiveness, 0) / teleologies.length;
  const averageMeaningfulness = teleologies.length === 0 ? 0.5
    : teleologies.reduce((s, t) => s + t.meaningfulness, 0) / teleologies.length;

  const arcs = Array.from(state.arcs.values());
  const arcCoherence = arcs.length === 0 ? 0.5
    : arcs.reduce((s, a) => s + a.coherence, 0) / arcs.length;

  const teleologyMastery = (averagePurposiveness * 0.4 + averageMeaningfulness * 0.4 + arcCoherence * 0.2);

  return { ...state, averagePurposiveness, averageMeaningfulness, arcCoherence, teleologyMastery };
}

// Reset
export function resetPlotTeleologyEngineState(): PlotTeleologyEngineState {
  return createPlotTeleologyEngineState();
}