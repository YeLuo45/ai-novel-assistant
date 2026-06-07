/**
 * V1600 NarrativeStyleShadowEngine2 — Direction N Iter 28/30 (Round 5)
 */
export type StyleShadowType = 'literal' | 'figurative' | 'psycho' | 'moral' | 'transcendent' | 'infinite';
export type StyleShadowIntensity = 'subtle' | 'moderate' | 'deep' | 'overwhelming' | 'transcendent' | 'infinite';
export interface StyleShadowEntry { entryId: string; type: StyleShadowType; intensity: StyleShadowIntensity; description: string; darkness: number; chapter: number; }
export interface StyleShadowSide { sideId: string; entryIds: string[]; cumulativeDarkness: number; breadth: number; }
export interface NarrativeStyleShadow2EngineState { entries: Map<string, StyleShadowEntry>; sides: Map<string, StyleShadowSide>; totalEntries: number; totalSides: number; averageDarkness: number; shadowComplexity: number; shadowMastery: number; }
export function createNarrativeStyleShadow2EngineState(): NarrativeStyleShadow2EngineState { return { entries: new Map(), sides: new Map(), totalEntries: 0, totalSides: 0, averageDarkness: 0.5, shadowComplexity: 0.5, shadowMastery: 0.5 }; }
export function addStyleShadowEntry(state: NarrativeStyleShadow2EngineState, entryId: string, type: StyleShadowType, intensity: StyleShadowIntensity, description: string, darkness: number, chapter: number): NarrativeStyleShadow2EngineState {
  const entry: StyleShadowEntry = { entryId, type, intensity, description, darkness, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addStyleShadowSide(state: NarrativeStyleShadow2EngineState, sideId: string, entryIds: string[]): NarrativeStyleShadow2EngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is StyleShadowEntry => e !== undefined);
  const cumulativeDarkness = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.darkness, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 6);
  const side: StyleShadowSide = { sideId, entryIds, cumulativeDarkness, breadth };
  return recompute({ ...state, sides: new Map(state.sides).set(sideId, side), totalSides: state.sides.size + 1 });
}
export function getStyleShadowEntriesByType(state: NarrativeStyleShadow2EngineState, type: StyleShadowType): StyleShadowEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getStyleShadowReport(state: NarrativeStyleShadow2EngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add style shadow entries');
  if (state.averageDarkness < 0.5) recommendations.push('Low darkness — strengthen');
  if (state.shadowMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalSides: state.totalSides, averageDarkness: Math.round(state.averageDarkness * 100) / 100, shadowComplexity: Math.round(state.shadowComplexity * 100) / 100, shadowMastery: Math.round(state.shadowMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeStyleShadow2EngineState): NarrativeStyleShadow2EngineState {
  const entries = Array.from(state.entries.values());
  const averageDarkness = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.darkness, 0) / entries.length;
  const sides = Array.from(state.sides.values());
  const shadowComplexity = sides.length === 0 ? 0.5 : sides.reduce((s, sd) => s + sd.breadth, 0) / sides.length;
  return { ...state, averageDarkness, shadowComplexity, shadowMastery: averageDarkness * 0.5 + shadowComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeStyleShadow2EngineState(): NarrativeStyleShadow2EngineState { return createNarrativeStyleShadow2EngineState(); }