/**
 * V1870 NarrativeGenreWesternEngine — Direction S Iter 13/30 (Round 5)
 */
export type GenreWesternType = 'classic' | 'revisionist' | 'spaghetti' | 'neo_western' | 'space_western' | 'transcendent' | 'infinite';
export type GenreWesternLandscape = 'desert' | 'prairie' | 'mountain' | 'town' | 'frontier' | 'transcendent' | 'infinite';
export interface GenreWesternEntry { entryId: string; type: GenreWesternType; landscape: GenreWesternLandscape; description: string; resonance: number; chapter: number; }
export interface GenreWesternTrail { trailId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeGenreWesternEngineState { entries: Map<string, GenreWesternEntry>; trails: Map<string, GenreWesternTrail>; totalEntries: number; totalTrails: number; averageResonance: number; westernComplexity: number; westernMastery: number; }
export function createNarrativeGenreWesternEngineState(): NarrativeGenreWesternEngineState { return { entries: new Map(), trails: new Map(), totalEntries: 0, totalTrails: 0, averageResonance: 0.5, westernComplexity: 0.5, westernMastery: 0.5 }; }
export function addGenreWesternEntry(state: NarrativeGenreWesternEngineState, entryId: string, type: GenreWesternType, landscape: GenreWesternLandscape, description: string, resonance: number, chapter: number): NarrativeGenreWesternEngineState {
  const entry: GenreWesternEntry = { entryId, type, landscape, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addGenreWesternTrail(state: NarrativeGenreWesternEngineState, trailId: string, entryIds: string[]): NarrativeGenreWesternEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is GenreWesternEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const trail: GenreWesternTrail = { trailId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, trails: new Map(state.trails).set(trailId, trail), totalTrails: state.trails.size + 1 });
}
export function getGenreWesternEntriesByType(state: NarrativeGenreWesternEngineState, type: GenreWesternType): GenreWesternEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getGenreWesternReport(state: NarrativeGenreWesternEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add genre western entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.westernMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalTrails: state.totalTrails, averageResonance: Math.round(state.averageResonance * 100) / 100, westernComplexity: Math.round(state.westernComplexity * 100) / 100, westernMastery: Math.round(state.westernMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeGenreWesternEngineState): NarrativeGenreWesternEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const trails = Array.from(state.trails.values());
  const westernComplexity = trails.length === 0 ? 0.5 : trails.reduce((s, t) => s + t.breadth, 0) / trails.length;
  return { ...state, averageResonance, westernComplexity, westernMastery: averageResonance * 0.5 + westernComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeGenreWesternEngineState(): NarrativeGenreWesternEngineState { return createNarrativeGenreWesternEngineState(); }