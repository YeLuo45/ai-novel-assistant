/**
 * V1126 NarrativeAbsorptionEngine — Direction E Iter 11/20 (Round 5)
 * Absorption engine: reader's absorption in narrative
 * Sources: ruflo absorption + nanobot + thunderbolt
 */

export type AbsorptionType = 'attentional' | 'imaginative' | 'emotional' | 'cognitive' | 'sensory' | 'embodied';
export type AbsorptionDepth = 'distracted' | 'shallow' | 'medium' | 'deep' | 'total';
export type AbsorptionTrigger = 'opening' | 'character' | 'scene' | 'plot' | 'language' | 'theme';

export interface Absorption {
  absorptionId: string;
  type: AbsorptionType;
  depth: AbsorptionDepth;
  trigger: AbsorptionTrigger;
  description: string;
  focus: number;
  presence: number;
  chapter: number;
}

export interface AbsorptionWave {
  waveId: string,
  absorptionIds: string[],
  cumulativeFocus: number,
  intensity: number,
}

export interface NarrativeAbsorptionEngineState {
  absorptions: Map<string, Absorption>;
  waves: Map<string, AbsorptionWave>;
  totalAbsorptions: number;
  totalWaves: number;
  averageFocus: number;
  averagePresence: number;
  waveIntensity: number;
  absorptionMastery: number;
}

// Factory
export function createNarrativeAbsorptionEngineState(): NarrativeAbsorptionEngineState {
  return {
    absorptions: new Map(),
    waves: new Map(),
    totalAbsorptions: 0,
    totalWaves: 0,
    averageFocus: 0.5,
    averagePresence: 0.5,
    waveIntensity: 0.5,
    absorptionMastery: 0.5,
  };
}

// Add absorption
export function addAbsorption(
  state: NarrativeAbsorptionEngineState,
  absorptionId: string,
  type: AbsorptionType,
  depth: AbsorptionDepth,
  trigger: AbsorptionTrigger,
  description: string,
  focus: number,
  presence: number,
  chapter: number
): NarrativeAbsorptionEngineState {
  const absorption: Absorption = { absorptionId, type, depth, trigger, description, focus, presence, chapter };
  const absorptions = new Map(state.absorptions).set(absorptionId, absorption);
  return recomputeAbsorption({ ...state, absorptions, totalAbsorptions: absorptions.size });
}

// Add wave
export function addAbsorptionWave(
  state: NarrativeAbsorptionEngineState,
  waveId: string,
  absorptionIds: string[]
): NarrativeAbsorptionEngineState {
  const absorptions = absorptionIds.map(id => state.absorptions.get(id)).filter((a): a is Absorption => a !== undefined);
  const cumulativeFocus = absorptions.length === 0 ? 0
    : absorptions.reduce((s, a) => s + a.focus, 0) / absorptions.length;
  const intensity = absorptions.length === 0 ? 0.5
    : absorptions.reduce((s, a) => s + (a.depth === 'total' ? 1 : a.depth === 'deep' ? 0.85 : a.depth === 'medium' ? 0.7 : a.depth === 'shallow' ? 0.5 : 0.3), 0) / absorptions.length;
  const wave: AbsorptionWave = { waveId, absorptionIds, cumulativeFocus, intensity };
  const waves = new Map(state.waves).set(waveId, wave);
  return recomputeAbsorption({ ...state, waves, totalWaves: waves.size });
}

// Get absorptions by type
export function getAbsorptionsByType(state: NarrativeAbsorptionEngineState, type: AbsorptionType): Absorption[] {
  return Array.from(state.absorptions.values()).filter(a => a.type === type);
}

// Get absorption report
export function getAbsorptionReport(state: NarrativeAbsorptionEngineState): {
  totalAbsorptions: number;
  totalWaves: number;
  averageFocus: number;
  averagePresence: number;
  absorptionMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalAbsorptions === 0) recommendations.push('No absorptions — add absorptions');
  if (state.averageFocus < 0.5) recommendations.push('Low focus — strengthen');
  if (state.absorptionMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalAbsorptions: state.totalAbsorptions,
    totalWaves: state.totalWaves,
    averageFocus: Math.round(state.averageFocus * 100) / 100,
    averagePresence: Math.round(state.averagePresence * 100) / 100,
    absorptionMastery: Math.round(state.absorptionMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAbsorption(state: NarrativeAbsorptionEngineState): NarrativeAbsorptionEngineState {
  const absorptions = Array.from(state.absorptions.values());
  const averageFocus = absorptions.length === 0 ? 0.5
    : absorptions.reduce((s, a) => s + a.focus, 0) / absorptions.length;
  const averagePresence = absorptions.length === 0 ? 0.5
    : absorptions.reduce((s, a) => s + a.presence, 0) / absorptions.length;

  const waves = Array.from(state.waves.values());
  const waveIntensity = waves.length === 0 ? 0.5
    : waves.reduce((s, w) => s + w.intensity, 0) / waves.length;

  const absorptionMastery = (averageFocus * 0.4 + averagePresence * 0.3 + waveIntensity * 0.3);

  return { ...state, averageFocus, averagePresence, waveIntensity, absorptionMastery };
}

// Reset
export function resetNarrativeAbsorptionEngineState(): NarrativeAbsorptionEngineState {
  return createNarrativeAbsorptionEngineState();
}