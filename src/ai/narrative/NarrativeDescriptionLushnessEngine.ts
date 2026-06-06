/**
 * V1154 NarrativeDescriptionLushnessEngine — Direction F Iter 5/20 (Round 5)
 * Description lushness engine: lushness of description
 * Sources: ruflo lushness + nanobot + thunderbolt
 */

export type DescriptionLushnessType = 'minimal' | 'sparse' | 'moderate' | 'rich' | 'maximalist';
export type DescriptionLushnessDetail = 'suggestive' | 'evocative' | 'specific' | 'granular' | 'microscopic';
export type DescriptionLushnessSensory = 'single' | 'dual' | 'multi' | 'symphonic' | 'synesthetic';

export interface DescriptionLushness {
  lushnessId: string;
  type: DescriptionLushnessType;
  detail: DescriptionLushnessDetail;
  sensory: DescriptionLushnessSensory;
  description: string;
  vividness: number;
  resonance: number;
  chapter: number;
}

export interface DescriptionLushnessField {
  fieldId: string,
  lushnessIds: string[],
  cumulativeVividness: number,
  richness: number,
}

export interface NarrativeDescriptionLushnessEngineState {
  lushnesses: Map<string, DescriptionLushness>;
  fields: Map<string, DescriptionLushnessField>;
  totalLushnesses: number;
  totalFields: number;
  averageVividness: number;
  averageResonance: number;
  fieldRichness: number;
  descriptionLushnessMastery: number;
}

// Factory
export function createNarrativeDescriptionLushnessEngineState(): NarrativeDescriptionLushnessEngineState {
  return {
    lushnesses: new Map(),
    fields: new Map(),
    totalLushnesses: 0,
    totalFields: 0,
    averageVividness: 0.5,
    averageResonance: 0.5,
    fieldRichness: 0.5,
    descriptionLushnessMastery: 0.5,
  };
}

// Add lushness
export function addDescriptionLushness(
  state: NarrativeDescriptionLushnessEngineState,
  lushnessId: string,
  type: DescriptionLushnessType,
  detail: DescriptionLushnessDetail,
  sensory: DescriptionLushnessSensory,
  description: string,
  vividness: number,
  resonance: number,
  chapter: number
): NarrativeDescriptionLushnessEngineState {
  const lushness: DescriptionLushness = { lushnessId, type, detail, sensory, description, vividness, resonance, chapter };
  const lushnesses = new Map(state.lushnesses).set(lushnessId, lushness);
  return recomputeDescriptionLushness({ ...state, lushnesses, totalLushnesses: lushnesses.size });
}

// Add field
export function addDescriptionLushnessField(
  state: NarrativeDescriptionLushnessEngineState,
  fieldId: string,
  lushnessIds: string[]
): NarrativeDescriptionLushnessEngineState {
  const lushnesses = lushnessIds.map(id => state.lushnesses.get(id)).filter((l): l is DescriptionLushness => l !== undefined);
  const cumulativeVividness = lushnesses.length === 0 ? 0
    : lushnesses.reduce((s, l) => s + l.vividness, 0) / lushnesses.length;
  const sensorySet = new Set(lushnesses.map(l => l.sensory));
  const richness = Math.min(1, sensorySet.size / 5);
  const field: DescriptionLushnessField = { fieldId, lushnessIds, cumulativeVividness, richness };
  const fields = new Map(state.fields).set(fieldId, field);
  return recomputeDescriptionLushness({ ...state, fields, totalFields: fields.size });
}

// Get lushnesses by type
export function getDescriptionLushnessesByType(state: NarrativeDescriptionLushnessEngineState, type: DescriptionLushnessType): DescriptionLushness[] {
  return Array.from(state.lushnesses.values()).filter(l => l.type === type);
}

// Get description lushness report
export function getDescriptionLushnessReport(state: NarrativeDescriptionLushnessEngineState): {
  totalLushnesses: number;
  totalFields: number;
  averageVividness: number;
  averageResonance: number;
  descriptionLushnessMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalLushnesses === 0) recommendations.push('No lushnesses — add description lushnesses');
  if (state.averageVividness < 0.5) recommendations.push('Low vividness — strengthen');
  if (state.descriptionLushnessMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalLushnesses: state.totalLushnesses,
    totalFields: state.totalFields,
    averageVividness: Math.round(state.averageVividness * 100) / 100,
    averageResonance: Math.round(state.averageResonance * 100) / 100,
    descriptionLushnessMastery: Math.round(state.descriptionLushnessMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeDescriptionLushness(state: NarrativeDescriptionLushnessEngineState): NarrativeDescriptionLushnessEngineState {
  const lushnesses = Array.from(state.lushnesses.values());
  const averageVividness = lushnesses.length === 0 ? 0.5
    : lushnesses.reduce((s, l) => s + l.vividness, 0) / lushnesses.length;
  const averageResonance = lushnesses.length === 0 ? 0.5
    : lushnesses.reduce((s, l) => s + l.resonance, 0) / lushnesses.length;

  const fields = Array.from(state.fields.values());
  const fieldRichness = fields.length === 0 ? 0.5
    : fields.reduce((s, f) => s + f.richness, 0) / fields.length;

  const descriptionLushnessMastery = (averageVividness * 0.4 + averageResonance * 0.3 + fieldRichness * 0.3);

  return { ...state, averageVividness, averageResonance, fieldRichness, descriptionLushnessMastery };
}

// Reset
export function resetNarrativeDescriptionLushnessEngineState(): NarrativeDescriptionLushnessEngineState {
  return createNarrativeDescriptionLushnessEngineState();
}