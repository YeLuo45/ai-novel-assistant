/**
 * V876 NarrativeSemanticsEngine — Direction C Iter 1/15 (Round 4)
 * Narrative semantics engine: semantic analysis + meaning extraction
 * Sources: nanobot semantics + thunderbolt + chatdev
 */

export type SemanticRelation = 'synonym' | 'antonym' | 'metaphor' | 'metonym' | 'symbol' | 'reference';
export type SemanticContext = 'literal' | 'figurative' | 'cultural' | 'historical' | 'personal';
export type MeaningDepth = 'surface' | 'shallow' | 'moderate' | 'deep' | 'profound';

export interface SemanticUnit {
  unitId: string;
  text: string;
  context: SemanticContext;
  relations: Map<string, SemanticRelation>;
  depth: MeaningDepth;
  resonance: number;
  interpretations: string[];
}

export interface SemanticField {
  fieldId: string;
  name: string;
  unitIds: string[];
  coherence: number;
  density: number;
  breadth: number;
}

export interface NarrativeSemanticsEngineState {
  units: Map<string, SemanticUnit>;
  fields: Map<string, SemanticField>;
  totalUnits: number;
  totalFields: number;
  averageResonance: number;
  averageDepth: number;
  semanticRichness: number;
  interpretiveBreadth: number;
}

// Factory
export function createNarrativeSemanticsEngineState(): NarrativeSemanticsEngineState {
  return {
    units: new Map(),
    fields: new Map(),
    totalUnits: 0,
    totalFields: 0,
    averageResonance: 0.5,
    averageDepth: 0.5,
    semanticRichness: 0.5,
    interpretiveBreadth: 0,
  };
}

// Add semantic unit
export function addSemanticUnit(
  state: NarrativeSemanticsEngineState,
  unitId: string,
  text: string,
  context: SemanticContext = 'literal',
  depth: MeaningDepth = 'moderate',
  resonance: number = 0.5
): NarrativeSemanticsEngineState {
  const unit: SemanticUnit = {
    unitId, text, context, depth, resonance: Math.min(1, Math.max(0, resonance)),
    relations: new Map(), interpretations: [],
  };
  const units = new Map(state.units).set(unitId, unit);
  return recomputeSemantics({ ...state, units, totalUnits: units.size });
}

// Add relation
export function addSemanticRelation(state: NarrativeSemanticsEngineState, unitId: string, targetId: string, relation: SemanticRelation): NarrativeSemanticsEngineState {
  const unit = state.units.get(unitId);
  if (!unit) return state;

  const relations = new Map(unit.relations).set(targetId, relation);
  const updated: SemanticUnit = { ...unit, relations };
  const units = new Map(state.units).set(unitId, updated);
  return recomputeSemantics({ ...state, units });
}

// Create semantic field
export function createSemanticField(
  state: NarrativeSemanticsEngineState,
  fieldId: string,
  name: string,
  unitIds: string[]
): NarrativeSemanticsEngineState {
  const units = unitIds.map(id => state.units.get(id)).filter((u): u is SemanticUnit => u !== undefined);
  const density = units.length === 0 ? 0 : units.reduce((s, u) => s + u.resonance, 0) / units.length;
  const field: SemanticField = { fieldId, name, unitIds, coherence: 0.5, density, breadth: unitIds.length };
  const fields = new Map(state.fields).set(fieldId, field);
  return recomputeSemantics({ ...state, fields, totalFields: fields.size });
}

// Add interpretation
export function addInterpretation(state: NarrativeSemanticsEngineState, unitId: string, interpretation: string): NarrativeSemanticsEngineState {
  const unit = state.units.get(unitId);
  if (!unit) return state;

  const updated: SemanticUnit = { ...unit, interpretations: [...unit.interpretations, interpretation] };
  const units = new Map(state.units).set(unitId, updated);
  return recomputeSemantics({ ...state, units });
}

// Get units by context
export function getUnitsByContext(state: NarrativeSemanticsEngineState, context: SemanticContext): SemanticUnit[] {
  return Array.from(state.units.values()).filter(u => u.context === context);
}

// Get semantics report
export function getSemanticsReport(state: NarrativeSemanticsEngineState): {
  totalUnits: number;
  totalFields: number;
  averageResonance: number;
  semanticRichness: number;
  interpretiveBreadth: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalUnits === 0) recommendations.push('No units — add semantic units');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — deepen');
  if (state.interpretiveBreadth < 0.3) recommendations.push('Low breadth — add interpretations');

  return {
    totalUnits: state.totalUnits,
    totalFields: state.totalFields,
    averageResonance: Math.round(state.averageResonance * 100) / 100,
    semanticRichness: Math.round(state.semanticRichness * 100) / 100,
    interpretiveBreadth: Math.round(state.interpretiveBreadth * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSemantics(state: NarrativeSemanticsEngineState): NarrativeSemanticsEngineState {
  const units = Array.from(state.units.values());
  const averageResonance = units.length === 0 ? 0.5
    : units.reduce((s, u) => s + u.resonance, 0) / units.length;
  const depthMap: Record<MeaningDepth, number> = { surface: 0.2, shallow: 0.4, moderate: 0.6, deep: 0.8, profound: 1.0 };
  const averageDepth = units.length === 0 ? 0.5
    : units.reduce((s, u) => s + depthMap[u.depth], 0) / units.length;

  const fields = Array.from(state.fields.values());
  const semanticRichness = units.length === 0 ? 0.5
    : Math.min(1, averageResonance * 0.5 + averageDepth * 0.3 + Math.min(0.3, fields.length / 10));

  const totalInterpretations = units.reduce((s, u) => s + u.interpretations.length, 0);
  const interpretiveBreadth = units.length === 0 ? 0
    : Math.min(1, totalInterpretations / Math.max(1, units.length * 2));

  return { ...state, averageResonance, averageDepth, semanticRichness, interpretiveBreadth };
}

// Reset semantics state
export function resetNarrativeSemanticsEngineState(): NarrativeSemanticsEngineState {
  return createNarrativeSemanticsEngineState();
}