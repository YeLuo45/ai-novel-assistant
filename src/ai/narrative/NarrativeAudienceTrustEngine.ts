/**
 * V1256 NarrativeAudienceTrustEngine — Direction H Iter 16/20 (Round 5)
 * Audience trust engine: trust of audience
 * Sources: thunderbolt trust + nanobot + ruflo
 */

export type AudienceTrustType = 'cognitive' | 'emotional' | 'intuitive' | 'experiential' | 'identity' | 'transcendent';
export type AudienceTrustLevel = 'distrust' | 'wary' | 'neutral' | 'trusting' | 'absolute';
export type AudienceTrustVulnerability = 'guarded' | 'cautious' | 'open' | 'vulnerable' | 'completely_open';

export interface AudienceTrust {
  trustId: string;
  type: AudienceTrustType;
  level: AudienceTrustLevel;
  vulnerability: AudienceTrustVulnerability;
  description: string;
  earned: number;
  fragility: number;
  chapter: number;
}

export interface AudienceTrustField {
  fieldId: string,
  trustIds: string[],
  cumulativeEarned: number,
  cohesion: number,
}

export interface NarrativeAudienceTrustEngineState {
  trusts: Map<string, AudienceTrust>;
  fields: Map<string, AudienceTrustField>;
  totalTrusts: number;
  totalFields: number;
  averageEarned: number;
  averageFragility: number;
  fieldCohesion: number;
  audienceTrustMastery: number;
}

// Factory
export function createNarrativeAudienceTrustEngineState(): NarrativeAudienceTrustEngineState {
  return {
    trusts: new Map(),
    fields: new Map(),
    totalTrusts: 0,
    totalFields: 0,
    averageEarned: 0.5,
    averageFragility: 0.5,
    fieldCohesion: 0.5,
    audienceTrustMastery: 0.5,
  };
}

// Add trust
export function addAudienceTrust(
  state: NarrativeAudienceTrustEngineState,
  trustId: string,
  type: AudienceTrustType,
  level: AudienceTrustLevel,
  vulnerability: AudienceTrustVulnerability,
  description: string,
  earned: number,
  fragility: number,
  chapter: number
): NarrativeAudienceTrustEngineState {
  const trust: AudienceTrust = { trustId, type, level, vulnerability, description, earned, fragility, chapter };
  const trusts = new Map(state.trusts).set(trustId, trust);
  return recomputeAudienceTrust({ ...state, trusts, totalTrusts: trusts.size });
}

// Add field
export function addAudienceTrustField(
  state: NarrativeAudienceTrustEngineState,
  fieldId: string,
  trustIds: string[]
): NarrativeAudienceTrustEngineState {
  const trusts = trustIds.map(id => state.trusts.get(id)).filter((t): t is AudienceTrust => t !== undefined);
  const cumulativeEarned = trusts.length === 0 ? 0
    : trusts.reduce((s, t) => s + t.earned, 0) / trusts.length;
  const typeSet = new Set(trusts.map(t => t.type));
  const cohesion = Math.min(1, typeSet.size / 6);
  const field: AudienceTrustField = { fieldId, trustIds, cumulativeEarned, cohesion };
  const fields = new Map(state.fields).set(fieldId, field);
  return recomputeAudienceTrust({ ...state, fields, totalFields: fields.size });
}

// Get trusts by type
export function getAudienceTrustsByType(state: NarrativeAudienceTrustEngineState, type: AudienceTrustType): AudienceTrust[] {
  return Array.from(state.trusts.values()).filter(t => t.type === type);
}

// Get audience trust report
export function getAudienceTrustReport(state: NarrativeAudienceTrustEngineState): {
  totalTrusts: number;
  totalFields: number;
  averageEarned: number;
  averageFragility: number;
  audienceTrustMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalTrusts === 0) recommendations.push('No trusts — add audience trusts');
  if (state.averageEarned < 0.5) recommendations.push('Low earned — strengthen');
  if (state.audienceTrustMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalTrusts: state.totalTrusts,
    totalFields: state.totalFields,
    averageEarned: Math.round(state.averageEarned * 100) / 100,
    averageFragility: Math.round(state.averageFragility * 100) / 100,
    audienceTrustMastery: Math.round(state.audienceTrustMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAudienceTrust(state: NarrativeAudienceTrustEngineState): NarrativeAudienceTrustEngineState {
  const trusts = Array.from(state.trusts.values());
  const averageEarned = trusts.length === 0 ? 0.5
    : trusts.reduce((s, t) => s + t.earned, 0) / trusts.length;
  const averageFragility = trusts.length === 0 ? 0.5
    : trusts.reduce((s, t) => s + t.fragility, 0) / trusts.length;

  const fields = Array.from(state.fields.values());
  const fieldCohesion = fields.length === 0 ? 0.5
    : fields.reduce((s, f) => s + f.cohesion, 0) / fields.length;

  const audienceTrustMastery = (averageEarned * 0.4 + averageFragility * 0.3 + fieldCohesion * 0.3);

  return { ...state, averageEarned, averageFragility, fieldCohesion, audienceTrustMastery };
}

// Reset
export function resetNarrativeAudienceTrustEngineState(): NarrativeAudienceTrustEngineState {
  return createNarrativeAudienceTrustEngineState();
}