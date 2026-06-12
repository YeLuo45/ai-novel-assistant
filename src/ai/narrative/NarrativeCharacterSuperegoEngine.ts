/**
 * V1408 NarrativeCharacterSuperegoEngine — Direction K Iter 22/30 (Round 5)
 * Character superego engine: moral conscience of character
 * Sources: nanobot superego + thunderbolt + ruflo
 */

export type CharacterSuperegoSource = 'parents' | 'society' | 'religion' | 'ideals' | 'experience' | 'transcendent' | 'absolute';
export type CharacterSuperegoStrictness = 'lax' | 'lenient' | 'moderate' | 'strict' | 'severe' | 'absolute' | 'transcendent';
export type CharacterSuperegoExpression = 'subtle' | 'present' | 'vocal' | 'commanding' | 'crushing' | 'absolute' | 'transcendent';

export interface CharacterSuperegoEntry {
  entryId: string;
  source: CharacterSuperegoSource;
  strictness: CharacterSuperegoStrictness;
  expression: CharacterSuperegoExpression;
  description: string;
  guidance: number;
  pressure: number;
  chapter: number;
}

export interface CharacterSuperegoLayer {
  layerId: string,
  entryIds: string[],
  cumulativeGuidance: number,
  depth: number,
}

export interface NarrativeCharacterSuperegoEngineState {
  entries: Map<string, CharacterSuperegoEntry>;
  layers: Map<string, CharacterSuperegoLayer>;
  totalEntries: number;
  totalLayers: number;
  averageGuidance: number;
  averagePressure: number;
  layerDepth: number;
  characterSuperegoMastery: number;
}

export function createNarrativeCharacterSuperegoEngineState(): NarrativeCharacterSuperegoEngineState {
  return { entries: new Map(), layers: new Map(), totalEntries: 0, totalLayers: 0, averageGuidance: 0.5, averagePressure: 0.5, layerDepth: 0.5, characterSuperegoMastery: 0.5 };
}

export function addCharacterSuperegoEntry(state: NarrativeCharacterSuperegoEngineState, entryId: string, source: CharacterSuperegoSource, strictness: CharacterSuperegoStrictness, expression: CharacterSuperegoExpression, description: string, guidance: number, pressure: number, chapter: number): NarrativeCharacterSuperegoEngineState {
  const entry: CharacterSuperegoEntry = { entryId, source, strictness, expression, description, guidance, pressure, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}

export function addCharacterSuperegoLayer(state: NarrativeCharacterSuperegoEngineState, layerId: string, entryIds: string[]): NarrativeCharacterSuperegoEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterSuperegoEntry => e !== undefined);
  const cumulativeGuidance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.guidance, 0) / entries.length;
  const sourceSet = new Set(entries.map(e => e.source));
  const depth = Math.min(1, sourceSet.size / 7);
  const layer: CharacterSuperegoLayer = { layerId, entryIds, cumulativeGuidance, depth };
  return recompute({ ...state, layers: new Map(state.layers).set(layerId, layer), totalLayers: state.layers.size + 1 });
}

export function getCharacterSuperegoEntriesBySource(state: NarrativeCharacterSuperegoEngineState, source: CharacterSuperegoSource): CharacterSuperegoEntry[] {
  return Array.from(state.entries.values()).filter(e => e.source === source);
}

export function getCharacterSuperegoReport(state: NarrativeCharacterSuperegoEngineState): { totalEntries: number; totalLayers: number; averageGuidance: number; averagePressure: number; characterSuperegoMastery: number; recommendations: string[] } {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character superego entries');
  if (state.averageGuidance < 0.5) recommendations.push('Low guidance — strengthen');
  if (state.characterSuperegoMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalLayers: state.totalLayers, averageGuidance: Math.round(state.averageGuidance * 100) / 100, averagePressure: Math.round(state.averagePressure * 100) / 100, characterSuperegoMastery: Math.round(state.characterSuperegoMastery * 100) / 100, recommendations };
}

function recompute(state: NarrativeCharacterSuperegoEngineState): NarrativeCharacterSuperegoEngineState {
  const entries = Array.from(state.entries.values());
  const averageGuidance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.guidance, 0) / entries.length;
  const averagePressure = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.pressure, 0) / entries.length;
  const layers = Array.from(state.layers.values());
  const layerDepth = layers.length === 0 ? 0.5 : layers.reduce((s, l) => s + l.depth, 0) / layers.length;
  const characterSuperegoMastery = (averageGuidance * 0.4 + averagePressure * 0.3 + layerDepth * 0.3);
  return { ...state, averageGuidance, averagePressure, layerDepth, characterSuperegoMastery };
}

export function resetNarrativeCharacterSuperegoEngineState(): NarrativeCharacterSuperegoEngineState {
  return createNarrativeCharacterSuperegoEngineState();
}