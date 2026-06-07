/**
 * V1856 NarrativeGenreSpeculativeEngine — Direction S Iter 6/30 (Round 5)
 */
export type GenreSpeculativeType = 'science_fiction' | 'fantasy' | 'horror' | 'alternate_history' | 'magical_realism' | 'transcendent' | 'infinite';
export type GenreSpeculativePremise = 'what_if' | 'extrapolation' | 'analogy' | 'warning' | 'transcendent' | 'infinite';
export interface GenreSpeculativeEntry { entryId: string; type: GenreSpeculativeType; premise: GenreSpeculativePremise; description: string; resonance: number; chapter: number; }
export interface GenreSpeculativeWorld { worldId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeGenreSpeculativeEngineState { entries: Map<string, GenreSpeculativeEntry>; worlds: Map<string, GenreSpeculativeWorld>; totalEntries: number; totalWorlds: number; averageResonance: number; speculativeComplexity: number; speculativeMastery: number; }
export function createNarrativeGenreSpeculativeEngineState(): NarrativeGenreSpeculativeEngineState { return { entries: new Map(), worlds: new Map(), totalEntries: 0, totalWorlds: 0, averageResonance: 0.5, speculativeComplexity: 0.5, speculativeMastery: 0.5 }; }
export function addGenreSpeculativeEntry(state: NarrativeGenreSpeculativeEngineState, entryId: string, type: GenreSpeculativeType, premise: GenreSpeculativePremise, description: string, resonance: number, chapter: number): NarrativeGenreSpeculativeEngineState {
  const entry: GenreSpeculativeEntry = { entryId, type, premise, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addGenreSpeculativeWorld(state: NarrativeGenreSpeculativeEngineState, worldId: string, entryIds: string[]): NarrativeGenreSpeculativeEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is GenreSpeculativeEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const world: GenreSpeculativeWorld = { worldId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, worlds: new Map(state.worlds).set(worldId, world), totalWorlds: state.worlds.size + 1 });
}
export function getGenreSpeculativeEntriesByType(state: NarrativeGenreSpeculativeEngineState, type: GenreSpeculativeType): GenreSpeculativeEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getGenreSpeculativeReport(state: NarrativeGenreSpeculativeEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add genre speculative entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.speculativeMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalWorlds: state.totalWorlds, averageResonance: Math.round(state.averageResonance * 100) / 100, speculativeComplexity: Math.round(state.speculativeComplexity * 100) / 100, speculativeMastery: Math.round(state.speculativeMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeGenreSpeculativeEngineState): NarrativeGenreSpeculativeEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const worlds = Array.from(state.worlds.values());
  const speculativeComplexity = worlds.length === 0 ? 0.5 : worlds.reduce((s, w) => s + w.breadth, 0) / worlds.length;
  return { ...state, averageResonance, speculativeComplexity, speculativeMastery: averageResonance * 0.5 + speculativeComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeGenreSpeculativeEngineState(): NarrativeGenreSpeculativeEngineState { return createNarrativeGenreSpeculativeEngineState(); }