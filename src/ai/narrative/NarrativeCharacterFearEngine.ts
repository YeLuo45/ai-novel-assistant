/**
 * V1396 NarrativeCharacterFearEngine — Direction K Iter 16/30 (Round 5)
 * Character fear engine: fears of character
 * Sources: nanobot fear + thunderbolt + ruflo
 */

export type CharacterFearType = 'physical' | 'social' | 'existential' | 'spiritual' | 'psychological' | 'cosmic' | 'transcendent';
export type CharacterFearIntensity = 'mild' | 'moderate' | 'strong' | 'intense' | 'paralyzing' | 'absolute' | 'transcendent';
export type CharacterFearOrigin = 'experience' | 'imagined' | 'inherited' | 'learned' | 'intuited' | 'primordial' | 'transcendent';

export interface CharacterFearEntry {
  entryId: string;
  type: CharacterFearType;
  intensity: CharacterFearIntensity;
  origin: CharacterFearOrigin;
  description: string;
  dread: number;
  paralysis: number;
  chapter: number;
}

export interface CharacterFearShadow {
  shadowId: string,
  entryIds: string[],
  cumulativeDread: number,
  depth: number,
}

export interface NarrativeCharacterFearEngineState {
  entries: Map<string, CharacterFearEntry>;
  shadows: Map<string, CharacterFearShadow>;
  totalEntries: number;
  totalShadows: number;
  averageDread: number;
  averageParalysis: number;
  shadowDepth: number;
  characterFearMastery: number;
}

export function createNarrativeCharacterFearEngineState(): NarrativeCharacterFearEngineState {
  return { entries: new Map(), shadows: new Map(), totalEntries: 0, totalShadows: 0, averageDread: 0.5, averageParalysis: 0.5, shadowDepth: 0.5, characterFearMastery: 0.5 };
}

export function addCharacterFearEntry(state: NarrativeCharacterFearEngineState, entryId: string, type: CharacterFearType, intensity: CharacterFearIntensity, origin: CharacterFearOrigin, description: string, dread: number, paralysis: number, chapter: number): NarrativeCharacterFearEngineState {
  const entry: CharacterFearEntry = { entryId, type, intensity, origin, description, dread, paralysis, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}

export function addCharacterFearShadow(state: NarrativeCharacterFearEngineState, shadowId: string, entryIds: string[]): NarrativeCharacterFearEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterFearEntry => e !== undefined);
  const cumulativeDread = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.dread, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const depth = Math.min(1, typeSet.size / 7);
  const shadow: CharacterFearShadow = { shadowId, entryIds, cumulativeDread, depth };
  return recompute({ ...state, shadows: new Map(state.shadows).set(shadowId, shadow), totalShadows: state.shadows.size + 1 });
}

export function getCharacterFearEntriesByType(state: NarrativeCharacterFearEngineState, type: CharacterFearType): CharacterFearEntry[] {
  return Array.from(state.entries.values()).filter(e => e.type === type);
}

export function getCharacterFearReport(state: NarrativeCharacterFearEngineState): { totalEntries: number; totalShadows: number; averageDread: number; averageParalysis: number; characterFearMastery: number; recommendations: string[] } {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character fear entries');
  if (state.averageDread < 0.5) recommendations.push('Low dread — strengthen');
  if (state.characterFearMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalShadows: state.totalShadows, averageDread: Math.round(state.averageDread * 100) / 100, averageParalysis: Math.round(state.averageParalysis * 100) / 100, characterFearMastery: Math.round(state.characterFearMastery * 100) / 100, recommendations };
}

function recompute(state: NarrativeCharacterFearEngineState): NarrativeCharacterFearEngineState {
  const entries = Array.from(state.entries.values());
  const averageDread = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.dread, 0) / entries.length;
  const averageParalysis = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.paralysis, 0) / entries.length;
  const shadows = Array.from(state.shadows.values());
  const shadowDepth = shadows.length === 0 ? 0.5 : shadows.reduce((s, sh) => s + sh.depth, 0) / shadows.length;
  const characterFearMastery = (averageDread * 0.4 + averageParalysis * 0.3 + shadowDepth * 0.3);
  return { ...state, averageDread, averageParalysis, shadowDepth, characterFearMastery };
}

export function resetNarrativeCharacterFearEngineState(): NarrativeCharacterFearEngineState {
  return createNarrativeCharacterFearEngineState();
}