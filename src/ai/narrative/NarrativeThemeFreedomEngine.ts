/**
 * V1730 NarrativeThemeFreedomEngine — Direction Q Iter 3/30 (Round 5)
 */
export type ThemeFreedomType = 'political' | 'personal' | 'economic' | 'spiritual' | 'creative' | 'transcendent' | 'infinite';
export type ThemeFreedomState = 'captive' | 'struggling' | 'tasting' | 'free' | 'transcendent' | 'infinite';
export interface ThemeFreedomEntry { entryId: string; type: ThemeFreedomType; state: ThemeFreedomState; description: string; liberation: number; chapter: number; }
export interface ThemeFreedomStruggle { struggleId: string; entryIds: string[]; cumulativeLiberation: number; breadth: number; }
export interface NarrativeThemeFreedomEngineState { entries: Map<string, ThemeFreedomEntry>; struggles: Map<string, ThemeFreedomStruggle>; totalEntries: number; totalStruggles: number; averageLiberation: number; freedomComplexity: number; freedomMastery: number; }
export function createNarrativeThemeFreedomEngineState(): NarrativeThemeFreedomEngineState { return { entries: new Map(), struggles: new Map(), totalEntries: 0, totalStruggles: 0, averageLiberation: 0.5, freedomComplexity: 0.5, freedomMastery: 0.5 }; }
export function addThemeFreedomEntry(state: NarrativeThemeFreedomEngineState, entryId: string, type: ThemeFreedomType, freedomState: ThemeFreedomState, description: string, liberation: number, chapter: number): NarrativeThemeFreedomEngineState {
  const entry: ThemeFreedomEntry = { entryId, type, state: freedomState, description, liberation, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemeFreedomStruggle(state: NarrativeThemeFreedomEngineState, struggleId: string, entryIds: string[]): NarrativeThemeFreedomEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeFreedomEntry => e !== undefined);
  const cumulativeLiberation = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.liberation, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const struggle: ThemeFreedomStruggle = { struggleId, entryIds, cumulativeLiberation, breadth };
  return recompute({ ...state, struggles: new Map(state.struggles).set(struggleId, struggle), totalStruggles: state.struggles.size + 1 });
}
export function getThemeFreedomEntriesByType(state: NarrativeThemeFreedomEngineState, type: ThemeFreedomType): ThemeFreedomEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getThemeFreedomReport(state: NarrativeThemeFreedomEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme freedom entries');
  if (state.averageLiberation < 0.5) recommendations.push('Low liberation — strengthen');
  if (state.freedomMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalStruggles: state.totalStruggles, averageLiberation: Math.round(state.averageLiberation * 100) / 100, freedomComplexity: Math.round(state.freedomComplexity * 100) / 100, freedomMastery: Math.round(state.freedomMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemeFreedomEngineState): NarrativeThemeFreedomEngineState {
  const entries = Array.from(state.entries.values());
  const averageLiberation = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.liberation, 0) / entries.length;
  const struggles = Array.from(state.struggles.values());
  const freedomComplexity = struggles.length === 0 ? 0.5 : struggles.reduce((s, st) => s + st.breadth, 0) / struggles.length;
  return { ...state, averageLiberation, freedomComplexity, freedomMastery: averageLiberation * 0.5 + freedomComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeThemeFreedomEngineState(): NarrativeThemeFreedomEngineState { return createNarrativeThemeFreedomEngineState(); }