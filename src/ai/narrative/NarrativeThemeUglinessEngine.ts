/**
 * V1776 NarrativeThemeUglinessEngine — Direction Q Iter 26/30 (Round 5)
 */
export type ThemeUglinessType = 'physical' | 'moral' | 'social' | 'situational' | 'existential' | 'transcendent' | 'infinite';
export type ThemeUglinessConfrontation = 'avoidance' | 'acknowledgment' | 'transformation' | 'transcendence' | 'transcendent' | 'infinite';
export interface ThemeUglinessEntry { entryId: string; type: ThemeUglinessType; confrontation: ThemeUglinessConfrontation; description: string; starkness: number; chapter: number; }
export interface ThemeUglinessMirror { mirrorId: string; entryIds: string[]; cumulativeStarkness: number; breadth: number; }
export interface NarrativeThemeUglinessEngineState { entries: Map<string, ThemeUglinessEntry>; mirrors: Map<string, ThemeUglinessMirror>; totalEntries: number; totalMirrors: number; averageStarkness: number; uglinessComplexity: number; uglinessMastery: number; }
export function createNarrativeThemeUglinessEngineState(): NarrativeThemeUglinessEngineState { return { entries: new Map(), mirrors: new Map(), totalEntries: 0, totalMirrors: 0, averageStarkness: 0.5, uglinessComplexity: 0.5, uglinessMastery: 0.5 }; }
export function addThemeUglinessEntry(state: NarrativeThemeUglinessEngineState, entryId: string, type: ThemeUglinessType, confrontation: ThemeUglinessConfrontation, description: string, starkness: number, chapter: number): NarrativeThemeUglinessEngineState {
  const entry: ThemeUglinessEntry = { entryId, type, confrontation, description, starkness, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemeUglinessMirror(state: NarrativeThemeUglinessEngineState, mirrorId: string, entryIds: string[]): NarrativeThemeUglinessEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeUglinessEntry => e !== undefined);
  const cumulativeStarkness = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.starkness, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const mirror: ThemeUglinessMirror = { mirrorId, entryIds, cumulativeStarkness, breadth };
  return recompute({ ...state, mirrors: new Map(state.mirrors).set(mirrorId, mirror), totalMirrors: state.mirrors.size + 1 });
}
export function getThemeUglinessEntriesByType(state: NarrativeThemeUglinessEngineState, type: ThemeUglinessType): ThemeUglinessEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getThemeUglinessReport(state: NarrativeThemeUglinessEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme ugliness entries');
  if (state.averageStarkness < 0.5) recommendations.push('Low starkness — strengthen');
  if (state.uglinessMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalMirrors: state.totalMirrors, averageStarkness: Math.round(state.averageStarkness * 100) / 100, uglinessComplexity: Math.round(state.uglinessComplexity * 100) / 100, uglinessMastery: Math.round(state.uglinessMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemeUglinessEngineState): NarrativeThemeUglinessEngineState {
  const entries = Array.from(state.entries.values());
  const averageStarkness = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.starkness, 0) / entries.length;
  const mirrors = Array.from(state.mirrors.values());
  const uglinessComplexity = mirrors.length === 0 ? 0.5 : mirrors.reduce((s, m) => s + m.breadth, 0) / mirrors.length;
  return { ...state, averageStarkness, uglinessComplexity, uglinessMastery: averageStarkness * 0.5 + uglinessComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeThemeUglinessEngineState(): NarrativeThemeUglinessEngineState { return createNarrativeThemeUglinessEngineState(); }