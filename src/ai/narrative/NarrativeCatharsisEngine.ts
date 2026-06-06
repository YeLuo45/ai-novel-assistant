/**
 * V1120 NarrativeCatharsisEngine — Direction E Iter 8/20 (Round 5)
 * Catharsis engine: catharsis + emotional purification
 * Sources: ruflo catharsis + thunderbolt + nanobot
 */

export type CatharsisType = 'pity' | 'fear' | 'anger' | 'joy' | 'grief' | 'transcendence';
export type CatharsisIntensity = 'subtle' | 'moderate' | 'strong' | 'overwhelming' | 'transformative';
export type CatharsisDuration = 'fleeting' | 'brief' | 'sustained' | 'lingering' | 'permanent';

export interface Catharsis {
  catharsisId: string;
  type: CatharsisType;
  intensity: CatharsisIntensity;
  duration: CatharsisDuration;
  description: string;
  release: number;
  transformation: number;
  chapter: number;
}

export interface CatharsisWave {
  waveId: string,
  catharsisIds: string[],
  cumulativeRelease: number,
  transformation: number,
}

export interface NarrativeCatharsisEngineState {
  catharses: Map<string, Catharsis>;
  waves: Map<string, CatharsisWave>;
  totalCatharses: number;
  totalWaves: number;
  averageRelease: number;
  averageTransformation: number;
  waveTransformation: number;
  catharsisMastery: number;
}

// Factory
export function createNarrativeCatharsisEngineState(): NarrativeCatharsisEngineState {
  return {
    catharses: new Map(),
    waves: new Map(),
    totalCatharses: 0,
    totalWaves: 0,
    averageRelease: 0.5,
    averageTransformation: 0.5,
    waveTransformation: 0.5,
    catharsisMastery: 0.5,
  };
}

// Add catharsis
export function addCatharsis(
  state: NarrativeCatharsisEngineState,
  catharsisId: string,
  type: CatharsisType,
  intensity: CatharsisIntensity,
  duration: CatharsisDuration,
  description: string,
  release: number,
  transformation: number,
  chapter: number
): NarrativeCatharsisEngineState {
  const catharsis: Catharsis = { catharsisId, type, intensity, duration, description, release, transformation, chapter };
  const catharses = new Map(state.catharses).set(catharsisId, catharsis);
  return recomputeCatharsis({ ...state, catharses, totalCatharses: catharses.size });
}

// Add wave
export function addCatharsisWave(
  state: NarrativeCatharsisEngineState,
  waveId: string,
  catharsisIds: string[]
): NarrativeCatharsisEngineState {
  const catharses = catharsisIds.map(id => state.catharses.get(id)).filter((c): c is Catharsis => c !== undefined);
  const cumulativeRelease = catharses.length === 0 ? 0
    : catharses.reduce((s, c) => s + c.release, 0) / catharses.length;
  const transformation = catharses.length === 0 ? 0
    : catharses.reduce((s, c) => s + c.transformation, 0) / catharses.length;
  const wave: CatharsisWave = { waveId, catharsisIds, cumulativeRelease, transformation };
  const waves = new Map(state.waves).set(waveId, wave);
  return recomputeCatharsis({ ...state, waves, totalWaves: waves.size });
}

// Get catharses by type
export function getCatharsesByType(state: NarrativeCatharsisEngineState, type: CatharsisType): Catharsis[] {
  return Array.from(state.catharses.values()).filter(c => c.type === type);
}

// Get catharsis report
export function getCatharsisReport(state: NarrativeCatharsisEngineState): {
  totalCatharses: number;
  totalWaves: number;
  averageRelease: number;
  averageTransformation: number;
  catharsisMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalCatharses === 0) recommendations.push('No catharses — add catharses');
  if (state.averageRelease < 0.5) recommendations.push('Low release — strengthen');
  if (state.catharsisMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalCatharses: state.totalCatharses,
    totalWaves: state.totalWaves,
    averageRelease: Math.round(state.averageRelease * 100) / 100,
    averageTransformation: Math.round(state.averageTransformation * 100) / 100,
    catharsisMastery: Math.round(state.catharsisMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCatharsis(state: NarrativeCatharsisEngineState): NarrativeCatharsisEngineState {
  const catharses = Array.from(state.catharses.values());
  const averageRelease = catharses.length === 0 ? 0.5
    : catharses.reduce((s, c) => s + c.release, 0) / catharses.length;
  const averageTransformation = catharses.length === 0 ? 0.5
    : catharses.reduce((s, c) => s + c.transformation, 0) / catharses.length;

  const waves = Array.from(state.waves.values());
  const waveTransformation = waves.length === 0 ? 0.5
    : waves.reduce((s, w) => s + w.transformation, 0) / waves.length;

  const catharsisMastery = (averageRelease * 0.4 + averageTransformation * 0.3 + waveTransformation * 0.3);

  return { ...state, averageRelease, averageTransformation, waveTransformation, catharsisMastery };
}

// Reset
export function resetNarrativeCatharsisEngineState(): NarrativeCatharsisEngineState {
  return createNarrativeCatharsisEngineState();
}