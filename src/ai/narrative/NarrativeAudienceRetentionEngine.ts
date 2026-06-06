/**
 * V1232 NarrativeAudienceRetentionEngine — Direction H Iter 4/20 (Round 5)
 * Audience retention engine: retention of audience
 * Sources: nanobot retention + thunderbolt + ruflo
 */

export type AudienceRetentionType = 'initial' | 'continued' | 'deep' | 'long_term' | 'lifetime' | 'generational';
export type AudienceRetentionStrength = 'weak' | 'moderate' | 'strong' | 'powerful' | 'unbreakable';
export type AudienceRetentionMechanism = 'intrigue' | 'emotion' | 'connection' | 'investment' | 'reward' | 'habit';

export interface AudienceRetention {
  retentionId: string;
  type: AudienceRetentionType;
  strength: AudienceRetentionStrength;
  mechanism: AudienceRetentionMechanism;
  description: string;
  stickiness: number;
  durability: number;
  chapter: number;
}

export interface AudienceRetentionWave {
  waveId: string,
  retentionIds: string[],
  cumulativeStickiness: number,
  breadth: number,
}

export interface NarrativeAudienceRetentionEngineState {
  retentions: Map<string, AudienceRetention>;
  waves: Map<string, AudienceRetentionWave>;
  totalRetentions: number;
  totalWaves: number;
  averageStickiness: number;
  averageDurability: number;
  waveBreadth: number;
  audienceRetentionMastery: number;
}

// Factory
export function createNarrativeAudienceRetentionEngineState(): NarrativeAudienceRetentionEngineState {
  return {
    retentions: new Map(),
    waves: new Map(),
    totalRetentions: 0,
    totalWaves: 0,
    averageStickiness: 0.5,
    averageDurability: 0.5,
    waveBreadth: 0.5,
    audienceRetentionMastery: 0.5,
  };
}

// Add retention
export function addAudienceRetention(
  state: NarrativeAudienceRetentionEngineState,
  retentionId: string,
  type: AudienceRetentionType,
  strength: AudienceRetentionStrength,
  mechanism: AudienceRetentionMechanism,
  description: string,
  stickiness: number,
  durability: number,
  chapter: number
): NarrativeAudienceRetentionEngineState {
  const retention: AudienceRetention = { retentionId, type, strength, mechanism, description, stickiness, durability, chapter };
  const retentions = new Map(state.retentions).set(retentionId, retention);
  return recomputeAudienceRetention({ ...state, retentions, totalRetentions: retentions.size });
}

// Add wave
export function addAudienceRetentionWave(
  state: NarrativeAudienceRetentionEngineState,
  waveId: string,
  retentionIds: string[]
): NarrativeAudienceRetentionEngineState {
  const retentions = retentionIds.map(id => state.retentions.get(id)).filter((r): r is AudienceRetention => r !== undefined);
  const cumulativeStickiness = retentions.length === 0 ? 0
    : retentions.reduce((s, r) => s + r.stickiness, 0) / retentions.length;
  const typeSet = new Set(retentions.map(r => r.type));
  const breadth = Math.min(1, typeSet.size / 6);
  const wave: AudienceRetentionWave = { waveId, retentionIds, cumulativeStickiness, breadth };
  const waves = new Map(state.waves).set(waveId, wave);
  return recomputeAudienceRetention({ ...state, waves, totalWaves: waves.size });
}

// Get retentions by type
export function getAudienceRetentionsByType(state: NarrativeAudienceRetentionEngineState, type: AudienceRetentionType): AudienceRetention[] {
  return Array.from(state.retentions.values()).filter(r => r.type === type);
}

// Get audience retention report
export function getAudienceRetentionReport(state: NarrativeAudienceRetentionEngineState): {
  totalRetentions: number;
  totalWaves: number;
  averageStickiness: number;
  averageDurability: number;
  audienceRetentionMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalRetentions === 0) recommendations.push('No retentions — add audience retentions');
  if (state.averageStickiness < 0.5) recommendations.push('Low stickiness — strengthen');
  if (state.audienceRetentionMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalRetentions: state.totalRetentions,
    totalWaves: state.totalWaves,
    averageStickiness: Math.round(state.averageStickiness * 100) / 100,
    averageDurability: Math.round(state.averageDurability * 100) / 100,
    audienceRetentionMastery: Math.round(state.audienceRetentionMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAudienceRetention(state: NarrativeAudienceRetentionEngineState): NarrativeAudienceRetentionEngineState {
  const retentions = Array.from(state.retentions.values());
  const averageStickiness = retentions.length === 0 ? 0.5
    : retentions.reduce((s, r) => s + r.stickiness, 0) / retentions.length;
  const averageDurability = retentions.length === 0 ? 0.5
    : retentions.reduce((s, r) => s + r.durability, 0) / retentions.length;

  const waves = Array.from(state.waves.values());
  const waveBreadth = waves.length === 0 ? 0.5
    : waves.reduce((s, w) => s + w.breadth, 0) / waves.length;

  const audienceRetentionMastery = (averageStickiness * 0.4 + averageDurability * 0.3 + waveBreadth * 0.3);

  return { ...state, averageStickiness, averageDurability, waveBreadth, audienceRetentionMastery };
}

// Reset
export function resetNarrativeAudienceRetentionEngineState(): NarrativeAudienceRetentionEngineState {
  return createNarrativeAudienceRetentionEngineState();
}