/**
 * V900 NarrativeAxiologyEngine — Direction C Iter 13/15 (Round 4)
 * Narrative axiology engine: values + ethics + moral framework
 * Sources: nanobot axiology + chatdev + ruflo
 */

export type ValueType = 'moral' | 'aesthetic' | 'epistemic' | 'social' | 'personal' | 'spiritual';
export type ValuePolarity = 'positive' | 'negative' | 'ambivalent' | 'contextual';
export type MoralClarity = 'absolute' | 'clear' | 'ambiguous' | 'relativistic' | 'nihilistic';

export interface ValueNode {
  valueId: string;
  name: string;
  type: ValueType;
  polarity: ValuePolarity;
  description: string;
  weight: number;
  chapter: number;
}

export interface ValueConflict {
  conflictId: string;
  value1Id: string;
  value2Id: string;
  intensity: number;
  resolution: string;
  resolved: boolean;
  chapter: number;
}

export interface NarrativeAxiologyEngineState {
  values: Map<string, ValueNode>;
  conflicts: Map<string, ValueConflict>;
  totalValues: number;
  totalConflicts: number;
  positiveValues: number;
  negativeValues: number;
  averageWeight: number;
  moralClarity: MoralClarity;
  ethicalRichness: number;
  valueCoherence: number;
}

// Factory
export function createNarrativeAxiologyEngineState(): NarrativeAxiologyEngineState {
  return {
    values: new Map(),
    conflicts: new Map(),
    totalValues: 0,
    totalConflicts: 0,
    positiveValues: 0,
    negativeValues: 0,
    averageWeight: 0.5,
    moralClarity: 'ambiguous',
    ethicalRichness: 0.5,
    valueCoherence: 0.5,
  };
}

// Add value
export function addValue(
  state: NarrativeAxiologyEngineState,
  valueId: string,
  name: string,
  type: ValueType,
  polarity: ValuePolarity,
  description: string,
  weight: number,
  chapter: number
): NarrativeAxiologyEngineState {
  const value: ValueNode = { valueId, name, type, polarity, description, weight, chapter };
  const values = new Map(state.values).set(valueId, value);
  const positiveValues = polarity === 'positive' ? state.positiveValues + 1 : state.positiveValues;
  const negativeValues = polarity === 'negative' ? state.negativeValues + 1 : state.negativeValues;
  return recomputeAxiology({ ...state, values, positiveValues, negativeValues, totalValues: values.size });
}

// Add value conflict
export function addValueConflict(
  state: NarrativeAxiologyEngineState,
  conflictId: string,
  value1Id: string,
  value2Id: string,
  intensity: number,
  chapter: number,
  resolution: string = ''
): NarrativeAxiologyEngineState {
  const conflict: ValueConflict = { conflictId, value1Id, value2Id, intensity, resolution, resolved: false, chapter };
  const conflicts = new Map(state.conflicts).set(conflictId, conflict);
  return recomputeAxiology({ ...state, conflicts, totalConflicts: conflicts.size });
}

// Resolve value conflict
export function resolveValueConflict(state: NarrativeAxiologyEngineState, conflictId: string, resolution: string): NarrativeAxiologyEngineState {
  const conflict = state.conflicts.get(conflictId);
  if (!conflict) return state;

  const updated: ValueConflict = { ...conflict, resolution, resolved: true };
  const conflicts = new Map(state.conflicts).set(conflictId, updated);
  return recomputeAxiology({ ...state, conflicts });
}

// Get values by type
export function getValuesByType(state: NarrativeAxiologyEngineState, type: ValueType): ValueNode[] {
  return Array.from(state.values.values()).filter(v => v.type === type);
}

// Get axiology report
export function getAxiologyReport(state: NarrativeAxiologyEngineState): {
  totalValues: number;
  totalConflicts: number;
  averageWeight: number;
  moralClarity: MoralClarity;
  ethicalRichness: number;
  valueCoherence: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalValues === 0) recommendations.push('No values — add values');
  if (state.ethicalRichness < 0.5) recommendations.push('Low richness — add values');
  if (state.valueCoherence < 0.4) recommendations.push('Low coherence — connect values');

  return {
    totalValues: state.totalValues,
    totalConflicts: state.totalConflicts,
    averageWeight: Math.round(state.averageWeight * 100) / 100,
    moralClarity: state.moralClarity,
    ethicalRichness: Math.round(state.ethicalRichness * 100) / 100,
    valueCoherence: Math.round(state.valueCoherence * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAxiology(state: NarrativeAxiologyEngineState): NarrativeAxiologyEngineState {
  const values = Array.from(state.values.values());
  const averageWeight = values.length === 0 ? 0.5
    : values.reduce((s, v) => s + v.weight, 0) / values.length;

  // Moral clarity: how many values are clear (positive or negative)
  const clearCount = values.filter(v => v.polarity === 'positive' || v.polarity === 'negative').length;
  const clarityRatio = values.length === 0 ? 0.5 : clearCount / values.length;
  const moralClarity: MoralClarity = clarityRatio > 0.9 ? 'absolute'
    : clarityRatio > 0.7 ? 'clear'
    : clarityRatio > 0.5 ? 'ambiguous'
    : clarityRatio > 0.3 ? 'relativistic'
    : 'nihilistic';

  const typeSet = new Set(values.map(v => v.type));
  const ethicalRichness = Math.min(1, typeSet.size / 5);

  // Coherence: how balanced positive vs negative
  const balance = values.length === 0 ? 1
    : 1 - Math.abs(state.positiveValues - state.negativeValues) / Math.max(1, values.length);
  const valueCoherence = balance;

  return { ...state, averageWeight, moralClarity, ethicalRichness, valueCoherence };
}

// Reset axiology state
export function resetNarrativeAxiologyEngineState(): NarrativeAxiologyEngineState {
  return createNarrativeAxiologyEngineState();
}