/**
 * V1454 NarrativeThemeMortalityEngine — Direction L Iter 15/30 (Round 5)
 */
export type ThemeMortalityAspect = 'minor' | 'moderate' | 'significant' | 'major' | 'defining' | 'world_shaping' | 'transcendent';
export type ThemeMortalityTreatment = 'hidden' | 'emerging' | 'present' | 'dominant' | 'absolute' | 'transcendent' | 'infinite';
export type ThemeMortalityImpact = 'minor' | 'moderate' | 'significant' | 'major' | 'defining' | 'world_shaping' | 'transcendent';
export interface ThemeMortalityEntry { entryId: string; aspect: ThemeMortalityAspect; treatment: ThemeMortalityTreatment; impact: ThemeMortalityImpact; description: string; resonance: number; depth: number; chapter: number; }
export interface ThemeMortalityPattern { patternId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeThemeMortalityEngineState { entries: Map<string, ThemeMortalityEntry>; patterns: Map<string, ThemeMortalityPattern>; totalEntries: number; totalPatterns: number; averageResonance: number; averageDepth: number; patternBreadth: number; themeMortalityMastery: number; }
export function createNarrativeThemeMortalityEngineState(): NarrativeThemeMortalityEngineState { return { entries: new Map(), patterns: new Map(), totalEntries: 0, totalPatterns: 0, averageResonance: 0.5, averageDepth: 0.5, patternBreadth: 0.5, themeMortalityMastery: 0.5 }; }
export function addThemeMortalityEntry(state: NarrativeThemeMortalityEngineState, entryId: string, aspect: ThemeMortalityAspect, treatment: ThemeMortalityTreatment, impact: ThemeMortalityImpact, description: string, resonance: number, depth: number, chapter: number): NarrativeThemeMortalityEngineState {
  const entry: ThemeMortalityEntry = { entryId, aspect, treatment, impact, description, resonance, depth, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemeMortalityPattern(state: NarrativeThemeMortalityEngineState, patternId: string, entryIds: string[]): NarrativeThemeMortalityEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeMortalityEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const aspectSet = new Set(entries.map(e => e.aspect));
  const breadth = Math.min(1, aspectSet.size / 7);
  const pattern: ThemeMortalityPattern = { patternId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, patterns: new Map(state.patterns).set(patternId, pattern), totalPatterns: state.patterns.size + 1 });
}
export function getThemeMortalityEntriesByAspect(state: NarrativeThemeMortalityEngineState, aspect: ThemeMortalityAspect): ThemeMortalityEntry[] { return Array.from(state.entries.values()).filter(e => e.aspect === aspect); }
export function getThemeMortalityReport(state: NarrativeThemeMortalityEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme mortality entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.themeMortalityMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalPatterns: state.totalPatterns, averageResonance: Math.round(state.averageResonance * 100) / 100, averageDepth: Math.round(state.averageDepth * 100) / 100, themeMortalityMastery: Math.round(state.themeMortalityMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemeMortalityEngineState): NarrativeThemeMortalityEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const averageDepth = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.depth, 0) / entries.length;
  const patterns = Array.from(state.patterns.values());
  const patternBreadth = patterns.length === 0 ? 0.5 : patterns.reduce((s, p) => s + p.breadth, 0) / patterns.length;
  return { ...state, averageResonance, averageDepth, patternBreadth, themeMortalityMastery: averageResonance * 0.4 + averageDepth * 0.3 + patternBreadth * 0.3 };
}
export function resetNarrativeThemeMortalityEngineState(): NarrativeThemeMortalityEngineState { return createNarrativeThemeMortalityEngineState(); }