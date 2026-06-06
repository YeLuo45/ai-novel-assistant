/**
 * V1164 NarrativeSoundPatternEngine — Direction F Iter 10/20 (Round 5)
 * Sound pattern engine: sound patterns in narrative prose
 * Sources: thunderbolt sound + nanobot + ruflo
 */

export type SoundPatternType = 'alliteration' | 'assonance' | 'consonance' | 'sibilance' | 'rhythm' | 'meter';
export type SoundPatternStrength = 'subtle' | 'moderate' | 'pronounced' | 'deliberate' | 'dominant';
export type SoundPatternFlow = 'rough' | 'uneven' | 'smooth' | 'melodic' | 'symphonic';

export interface SoundPattern {
  patternId: string;
  type: SoundPatternType;
  strength: SoundPatternStrength;
  flow: SoundPatternFlow;
  description: string;
  resonance: number;
  effect: number;
  chapter: number;
}

export interface SoundPatternLayer {
  layerId: string,
  patternIds: string[],
  cumulativeResonance: number,
  depth: number,
}

export interface NarrativeSoundPatternEngineState {
  patterns: Map<string, SoundPattern>;
  layers: Map<string, SoundPatternLayer>;
  totalPatterns: number;
  totalLayers: number;
  averageResonance: number;
  averageEffect: number;
  layerDepth: number;
  soundPatternMastery: number;
}

// Factory
export function createNarrativeSoundPatternEngineState(): NarrativeSoundPatternEngineState {
  return {
    patterns: new Map(),
    layers: new Map(),
    totalPatterns: 0,
    totalLayers: 0,
    averageResonance: 0.5,
    averageEffect: 0.5,
    layerDepth: 0.5,
    soundPatternMastery: 0.5,
  };
}

// Add pattern
export function addSoundPattern(
  state: NarrativeSoundPatternEngineState,
  patternId: string,
  type: SoundPatternType,
  strength: SoundPatternStrength,
  flow: SoundPatternFlow,
  description: string,
  resonance: number,
  effect: number,
  chapter: number
): NarrativeSoundPatternEngineState {
  const pattern: SoundPattern = { patternId, type, strength, flow, description, resonance, effect, chapter };
  const patterns = new Map(state.patterns).set(patternId, pattern);
  return recomputeSoundPattern({ ...state, patterns, totalPatterns: patterns.size });
}

// Add layer
export function addSoundPatternLayer(
  state: NarrativeSoundPatternEngineState,
  layerId: string,
  patternIds: string[]
): NarrativeSoundPatternEngineState {
  const patterns = patternIds.map(id => state.patterns.get(id)).filter((p): p is SoundPattern => p !== undefined);
  const cumulativeResonance = patterns.length === 0 ? 0
    : patterns.reduce((s, p) => s + p.resonance, 0) / patterns.length;
  const typeSet = new Set(patterns.map(p => p.type));
  const depth = Math.min(1, typeSet.size / 6);
  const layer: SoundPatternLayer = { layerId, patternIds, cumulativeResonance, depth };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputeSoundPattern({ ...state, layers, totalLayers: layers.size });
}

// Get patterns by type
export function getSoundPatternsByType(state: NarrativeSoundPatternEngineState, type: SoundPatternType): SoundPattern[] {
  return Array.from(state.patterns.values()).filter(p => p.type === type);
}

// Get sound pattern report
export function getSoundPatternReport(state: NarrativeSoundPatternEngineState): {
  totalPatterns: number;
  totalLayers: number;
  averageResonance: number;
  averageEffect: number;
  soundPatternMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalPatterns === 0) recommendations.push('No patterns — add sound patterns');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.soundPatternMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalPatterns: state.totalPatterns,
    totalLayers: state.totalLayers,
    averageResonance: Math.round(state.averageResonance * 100) / 100,
    averageEffect: Math.round(state.averageEffect * 100) / 100,
    soundPatternMastery: Math.round(state.soundPatternMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSoundPattern(state: NarrativeSoundPatternEngineState): NarrativeSoundPatternEngineState {
  const patterns = Array.from(state.patterns.values());
  const averageResonance = patterns.length === 0 ? 0.5
    : patterns.reduce((s, p) => s + p.resonance, 0) / patterns.length;
  const averageEffect = patterns.length === 0 ? 0.5
    : patterns.reduce((s, p) => s + p.effect, 0) / patterns.length;

  const layers = Array.from(state.layers.values());
  const layerDepth = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.depth, 0) / layers.length;

  const soundPatternMastery = (averageResonance * 0.4 + averageEffect * 0.3 + layerDepth * 0.3);

  return { ...state, averageResonance, averageEffect, layerDepth, soundPatternMastery };
}

// Reset
export function resetNarrativeSoundPatternEngineState(): NarrativeSoundPatternEngineState {
  return createNarrativeSoundPatternEngineState();
}