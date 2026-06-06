/**
 * V1114 NarrativeTensionReleaseEngine — Direction E Iter 5/20 (Round 5)
 * Tension release engine: release of reader tension
 * Sources: thunderbolt release + nanobot + ruflo
 */

export type TensionReleaseType = 'relief' | 'climax' | 'denouement' | 'pause' | 'breath' | 'aftermath';
export type TensionReleasePace = 'abrupt' | 'quick' | 'gradual' | 'slow' | 'suspended';
export type TensionReleaseIntensity = 'subtle' | 'moderate' | 'strong' | 'overwhelming' | 'cathartic';

export interface TensionRelease {
  releaseId: string;
  type: TensionReleaseType;
  pace: TensionReleasePace;
  intensity: TensionReleaseIntensity;
  description: string;
  catharsis: number;
  relief: number;
  chapter: number;
}

export interface TensionWave {
  waveId: string,
  releaseIds: string[],
  cumulativeCatharsis: number,
  pacing: number,
}

export interface NarrativeTensionReleaseEngineState {
  releases: Map<string, TensionRelease>;
  waves: Map<string, TensionWave>;
  totalReleases: number;
  totalWaves: number;
  averageCatharsis: number;
  averageRelief: number;
  wavePacing: number;
  tensionReleaseMastery: number;
}

// Factory
export function createNarrativeTensionReleaseEngineState(): NarrativeTensionReleaseEngineState {
  return {
    releases: new Map(),
    waves: new Map(),
    totalReleases: 0,
    totalWaves: 0,
    averageCatharsis: 0.5,
    averageRelief: 0.5,
    wavePacing: 0.5,
    tensionReleaseMastery: 0.5,
  };
}

// Add release
export function addTensionRelease(
  state: NarrativeTensionReleaseEngineState,
  releaseId: string,
  type: TensionReleaseType,
  pace: TensionReleasePace,
  intensity: TensionReleaseIntensity,
  description: string,
  catharsis: number,
  relief: number,
  chapter: number
): NarrativeTensionReleaseEngineState {
  const release: TensionRelease = { releaseId, type, pace, intensity, description, catharsis, relief, chapter };
  const releases = new Map(state.releases).set(releaseId, release);
  return recomputeTensionRelease({ ...state, releases, totalReleases: releases.size });
}

// Add wave
export function addTensionWave(
  state: NarrativeTensionReleaseEngineState,
  waveId: string,
  releaseIds: string[]
): NarrativeTensionReleaseEngineState {
  const releases = releaseIds.map(id => state.releases.get(id)).filter((r): r is TensionRelease => r !== undefined);
  const cumulativeCatharsis = releases.length === 0 ? 0
    : releases.reduce((s, r) => s + r.catharsis, 0) / releases.length;
  const pacing = releases.length < 2 ? 0.5
    : 1 - Math.abs(releases[0].relief - releases[releases.length - 1].relief);
  const wave: TensionWave = { waveId, releaseIds, cumulativeCatharsis, pacing };
  const waves = new Map(state.waves).set(waveId, wave);
  return recomputeTensionRelease({ ...state, waves, totalWaves: waves.size });
}

// Get releases by type
export function getTensionReleasesByType(state: NarrativeTensionReleaseEngineState, type: TensionReleaseType): TensionRelease[] {
  return Array.from(state.releases.values()).filter(r => r.type === type);
}

// Get tension release report
export function getTensionReleaseReport(state: NarrativeTensionReleaseEngineState): {
  totalReleases: number;
  totalWaves: number;
  averageCatharsis: number;
  averageRelief: number;
  tensionReleaseMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalReleases === 0) recommendations.push('No releases — add tension releases');
  if (state.averageCatharsis < 0.5) recommendations.push('Low catharsis — strengthen');
  if (state.tensionReleaseMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalReleases: state.totalReleases,
    totalWaves: state.totalWaves,
    averageCatharsis: Math.round(state.averageCatharsis * 100) / 100,
    averageRelief: Math.round(state.averageRelief * 100) / 100,
    tensionReleaseMastery: Math.round(state.tensionReleaseMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTensionRelease(state: NarrativeTensionReleaseEngineState): NarrativeTensionReleaseEngineState {
  const releases = Array.from(state.releases.values());
  const averageCatharsis = releases.length === 0 ? 0.5
    : releases.reduce((s, r) => s + r.catharsis, 0) / releases.length;
  const averageRelief = releases.length === 0 ? 0.5
    : releases.reduce((s, r) => s + r.relief, 0) / releases.length;

  const waves = Array.from(state.waves.values());
  const wavePacing = waves.length === 0 ? 0.5
    : waves.reduce((s, w) => s + w.pacing, 0) / waves.length;

  const tensionReleaseMastery = (averageCatharsis * 0.4 + averageRelief * 0.3 + wavePacing * 0.3);

  return { ...state, averageCatharsis, averageRelief, wavePacing, tensionReleaseMastery };
}

// Reset
export function resetNarrativeTensionReleaseEngineState(): NarrativeTensionReleaseEngineState {
  return createNarrativeTensionReleaseEngineState();
}