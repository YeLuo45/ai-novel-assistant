/**
 * V1162 NarrativeSensoryDetailEngine — Direction F Iter 9/20 (Round 5)
 * Sensory detail engine: sensory details in narrative
 * Sources: nanobot sensory + thunderbolt + ruflo
 */

export type SensoryDetailType = 'sight' | 'sound' | 'touch' | 'smell' | 'taste' | 'proprioception';
export type SensoryDetailDensity = 'absent' | 'sparse' | 'moderate' | 'rich' | 'overwhelming';
export type SensoryDetailSpecificity = 'vague' | 'general' | 'specific' | 'precise' | 'tactile';

export interface SensoryDetail {
  detailId: string;
  type: SensoryDetailType;
  density: SensoryDetailDensity;
  specificity: SensoryDetailSpecificity;
  description: string;
  vividness: number;
  presence: number;
  chapter: number;
}

export interface SensoryDetailField {
  fieldId: string,
  detailIds: string[],
  cumulativeVividness: number,
  coverage: number,
}

export interface NarrativeSensoryDetailEngineState {
  details: Map<string, SensoryDetail>;
  fields: Map<string, SensoryDetailField>;
  totalDetails: number;
  totalFields: number;
  averageVividness: number;
  averagePresence: number;
  fieldCoverage: number;
  sensoryDetailMastery: number;
}

// Factory
export function createNarrativeSensoryDetailEngineState(): NarrativeSensoryDetailEngineState {
  return {
    details: new Map(),
    fields: new Map(),
    totalDetails: 0,
    totalFields: 0,
    averageVividness: 0.5,
    averagePresence: 0.5,
    fieldCoverage: 0.5,
    sensoryDetailMastery: 0.5,
  };
}

// Add detail
export function addSensoryDetail(
  state: NarrativeSensoryDetailEngineState,
  detailId: string,
  type: SensoryDetailType,
  density: SensoryDetailDensity,
  specificity: SensoryDetailSpecificity,
  description: string,
  vividness: number,
  presence: number,
  chapter: number
): NarrativeSensoryDetailEngineState {
  const detail: SensoryDetail = { detailId, type, density, specificity, description, vividness, presence, chapter };
  const details = new Map(state.details).set(detailId, detail);
  return recomputeSensoryDetail({ ...state, details, totalDetails: details.size });
}

// Add field
export function addSensoryDetailField(
  state: NarrativeSensoryDetailEngineState,
  fieldId: string,
  detailIds: string[]
): NarrativeSensoryDetailEngineState {
  const details = detailIds.map(id => state.details.get(id)).filter((d): d is SensoryDetail => d !== undefined);
  const cumulativeVividness = details.length === 0 ? 0
    : details.reduce((s, d) => s + d.vividness, 0) / details.length;
  const typeSet = new Set(details.map(d => d.type));
  const coverage = Math.min(1, typeSet.size / 6);
  const field: SensoryDetailField = { fieldId, detailIds, cumulativeVividness, coverage };
  const fields = new Map(state.fields).set(fieldId, field);
  return recomputeSensoryDetail({ ...state, fields, totalFields: fields.size });
}

// Get details by type
export function getSensoryDetailsByType(state: NarrativeSensoryDetailEngineState, type: SensoryDetailType): SensoryDetail[] {
  return Array.from(state.details.values()).filter(d => d.type === type);
}

// Get sensory detail report
export function getSensoryDetailReport(state: NarrativeSensoryDetailEngineState): {
  totalDetails: number;
  totalFields: number;
  averageVividness: number;
  averagePresence: number;
  sensoryDetailMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalDetails === 0) recommendations.push('No details — add sensory details');
  if (state.averageVividness < 0.5) recommendations.push('Low vividness — strengthen');
  if (state.sensoryDetailMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalDetails: state.totalDetails,
    totalFields: state.totalFields,
    averageVividness: Math.round(state.averageVividness * 100) / 100,
    averagePresence: Math.round(state.averagePresence * 100) / 100,
    sensoryDetailMastery: Math.round(state.sensoryDetailMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSensoryDetail(state: NarrativeSensoryDetailEngineState): NarrativeSensoryDetailEngineState {
  const details = Array.from(state.details.values());
  const averageVividness = details.length === 0 ? 0.5
    : details.reduce((s, d) => s + d.vividness, 0) / details.length;
  const averagePresence = details.length === 0 ? 0.5
    : details.reduce((s, d) => s + d.presence, 0) / details.length;

  const fields = Array.from(state.fields.values());
  const fieldCoverage = fields.length === 0 ? 0.5
    : fields.reduce((s, f) => s + f.coverage, 0) / fields.length;

  const sensoryDetailMastery = (averageVividness * 0.4 + averagePresence * 0.3 + fieldCoverage * 0.3);

  return { ...state, averageVividness, averagePresence, fieldCoverage, sensoryDetailMastery };
}

// Reset
export function resetNarrativeSensoryDetailEngineState(): NarrativeSensoryDetailEngineState {
  return createNarrativeSensoryDetailEngineState();
}