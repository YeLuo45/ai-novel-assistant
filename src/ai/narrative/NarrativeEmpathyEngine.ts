/**
 * V1122 NarrativeEmpathyEngine — Direction E Iter 9/20 (Round 5)
 * Empathy engine: reader empathy with characters
 * Sources: thunderbolt empathy + nanobot + ruflo
 */

export type EmpathyMode = 'cognitive' | 'emotional' | 'compassionate' | 'somatic' | 'imagined' | 'collective';
export type EmpathyRange = 'narrow' | 'moderate' | 'broad' | 'wide' | 'universal';
export type EmpathyAuthenticity = 'surface' | 'performed' | 'genuine' | 'profound' | 'transformative';

export interface Empathy {
  empathyId: string;
  mode: EmpathyMode;
  range: EmpathyRange;
  authenticity: EmpathyAuthenticity;
  description: string;
  resonance: number;
  understanding: number;
  chapter: number;
}

export interface EmpathyField {
  fieldId: string,
  empathyIds: string[],
  cumulativeResonance: number,
  breadth: number,
}

export interface NarrativeEmpathyEngineState {
  empathies: Map<string, Empathy>;
  fields: Map<string, EmpathyField>;
  totalEmpathies: number;
  totalFields: number;
  averageResonance: number;
  averageUnderstanding: number;
  fieldBreadth: number;
  empathyMastery: number;
}

// Factory
export function createNarrativeEmpathyEngineState(): NarrativeEmpathyEngineState {
  return {
    empathies: new Map(),
    fields: new Map(),
    totalEmpathies: 0,
    totalFields: 0,
    averageResonance: 0.5,
    averageUnderstanding: 0.5,
    fieldBreadth: 0.5,
    empathyMastery: 0.5,
  };
}

// Add empathy
export function addEmpathy(
  state: NarrativeEmpathyEngineState,
  empathyId: string,
  mode: EmpathyMode,
  range: EmpathyRange,
  authenticity: EmpathyAuthenticity,
  description: string,
  resonance: number,
  understanding: number,
  chapter: number
): NarrativeEmpathyEngineState {
  const empathy: Empathy = { empathyId, mode, range, authenticity, description, resonance, understanding, chapter };
  const empathies = new Map(state.empathies).set(empathyId, empathy);
  return recomputeEmpathy({ ...state, empathies, totalEmpathies: empathies.size });
}

// Add field
export function addEmpathyField(
  state: NarrativeEmpathyEngineState,
  fieldId: string,
  empathyIds: string[]
): NarrativeEmpathyEngineState {
  const empathies = empathyIds.map(id => state.empathies.get(id)).filter((e): e is Empathy => e !== undefined);
  const cumulativeResonance = empathies.length === 0 ? 0
    : empathies.reduce((s, e) => s + e.resonance, 0) / empathies.length;
  const modeSet = new Set(empathies.map(e => e.mode));
  const breadth = Math.min(1, modeSet.size / 6);
  const field: EmpathyField = { fieldId, empathyIds, cumulativeResonance, breadth };
  const fields = new Map(state.fields).set(fieldId, field);
  return recomputeEmpathy({ ...state, fields, totalFields: fields.size });
}

// Get empathies by mode
export function getEmpathiesByMode(state: NarrativeEmpathyEngineState, mode: EmpathyMode): Empathy[] {
  return Array.from(state.empathies.values()).filter(e => e.mode === mode);
}

// Get empathy report
export function getEmpathyReport(state: NarrativeEmpathyEngineState): {
  totalEmpathies: number;
  totalFields: number;
  averageResonance: number;
  averageUnderstanding: number;
  empathyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEmpathies === 0) recommendations.push('No empathies — add empathies');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.empathyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEmpathies: state.totalEmpathies,
    totalFields: state.totalFields,
    averageResonance: Math.round(state.averageResonance * 100) / 100,
    averageUnderstanding: Math.round(state.averageUnderstanding * 100) / 100,
    empathyMastery: Math.round(state.empathyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeEmpathy(state: NarrativeEmpathyEngineState): NarrativeEmpathyEngineState {
  const empathies = Array.from(state.empathies.values());
  const averageResonance = empathies.length === 0 ? 0.5
    : empathies.reduce((s, e) => s + e.resonance, 0) / empathies.length;
  const averageUnderstanding = empathies.length === 0 ? 0.5
    : empathies.reduce((s, e) => s + e.understanding, 0) / empathies.length;

  const fields = Array.from(state.fields.values());
  const fieldBreadth = fields.length === 0 ? 0.5
    : fields.reduce((s, f) => s + f.breadth, 0) / fields.length;

  const empathyMastery = (averageResonance * 0.4 + averageUnderstanding * 0.3 + fieldBreadth * 0.3);

  return { ...state, averageResonance, averageUnderstanding, fieldBreadth, empathyMastery };
}

// Reset
export function resetNarrativeEmpathyEngineState(): NarrativeEmpathyEngineState {
  return createNarrativeEmpathyEngineState();
}