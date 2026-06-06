/**
 * V1118 NarrativeSuspensionEngine — Direction E Iter 7/20 (Round 5)
 * Suspension engine: suspension of disbelief
 * Sources: ruflo suspension + thunderbolt + nanobot
 */

export type SuspensionType = 'plausibility' | 'world' | 'character' | 'magic' | 'timing' | 'logic';
export type SuspensionStrength = 'fragile' | 'moderate' | 'robust' | 'complete' | 'absolute';
export type SuspensionBreaker = 'plot_hole' | 'out_of_character' | 'impossible_event' | 'info_dump' | 'coincidence';

export interface Suspension {
  suspensionId: string;
  type: SuspensionType;
  strength: SuspensionStrength;
  breaker: SuspensionBreaker;
  description: string;
  belief: number;
  immersion: number;
  chapter: number;
}

export interface SuspensionField {
  fieldId: string,
  suspensionIds: string[],
  cumulativeBelief: number,
  resilience: number,
}

export interface NarrativeSuspensionEngineState {
  suspensions: Map<string, Suspension>;
  fields: Map<string, SuspensionField>;
  totalSuspensions: number;
  totalFields: number;
  averageBelief: number;
  averageImmersion: number;
  fieldResilience: number;
  suspensionMastery: number;
}

// Factory
export function createNarrativeSuspensionEngineState(): NarrativeSuspensionEngineState {
  return {
    suspensions: new Map(),
    fields: new Map(),
    totalSuspensions: 0,
    totalFields: 0,
    averageBelief: 0.5,
    averageImmersion: 0.5,
    fieldResilience: 0.5,
    suspensionMastery: 0.5,
  };
}

// Add suspension
export function addSuspension(
  state: NarrativeSuspensionEngineState,
  suspensionId: string,
  type: SuspensionType,
  strength: SuspensionStrength,
  breaker: SuspensionBreaker,
  description: string,
  belief: number,
  immersion: number,
  chapter: number
): NarrativeSuspensionEngineState {
  const suspension: Suspension = { suspensionId, type, strength, breaker, description, belief, immersion, chapter };
  const suspensions = new Map(state.suspensions).set(suspensionId, suspension);
  return recomputeSuspension({ ...state, suspensions, totalSuspensions: suspensions.size });
}

// Add field
export function addSuspensionField(
  state: NarrativeSuspensionEngineState,
  fieldId: string,
  suspensionIds: string[]
): NarrativeSuspensionEngineState {
  const suspensions = suspensionIds.map(id => state.suspensions.get(id)).filter((s): s is Suspension => s !== undefined);
  const cumulativeBelief = suspensions.length === 0 ? 0
    : suspensions.reduce((s, su) => s + su.belief, 0) / suspensions.length;
  const resilience = suspensions.length === 0 ? 0.5
    : suspensions.reduce((s, su) => s + (su.strength === 'absolute' ? 1 : su.strength === 'complete' ? 0.85 : su.strength === 'robust' ? 0.7 : su.strength === 'moderate' ? 0.5 : 0.3), 0) / suspensions.length;
  const field: SuspensionField = { fieldId, suspensionIds, cumulativeBelief, resilience };
  const fields = new Map(state.fields).set(fieldId, field);
  return recomputeSuspension({ ...state, fields, totalFields: fields.size });
}

// Get suspensions by type
export function getSuspensionsByType(state: NarrativeSuspensionEngineState, type: SuspensionType): Suspension[] {
  return Array.from(state.suspensions.values()).filter(s => s.type === type);
}

// Get suspension report
export function getSuspensionReport(state: NarrativeSuspensionEngineState): {
  totalSuspensions: number;
  totalFields: number;
  averageBelief: number;
  averageImmersion: number;
  suspensionMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSuspensions === 0) recommendations.push('No suspensions — add suspensions');
  if (state.averageBelief < 0.5) recommendations.push('Low belief — strengthen');
  if (state.suspensionMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalSuspensions: state.totalSuspensions,
    totalFields: state.totalFields,
    averageBelief: Math.round(state.averageBelief * 100) / 100,
    averageImmersion: Math.round(state.averageImmersion * 100) / 100,
    suspensionMastery: Math.round(state.suspensionMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSuspension(state: NarrativeSuspensionEngineState): NarrativeSuspensionEngineState {
  const suspensions = Array.from(state.suspensions.values());
  const averageBelief = suspensions.length === 0 ? 0.5
    : suspensions.reduce((s, su) => s + su.belief, 0) / suspensions.length;
  const averageImmersion = suspensions.length === 0 ? 0.5
    : suspensions.reduce((s, su) => s + su.immersion, 0) / suspensions.length;

  const fields = Array.from(state.fields.values());
  const fieldResilience = fields.length === 0 ? 0.5
    : fields.reduce((s, f) => s + f.resilience, 0) / fields.length;

  const suspensionMastery = (averageBelief * 0.4 + averageImmersion * 0.3 + fieldResilience * 0.3);

  return { ...state, averageBelief, averageImmersion, fieldResilience, suspensionMastery };
}

// Reset
export function resetNarrativeSuspensionEngineState(): NarrativeSuspensionEngineState {
  return createNarrativeSuspensionEngineState();
}