/**
 * V1160 NarrativeImageryEngine — Direction F Iter 8/20 (Round 5)
 * Imagery engine: vivid imagery in narrative
 * Sources: ruflo imagery + nanobot + thunderbolt
 */

export type ImageryType = 'visual' | 'auditory' | 'tactile' | 'olfactory' | 'gustatory' | 'kinesthetic';
export type ImageryVividness = 'pale' | 'moderate' | 'vivid' | 'striking' | 'incandescent';
export type ImageryOriginality = 'cliche' | 'common' | 'fresh' | 'novel' | 'visionary';

export interface Imagery {
  imageryId: string;
  type: ImageryType;
  vividness: ImageryVividness;
  originality: ImageryOriginality;
  description: string;
  intensity: number;
  memorability: number;
  chapter: number;
}

export interface ImageryPalette {
  paletteId: string,
  imageryIds: string[],
  cumulativeIntensity: number,
  diversity: number,
}

export interface NarrativeImageryEngineState {
  imageries: Map<string, Imagery>;
  palettes: Map<string, ImageryPalette>;
  totalImageries: number;
  totalPalettes: number;
  averageIntensity: number;
  averageMemorability: number;
  paletteDiversity: number;
  imageryMastery: number;
}

// Factory
export function createNarrativeImageryEngineState(): NarrativeImageryEngineState {
  return {
    imageries: new Map(),
    palettes: new Map(),
    totalImageries: 0,
    totalPalettes: 0,
    averageIntensity: 0.5,
    averageMemorability: 0.5,
    paletteDiversity: 0.5,
    imageryMastery: 0.5,
  };
}

// Add imagery
export function addImagery(
  state: NarrativeImageryEngineState,
  imageryId: string,
  type: ImageryType,
  vividness: ImageryVividness,
  originality: ImageryOriginality,
  description: string,
  intensity: number,
  memorability: number,
  chapter: number
): NarrativeImageryEngineState {
  const imagery: Imagery = { imageryId, type, vividness, originality, description, intensity, memorability, chapter };
  const imageries = new Map(state.imageries).set(imageryId, imagery);
  return recomputeImagery({ ...state, imageries, totalImageries: imageries.size });
}

// Add palette
export function addImageryPalette(
  state: NarrativeImageryEngineState,
  paletteId: string,
  imageryIds: string[]
): NarrativeImageryEngineState {
  const imageries = imageryIds.map(id => state.imageries.get(id)).filter((i): i is Imagery => i !== undefined);
  const cumulativeIntensity = imageries.length === 0 ? 0
    : imageries.reduce((s, i) => s + i.intensity, 0) / imageries.length;
  const typeSet = new Set(imageries.map(i => i.type));
  const diversity = Math.min(1, typeSet.size / 6);
  const palette: ImageryPalette = { paletteId, imageryIds, cumulativeIntensity, diversity };
  const palettes = new Map(state.palettes).set(paletteId, palette);
  return recomputeImagery({ ...state, palettes, totalPalettes: palettes.size });
}

// Get imageries by type
export function getImageriesByType(state: NarrativeImageryEngineState, type: ImageryType): Imagery[] {
  return Array.from(state.imageries.values()).filter(i => i.type === type);
}

// Get imagery report
export function getImageryReport(state: NarrativeImageryEngineState): {
  totalImageries: number;
  totalPalettes: number;
  averageIntensity: number;
  averageMemorability: number;
  imageryMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalImageries === 0) recommendations.push('No imageries — add imagery');
  if (state.averageIntensity < 0.5) recommendations.push('Low intensity — strengthen');
  if (state.imageryMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalImageries: state.totalImageries,
    totalPalettes: state.totalPalettes,
    averageIntensity: Math.round(state.averageIntensity * 100) / 100,
    averageMemorability: Math.round(state.averageMemorability * 100) / 100,
    imageryMastery: Math.round(state.imageryMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeImagery(state: NarrativeImageryEngineState): NarrativeImageryEngineState {
  const imageries = Array.from(state.imageries.values());
  const averageIntensity = imageries.length === 0 ? 0.5
    : imageries.reduce((s, i) => s + i.intensity, 0) / imageries.length;
  const averageMemorability = imageries.length === 0 ? 0.5
    : imageries.reduce((s, i) => s + i.memorability, 0) / imageries.length;

  const palettes = Array.from(state.palettes.values());
  const paletteDiversity = palettes.length === 0 ? 0.5
    : palettes.reduce((s, p) => s + p.diversity, 0) / palettes.length;

  const imageryMastery = (averageIntensity * 0.4 + averageMemorability * 0.3 + paletteDiversity * 0.3);

  return { ...state, averageIntensity, averageMemorability, paletteDiversity, imageryMastery };
}

// Reset
export function resetNarrativeImageryEngineState(): NarrativeImageryEngineState {
  return createNarrativeImageryEngineState();
}