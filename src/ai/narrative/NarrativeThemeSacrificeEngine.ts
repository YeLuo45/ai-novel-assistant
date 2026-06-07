/**
 * V1444 NarrativeThemeSacrificeEngine — Direction L Iter 10/30 (Round 5)
 */
export type ThemeSacrificeAspect = 'minor' | 'moderate' | 'significant' | 'major' | 'defining' | 'world_shaping' | 'transcendent';
export type ThemeSacrificeTreatment = 'hidden' | 'emerging' | 'present' | 'dominant' | 'absolute' | 'transcendent' | 'infinite';
export type ThemeSacrificeImpact = 'minor' | 'moderate' | 'significant' | 'major' | 'defining' | 'world_shaping' | 'transcendent';
export interface ThemeSacrificeEntry { entryId: string; aspect: ThemeSacrificeAspect; treatment: ThemeSacrificeTreatment; impact: ThemeSacrificeImpact; description: string; resonance: number; depth: number; chapter: number; }
export interface ThemeSacrificePattern { patternId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeThemeSacrificeEngineState { entries: Map<string, ThemeSacrificeEntry>; patterns: Map<string, ThemeSacrificePattern>; totalEntries: number; totalPatterns: number; averageResonance: number; averageDepth: number; patternBreadth: number; themeSacrificeMastery: number; }
export function createNarrativeThemeSacrificeEngineState(): NarrativeThemeSacrificeEngineState { return { entries: new Map(), patterns: new Map(), totalEntries: 0, totalPatterns: 0, averageResonance: 0.5, averageDepth: 0.5, patternBreadth: 0.5, themeSacrificeMastery: 0.5 }; }
export function addThemeSacrificeEntry(state: NarrativeThemeSacrificeEngineState, entryId: string, aspect: ThemeSacrificeAspect, treatment: ThemeSacrificeTreatment, impact: ThemeSacrificeImpact, description: string, resonance: number, depth: number, chapter: number): NarrativeThemeSacrificeEngineState {
  const entry: ThemeSacrificeEntry = { entryId, aspect, treatment, impact, description, resonance, depth, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemeSacrificePattern(state: NarrativeThemeSacrificeEngineState, patternId: string, entryIds: string[]): NarrativeThemeSacrificeEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeSacrificeEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const aspectSet = new Set(entries.map(e => e.aspect));
  const breadth = Math.min(1, aspectSet.size / 7);
  const pattern: ThemeSacrificePattern = { patternId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, patterns: new Map(state.patterns).set(patternId, pattern), totalPatterns: state.patterns.size + 1 });
}
export function getThemeSacrificeEntriesByAspect(state: NarrativeThemeSacrificeEngineState, aspect: ThemeSacrificeAspect): ThemeSacrificeEntry[] { return Array.from(state.entries.values()).filter(e => e.aspect === aspect); }
export function getThemeSacrificeReport(state: NarrativeThemeSacrificeEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme sacrifice entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.themeSacrificeMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalPatterns: state.totalPatterns, averageResonance: Math.round(state.averageResonance * 100) / 100, averageDepth: Math.round(state.averageDepth * 100) / 100, themeSacrificeMastery: Math.round(state.themeSacrificeMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemeSacrificeEngineState): NarrativeThemeSacrificeEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const averageDepth = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.depth, 0) / entries.length;
  const patterns = Array.from(state.patterns.values());
  const patternBreadth = patterns.length === 0 ? 0.5 : patterns.reduce((s, p) => s + p.breadth, 0) / patterns.length;
  return { ...state, averageResonance, averageDepth, patternBreadth, themeSacrificeMastery: averageResonance * 0.4 + averageDepth * 0.3 + patternBreadth * 0.3 };
}
export function resetNarrativeThemeSacrificeEngineState(): NarrativeThemeSacrificeEngineState { return createNarrativeThemeSacrificeEngineState(); }