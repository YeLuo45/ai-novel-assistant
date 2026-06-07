/**
 * V1376 NarrativeCharacterTransformationEngine — Direction K Iter 6/30 (Round 5)
 * Character transformation engine: transformation arc of character
 * Sources: ruflo transformation + nanobot + thunderbolt
 */

export type CharacterTransformationType = 'physical' | 'mental' | 'emotional' | 'moral' | 'spiritual' | 'social' | 'transcendent';
export type CharacterTransformationMagnitude = 'subtle' | 'noticeable' | 'significant' | 'dramatic' | 'radical' | 'absolute' | 'transcendent';
export type CharacterTransformationCatalyst = 'experience' | 'relationship' | 'revelation' | 'trauma' | 'choice' | 'grace' | 'transcendent';

export interface CharacterTransformationEntry {
  entryId: string;
  type: CharacterTransformationType;
  magnitude: CharacterTransformationMagnitude;
  catalyst: CharacterTransformationCatalyst;
  description: string;
  authenticity: number;
  impact: number;
  chapter: number;
}

export interface CharacterTransformationArc {
  arcId: string,
  entryIds: string[],
  cumulativeAuthenticity: number,
  growth: number,
}

export interface NarrativeCharacterTransformationEngineState {
  entries: Map<string, CharacterTransformationEntry>;
  arcs: Map<string, CharacterTransformationArc>;
  totalEntries: number;
  totalArcs: number;
  averageAuthenticity: number;
  averageImpact: number;
  arcGrowth: number;
  characterTransformationMastery: number;
}

// Factory
export function createNarrativeCharacterTransformationEngineState(): NarrativeCharacterTransformationEngineState {
  return {
    entries: new Map(),
    arcs: new Map(),
    totalEntries: 0,
    totalArcs: 0,
    averageAuthenticity: 0.5,
    averageImpact: 0.5,
    arcGrowth: 0.5,
    characterTransformationMastery: 0.5,
  };
}

// Add entry
export function addCharacterTransformationEntry(
  state: NarrativeCharacterTransformationEngineState,
  entryId: string,
  type: CharacterTransformationType,
  magnitude: CharacterTransformationMagnitude,
  catalyst: CharacterTransformationCatalyst,
  description: string,
  authenticity: number,
  impact: number,
  chapter: number
): NarrativeCharacterTransformationEngineState {
  const entry: CharacterTransformationEntry = { entryId, type, magnitude, catalyst, description, authenticity, impact, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeCharacterTransformation({ ...state, entries, totalEntries: entries.size });
}

// Add arc
export function addCharacterTransformationArc(
  state: NarrativeCharacterTransformationEngineState,
  arcId: string,
  entryIds: string[]
): NarrativeCharacterTransformationEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterTransformationEntry => e !== undefined);
  const cumulativeAuthenticity = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.authenticity, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const growth = Math.min(1, typeSet.size / 7);
  const arc: CharacterTransformationArc = { arcId, entryIds, cumulativeAuthenticity, growth };
  const arcs = new Map(state.arcs).set(arcId, arc);
  return recomputeCharacterTransformation({ ...state, arcs, totalArcs: arcs.size });
}

// Get entries by type
export function getCharacterTransformationEntriesByType(state: NarrativeCharacterTransformationEngineState, type: CharacterTransformationType): CharacterTransformationEntry[] {
  return Array.from(state.entries.values()).filter(e => e.type === type);
}

// Get character transformation report
export function getCharacterTransformationReport(state: NarrativeCharacterTransformationEngineState): {
  totalEntries: number;
  totalArcs: number;
  averageAuthenticity: number;
  averageImpact: number;
  characterTransformationMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character transformation entries');
  if (state.averageAuthenticity < 0.5) recommendations.push('Low authenticity — strengthen');
  if (state.characterTransformationMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalArcs: state.totalArcs,
    averageAuthenticity: Math.round(state.averageAuthenticity * 100) / 100,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    characterTransformationMastery: Math.round(state.characterTransformationMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCharacterTransformation(state: NarrativeCharacterTransformationEngineState): NarrativeCharacterTransformationEngineState {
  const entries = Array.from(state.entries.values());
  const averageAuthenticity = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.authenticity, 0) / entries.length;
  const averageImpact = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.impact, 0) / entries.length;

  const arcs = Array.from(state.arcs.values());
  const arcGrowth = arcs.length === 0 ? 0.5
    : arcs.reduce((s, a) => s + a.growth, 0) / arcs.length;

  const characterTransformationMastery = (averageAuthenticity * 0.4 + averageImpact * 0.3 + arcGrowth * 0.3);

  return { ...state, averageAuthenticity, averageImpact, arcGrowth, characterTransformationMastery };
}

// Reset
export function resetNarrativeCharacterTransformationEngineState(): NarrativeCharacterTransformationEngineState {
  return createNarrativeCharacterTransformationEngineState();
}