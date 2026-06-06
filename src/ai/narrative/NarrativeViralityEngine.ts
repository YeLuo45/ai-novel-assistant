/**
 * V1136 NarrativeViralityEngine — Direction E Iter 16/20 (Round 5)
 * Virality engine: virality of narrative content
 * Sources: thunderbolt virality + nanobot + ruflo
 */

export type ViralityType = 'quote' | 'scene' | 'character' | 'concept' | 'moment' | 'meme';
export type ViralitySpread = 'slow' | 'steady' | 'rapid' | 'viral' | 'pandemic';
export type ViralityReach = 'niche' | 'narrow' | 'moderate' | 'broad' | 'universal';

export interface Virality {
  viralityId: string;
  type: ViralityType;
  spread: ViralitySpread;
  reach: ViralityReach;
  description: string;
  contagion: number;
  persistence: number;
  chapter: number;
}

export interface ViralityWave {
  waveId: string,
  viralityIds: string[],
  cumulativeContagion: number,
  amplification: number,
}

export interface NarrativeViralityEngineState {
  viralities: Map<string, Virality>;
  waves: Map<string, ViralityWave>;
  totalViralities: number;
  totalWaves: number;
  averageContagion: number;
  averagePersistence: number;
  waveAmplification: number;
  viralityMastery: number;
}

// Factory
export function createNarrativeViralityEngineState(): NarrativeViralityEngineState {
  return {
    viralities: new Map(),
    waves: new Map(),
    totalViralities: 0,
    totalWaves: 0,
    averageContagion: 0.5,
    averagePersistence: 0.5,
    waveAmplification: 0.5,
    viralityMastery: 0.5,
  };
}

// Add virality
export function addVirality(
  state: NarrativeViralityEngineState,
  viralityId: string,
  type: ViralityType,
  spread: ViralitySpread,
  reach: ViralityReach,
  description: string,
  contagion: number,
  persistence: number,
  chapter: number
): NarrativeViralityEngineState {
  const virality: Virality = { viralityId, type, spread, reach, description, contagion, persistence, chapter };
  const viralities = new Map(state.viralities).set(viralityId, virality);
  return recomputeVirality({ ...state, viralities, totalViralities: viralities.size });
}

// Add wave
export function addViralityWave(
  state: NarrativeViralityEngineState,
  waveId: string,
  viralityIds: string[]
): NarrativeViralityEngineState {
  const viralities = viralityIds.map(id => state.viralities.get(id)).filter((v): v is Virality => v !== undefined);
  const cumulativeContagion = viralities.length === 0 ? 0
    : viralities.reduce((s, v) => s + v.contagion, 0) / viralities.length;
  const amplification = viralities.length === 0 ? 0.5
    : viralities.reduce((s, v) => s + (v.spread === 'pandemic' ? 1 : v.spread === 'viral' ? 0.85 : v.spread === 'rapid' ? 0.7 : v.spread === 'steady' ? 0.5 : 0.3), 0) / viralities.length;
  const wave: ViralityWave = { waveId, viralityIds, cumulativeContagion, amplification };
  const waves = new Map(state.waves).set(waveId, wave);
  return recomputeVirality({ ...state, waves, totalWaves: waves.size });
}

// Get viralities by type
export function getViralitiesByType(state: NarrativeViralityEngineState, type: ViralityType): Virality[] {
  return Array.from(state.viralities.values()).filter(v => v.type === type);
}

// Get virality report
export function getViralityReport(state: NarrativeViralityEngineState): {
  totalViralities: number;
  totalWaves: number;
  averageContagion: number;
  averagePersistence: number;
  viralityMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalViralities === 0) recommendations.push('No viralities — add viralities');
  if (state.averageContagion < 0.5) recommendations.push('Low contagion — strengthen');
  if (state.viralityMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalViralities: state.totalViralities,
    totalWaves: state.totalWaves,
    averageContagion: Math.round(state.averageContagion * 100) / 100,
    averagePersistence: Math.round(state.averagePersistence * 100) / 100,
    viralityMastery: Math.round(state.viralityMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeVirality(state: NarrativeViralityEngineState): NarrativeViralityEngineState {
  const viralities = Array.from(state.viralities.values());
  const averageContagion = viralities.length === 0 ? 0.5
    : viralities.reduce((s, v) => s + v.contagion, 0) / viralities.length;
  const averagePersistence = viralities.length === 0 ? 0.5
    : viralities.reduce((s, v) => s + v.persistence, 0) / viralities.length;

  const waves = Array.from(state.waves.values());
  const waveAmplification = waves.length === 0 ? 0.5
    : waves.reduce((s, w) => s + w.amplification, 0) / waves.length;

  const viralityMastery = (averageContagion * 0.4 + averagePersistence * 0.3 + waveAmplification * 0.3);

  return { ...state, averageContagion, averagePersistence, waveAmplification, viralityMastery };
}

// Reset
export function resetNarrativeViralityEngineState(): NarrativeViralityEngineState {
  return createNarrativeViralityEngineState();
}