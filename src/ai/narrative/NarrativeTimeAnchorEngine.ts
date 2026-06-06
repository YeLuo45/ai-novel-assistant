/**
 * V1190 NarrativeTimeAnchorEngine — Direction G Iter 3/20 (Round 5)
 * Time anchor engine: anchors in time
 * Sources: ruflo anchor + nanobot + thunderbolt
 */

export type TimeAnchorType = 'event' | 'memory' | 'milestone' | 'ritual' | 'anniversary' | 'synchronization';
export type TimeAnchorStrength = 'fragile' | 'weak' | 'moderate' | 'strong' | 'unbreakable';
export type TimeAnchorResonance = 'faint' | 'partial' | 'clear' | 'vivid' | 'searing';

export interface TimeAnchor {
  anchorId: string;
  type: TimeAnchorType;
  strength: TimeAnchorStrength;
  resonance: TimeAnchorResonance;
  description: string;
  stability: number;
  impact: number;
  chapter: number;
}

export interface TimeAnchorField {
  fieldId: string,
  anchorIds: string[],
  cumulativeStability: number,
  density: number,
}

export interface NarrativeTimeAnchorEngineState {
  anchors: Map<string, TimeAnchor>;
  fields: Map<string, TimeAnchorField>;
  totalAnchors: number;
  totalFields: number;
  averageStability: number;
  averageImpact: number;
  fieldDensity: number;
  timeAnchorMastery: number;
}

// Factory
export function createNarrativeTimeAnchorEngineState(): NarrativeTimeAnchorEngineState {
  return {
    anchors: new Map(),
    fields: new Map(),
    totalAnchors: 0,
    totalFields: 0,
    averageStability: 0.5,
    averageImpact: 0.5,
    fieldDensity: 0.5,
    timeAnchorMastery: 0.5,
  };
}

// Add anchor
export function addTimeAnchor(
  state: NarrativeTimeAnchorEngineState,
  anchorId: string,
  type: TimeAnchorType,
  strength: TimeAnchorStrength,
  resonance: TimeAnchorResonance,
  description: string,
  stability: number,
  impact: number,
  chapter: number
): NarrativeTimeAnchorEngineState {
  const anchor: TimeAnchor = { anchorId, type, strength, resonance, description, stability, impact, chapter };
  const anchors = new Map(state.anchors).set(anchorId, anchor);
  return recomputeTimeAnchor({ ...state, anchors, totalAnchors: anchors.size });
}

// Add field
export function addTimeAnchorField(
  state: NarrativeTimeAnchorEngineState,
  fieldId: string,
  anchorIds: string[]
): NarrativeTimeAnchorEngineState {
  const anchors = anchorIds.map(id => state.anchors.get(id)).filter((a): a is TimeAnchor => a !== undefined);
  const cumulativeStability = anchors.length === 0 ? 0
    : anchors.reduce((s, a) => s + a.stability, 0) / anchors.length;
  const typeSet = new Set(anchors.map(a => a.type));
  const density = Math.min(1, typeSet.size / 6);
  const field: TimeAnchorField = { fieldId, anchorIds, cumulativeStability, density };
  const fields = new Map(state.fields).set(fieldId, field);
  return recomputeTimeAnchor({ ...state, fields, totalFields: fields.size });
}

// Get anchors by type
export function getTimeAnchorsByType(state: NarrativeTimeAnchorEngineState, type: TimeAnchorType): TimeAnchor[] {
  return Array.from(state.anchors.values()).filter(a => a.type === type);
}

// Get time anchor report
export function getTimeAnchorReport(state: NarrativeTimeAnchorEngineState): {
  totalAnchors: number;
  totalFields: number;
  averageStability: number;
  averageImpact: number;
  timeAnchorMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalAnchors === 0) recommendations.push('No anchors — add time anchors');
  if (state.averageStability < 0.5) recommendations.push('Low stability — strengthen');
  if (state.timeAnchorMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalAnchors: state.totalAnchors,
    totalFields: state.totalFields,
    averageStability: Math.round(state.averageStability * 100) / 100,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    timeAnchorMastery: Math.round(state.timeAnchorMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTimeAnchor(state: NarrativeTimeAnchorEngineState): NarrativeTimeAnchorEngineState {
  const anchors = Array.from(state.anchors.values());
  const averageStability = anchors.length === 0 ? 0.5
    : anchors.reduce((s, a) => s + a.stability, 0) / anchors.length;
  const averageImpact = anchors.length === 0 ? 0.5
    : anchors.reduce((s, a) => s + a.impact, 0) / anchors.length;

  const fields = Array.from(state.fields.values());
  const fieldDensity = fields.length === 0 ? 0.5
    : fields.reduce((s, f) => s + f.density, 0) / fields.length;

  const timeAnchorMastery = (averageStability * 0.4 + averageImpact * 0.3 + fieldDensity * 0.3);

  return { ...state, averageStability, averageImpact, fieldDensity, timeAnchorMastery };
}

// Reset
export function resetNarrativeTimeAnchorEngineState(): NarrativeTimeAnchorEngineState {
  return createNarrativeTimeAnchorEngineState();
}