/**
 * V1196 NarrativeTimeRiftEngine — Direction G Iter 6/20 (Round 5)
 * Time rift engine: rift in time
 * Sources: ruflo rift + nanobot + thunderbolt
 */

export type TimeRiftType = 'temporal' | 'causal' | 'dimensional' | 'parallel' | 'recursive' | 'quantum';
export type TimeRiftSeverity = 'minor' | 'moderate' | 'major' | 'critical' | 'apocalyptic';
export type TimeRiftStability = 'unstable' | 'shifting' | 'stable' | 'fixed' | 'crystallized';

export interface TimeRift {
  riftId: string;
  type: TimeRiftType;
  severity: TimeRiftSeverity;
  stability: TimeRiftStability;
  description: string;
  impact: number;
  reach: number;
  chapter: number;
}

export interface TimeRiftField {
  fieldId: string,
  riftIds: string[],
  cumulativeImpact: number,
  complexity: number,
}

export interface NarrativeTimeRiftEngineState {
  rifts: Map<string, TimeRift>;
  fields: Map<string, TimeRiftField>;
  totalRifts: number;
  totalFields: number;
  averageImpact: number;
  averageReach: number;
  fieldComplexity: number;
  timeRiftMastery: number;
}

// Factory
export function createNarrativeTimeRiftEngineState(): NarrativeTimeRiftEngineState {
  return {
    rifts: new Map(),
    fields: new Map(),
    totalRifts: 0,
    totalFields: 0,
    averageImpact: 0.5,
    averageReach: 0.5,
    fieldComplexity: 0.5,
    timeRiftMastery: 0.5,
  };
}

// Add rift
export function addTimeRift(
  state: NarrativeTimeRiftEngineState,
  riftId: string,
  type: TimeRiftType,
  severity: TimeRiftSeverity,
  stability: TimeRiftStability,
  description: string,
  impact: number,
  reach: number,
  chapter: number
): NarrativeTimeRiftEngineState {
  const rift: TimeRift = { riftId, type, severity, stability, description, impact, reach, chapter };
  const rifts = new Map(state.rifts).set(riftId, rift);
  return recomputeTimeRift({ ...state, rifts, totalRifts: rifts.size });
}

// Add field
export function addTimeRiftField(
  state: NarrativeTimeRiftEngineState,
  fieldId: string,
  riftIds: string[]
): NarrativeTimeRiftEngineState {
  const rifts = riftIds.map(id => state.rifts.get(id)).filter((r): r is TimeRift => r !== undefined);
  const cumulativeImpact = rifts.length === 0 ? 0
    : rifts.reduce((s, r) => s + r.impact, 0) / rifts.length;
  const typeSet = new Set(rifts.map(r => r.type));
  const complexity = Math.min(1, typeSet.size / 6);
  const field: TimeRiftField = { fieldId, riftIds, cumulativeImpact, complexity };
  const fields = new Map(state.fields).set(fieldId, field);
  return recomputeTimeRift({ ...state, fields, totalFields: fields.size });
}

// Get rifts by type
export function getTimeRiftsByType(state: NarrativeTimeRiftEngineState, type: TimeRiftType): TimeRift[] {
  return Array.from(state.rifts.values()).filter(r => r.type === type);
}

// Get time rift report
export function getTimeRiftReport(state: NarrativeTimeRiftEngineState): {
  totalRifts: number;
  totalFields: number;
  averageImpact: number;
  averageReach: number;
  timeRiftMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalRifts === 0) recommendations.push('No rifts — add time rifts');
  if (state.averageImpact < 0.5) recommendations.push('Low impact — strengthen');
  if (state.timeRiftMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalRifts: state.totalRifts,
    totalFields: state.totalFields,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    averageReach: Math.round(state.averageReach * 100) / 100,
    timeRiftMastery: Math.round(state.timeRiftMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTimeRift(state: NarrativeTimeRiftEngineState): NarrativeTimeRiftEngineState {
  const rifts = Array.from(state.rifts.values());
  const averageImpact = rifts.length === 0 ? 0.5
    : rifts.reduce((s, r) => s + r.impact, 0) / rifts.length;
  const averageReach = rifts.length === 0 ? 0.5
    : rifts.reduce((s, r) => s + r.reach, 0) / rifts.length;

  const fields = Array.from(state.fields.values());
  const fieldComplexity = fields.length === 0 ? 0.5
    : fields.reduce((s, f) => s + f.complexity, 0) / fields.length;

  const timeRiftMastery = (averageImpact * 0.4 + averageReach * 0.3 + fieldComplexity * 0.3);

  return { ...state, averageImpact, averageReach, fieldComplexity, timeRiftMastery };
}

// Reset
export function resetNarrativeTimeRiftEngineState(): NarrativeTimeRiftEngineState {
  return createNarrativeTimeRiftEngineState();
}