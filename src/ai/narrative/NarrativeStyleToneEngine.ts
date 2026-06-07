/**
 * V1548 NarrativeStyleToneEngine — Direction N Iter 2/30 (Round 5)
 */
export type StyleToneType = 'serious' | 'playful' | 'ironic' | 'sardonic' | 'wistful' | 'transcendent' | 'infinite';
export type StyleToneRange = 'monotone' | 'narrow' | 'moderate' | 'wide' | 'transcendent' | 'infinite';
export interface StyleToneEntry { entryId: string; type: StyleToneType; range: StyleToneRange; description: string; effect: number; chapter: number; }
export interface StyleToneSet { setId: string; entryIds: string[]; cumulativeEffect: number; breadth: number; }
export interface NarrativeStyleToneEngineState { entries: Map<string, StyleToneEntry>; sets: Map<string, StyleToneSet>; totalEntries: number; totalSets: number; averageEffect: number; toneComplexity: number; toneMastery: number; }
export function createNarrativeStyleToneEngineState(): NarrativeStyleToneEngineState { return { entries: new Map(), sets: new Map(), totalEntries: 0, totalSets: 0, averageEffect: 0.5, toneComplexity: 0.5, toneMastery: 0.5 }; }
export function addStyleToneEntry(state: NarrativeStyleToneEngineState, entryId: string, type: StyleToneType, range: StyleToneRange, description: string, effect: number, chapter: number): NarrativeStyleToneEngineState {
  const entry: StyleToneEntry = { entryId, type, range, description, effect, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addStyleToneSet(state: NarrativeStyleToneEngineState, setId: string, entryIds: string[]): NarrativeStyleToneEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is StyleToneEntry => e !== undefined);
  const cumulativeEffect = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.effect, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const set: StyleToneSet = { setId, entryIds, cumulativeEffect, breadth };
  return recompute({ ...state, sets: new Map(state.sets).set(setId, set), totalSets: state.sets.size + 1 });
}
export function getStyleToneEntriesByType(state: NarrativeStyleToneEngineState, type: StyleToneType): StyleToneEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getStyleToneReport(state: NarrativeStyleToneEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add style tone entries');
  if (state.averageEffect < 0.5) recommendations.push('Low effect — strengthen');
  if (state.toneMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalSets: state.totalSets, averageEffect: Math.round(state.averageEffect * 100) / 100, toneComplexity: Math.round(state.toneComplexity * 100) / 100, toneMastery: Math.round(state.toneMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeStyleToneEngineState): NarrativeStyleToneEngineState {
  const entries = Array.from(state.entries.values());
  const averageEffect = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.effect, 0) / entries.length;
  const sets = Array.from(state.sets.values());
  const toneComplexity = sets.length === 0 ? 0.5 : sets.reduce((s, st) => s + st.breadth, 0) / sets.length;
  return { ...state, averageEffect, toneComplexity, toneMastery: averageEffect * 0.5 + toneComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeStyleToneEngineState(): NarrativeStyleToneEngineState { return createNarrativeStyleToneEngineState(); }