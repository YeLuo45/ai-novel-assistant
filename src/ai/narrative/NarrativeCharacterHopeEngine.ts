/**
 * V1398 NarrativeCharacterHopeEngine — Direction K Iter 17/30 (Round 5)
 * Character hope engine: hopes of character
 * Sources: thunderbolt hope + nanobot + ruflo
 */

export type CharacterHopeType = 'personal' | 'relational' | 'social' | 'idealistic' | 'spiritual' | 'transcendent' | 'absolute';
export type CharacterHopeBrightness = 'dim' | 'flickering' | 'steady' | 'bright' | 'radiant' | 'blazing' | 'transcendent';
export type CharacterHopeGrounding = 'abstract' | 'vague' | 'imagined' | 'possible' | 'probable' | 'inevitable' | 'transcendent';

export interface CharacterHopeEntry {
  entryId: string;
  type: CharacterHopeType;
  brightness: CharacterHopeBrightness;
  grounding: CharacterHopeGrounding;
  description: string;
  inspiration: number;
  resilience: number;
  chapter: number;
}

export interface CharacterHopeVision {
  visionId: string,
  entryIds: string[],
  cumulativeInspiration: number,
  clarity: number,
}

export interface NarrativeCharacterHopeEngineState {
  entries: Map<string, CharacterHopeEntry>;
  visions: Map<string, CharacterHopeVision>;
  totalEntries: number;
  totalVisions: number;
  averageInspiration: number;
  averageResilience: number;
  visionClarity: number;
  characterHopeMastery: number;
}

export function createNarrativeCharacterHopeEngineState(): NarrativeCharacterHopeEngineState {
  return { entries: new Map(), visions: new Map(), totalEntries: 0, totalVisions: 0, averageInspiration: 0.5, averageResilience: 0.5, visionClarity: 0.5, characterHopeMastery: 0.5 };
}

export function addCharacterHopeEntry(state: NarrativeCharacterHopeEngineState, entryId: string, type: CharacterHopeType, brightness: CharacterHopeBrightness, grounding: CharacterHopeGrounding, description: string, inspiration: number, resilience: number, chapter: number): NarrativeCharacterHopeEngineState {
  const entry: CharacterHopeEntry = { entryId, type, brightness, grounding, description, inspiration, resilience, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}

export function addCharacterHopeVision(state: NarrativeCharacterHopeEngineState, visionId: string, entryIds: string[]): NarrativeCharacterHopeEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterHopeEntry => e !== undefined);
  const cumulativeInspiration = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.inspiration, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const clarity = Math.min(1, typeSet.size / 7);
  const vision: CharacterHopeVision = { visionId, entryIds, cumulativeInspiration, clarity };
  return recompute({ ...state, visions: new Map(state.visions).set(visionId, vision), totalVisions: state.visions.size + 1 });
}

export function getCharacterHopeEntriesByType(state: NarrativeCharacterHopeEngineState, type: CharacterHopeType): CharacterHopeEntry[] {
  return Array.from(state.entries.values()).filter(e => e.type === type);
}

export function getCharacterHopeReport(state: NarrativeCharacterHopeEngineState): { totalEntries: number; totalVisions: number; averageInspiration: number; averageResilience: number; characterHopeMastery: number; recommendations: string[] } {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character hope entries');
  if (state.averageInspiration < 0.5) recommendations.push('Low inspiration — strengthen');
  if (state.characterHopeMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalVisions: state.totalVisions, averageInspiration: Math.round(state.averageInspiration * 100) / 100, averageResilience: Math.round(state.averageResilience * 100) / 100, characterHopeMastery: Math.round(state.characterHopeMastery * 100) / 100, recommendations };
}

function recompute(state: NarrativeCharacterHopeEngineState): NarrativeCharacterHopeEngineState {
  const entries = Array.from(state.entries.values());
  const averageInspiration = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.inspiration, 0) / entries.length;
  const averageResilience = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resilience, 0) / entries.length;
  const visions = Array.from(state.visions.values());
  const visionClarity = visions.length === 0 ? 0.5 : visions.reduce((s, v) => s + v.clarity, 0) / visions.length;
  const characterHopeMastery = (averageInspiration * 0.4 + averageResilience * 0.3 + visionClarity * 0.3);
  return { ...state, averageInspiration, averageResilience, visionClarity, characterHopeMastery };
}

export function resetNarrativeCharacterHopeEngineState(): NarrativeCharacterHopeEngineState {
  return createNarrativeCharacterHopeEngineState();
}