/**
 * V1758 NarrativeThemeFearEngine — Direction Q Iter 17/30 (Round 5)
 */
export type ThemeFearType = 'physical' | 'psychological' | 'existential' | 'social' | 'spiritual' | 'transcendent' | 'infinite';
export type ThemeFearManifestation = 'paralysis' | 'flight' | 'fight' | 'submission' | 'transcendent' | 'infinite';
export interface ThemeFearEntry { entryId: string; type: ThemeFearType; manifestation: ThemeFearManifestation; description: string; dread: number; chapter: number; }
export interface ThemeFearShadow { shadowId: string; entryIds: string[]; cumulativeDread: number; breadth: number; }
export interface NarrativeThemeFearEngineState { entries: Map<string, ThemeFearEntry>; shadows: Map<string, ThemeFearShadow>; totalEntries: number; totalShadows: number; averageDread: number; fearComplexity: number; fearMastery: number; }
export function createNarrativeThemeFearEngineState(): NarrativeThemeFearEngineState { return { entries: new Map(), shadows: new Map(), totalEntries: 0, totalShadows: 0, averageDread: 0.5, fearComplexity: 0.5, fearMastery: 0.5 }; }
export function addThemeFearEntry(state: NarrativeThemeFearEngineState, entryId: string, type: ThemeFearType, manifestation: ThemeFearManifestation, description: string, dread: number, chapter: number): NarrativeThemeFearEngineState {
  const entry: ThemeFearEntry = { entryId, type, manifestation, description, dread, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemeFearShadow(state: NarrativeThemeFearEngineState, shadowId: string, entryIds: string[]): NarrativeThemeFearEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeFearEntry => e !== undefined);
  const cumulativeDread = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.dread, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const shadow: ThemeFearShadow = { shadowId, entryIds, cumulativeDread, breadth };
  return recompute({ ...state, shadows: new Map(state.shadows).set(shadowId, shadow), totalShadows: state.shadows.size + 1 });
}
export function getThemeFearEntriesByType(state: NarrativeThemeFearEngineState, type: ThemeFearType): ThemeFearEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getThemeFearReport(state: NarrativeThemeFearEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme fear entries');
  if (state.averageDread < 0.5) recommendations.push('Low dread — strengthen');
  if (state.fearMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalShadows: state.totalShadows, averageDread: Math.round(state.averageDread * 100) / 100, fearComplexity: Math.round(state.fearComplexity * 100) / 100, fearMastery: Math.round(state.fearMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemeFearEngineState): NarrativeThemeFearEngineState {
  const entries = Array.from(state.entries.values());
  const averageDread = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.dread, 0) / entries.length;
  const shadows = Array.from(state.shadows.values());
  const fearComplexity = shadows.length === 0 ? 0.5 : shadows.reduce((s, sh) => s + sh.breadth, 0) / shadows.length;
  return { ...state, averageDread, fearComplexity, fearMastery: averageDread * 0.5 + fearComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeThemeFearEngineState(): NarrativeThemeFearEngineState { return createNarrativeThemeFearEngineState(); }