/**
 * V1472 NarrativeThemeMeaningEngine — Direction L Iter 24/30 (Round 5)
 */
export type ThemeMeaningAspect = 'minor' | 'moderate' | 'significant' | 'major' | 'defining' | 'world_shaping' | 'transcendent';
export type ThemeMeaningTreatment = 'hidden' | 'emerging' | 'present' | 'dominant' | 'absolute' | 'transcendent' | 'infinite';
export type ThemeMeaningImpact = 'minor' | 'moderate' | 'significant' | 'major' | 'defining' | 'world_shaping' | 'transcendent';
export interface ThemeMeaningEntry { entryId: string; aspect: ThemeMeaningAspect; treatment: ThemeMeaningTreatment; impact: ThemeMeaningImpact; description: string; resonance: number; depth: number; chapter: number; }
export interface ThemeMeaningPattern { patternId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeThemeMeaningEngineState { entries: Map<string, ThemeMeaningEntry>; patterns: Map<string, ThemeMeaningPattern>; totalEntries: number; totalPatterns: number; averageResonance: number; averageDepth: number; patternBreadth: number; themeMeaningMastery: number; }
export function createNarrativeThemeMeaningEngineState(): NarrativeThemeMeaningEngineState { return { entries: new Map(), patterns: new Map(), totalEntries: 0, totalPatterns: 0, averageResonance: 0.5, averageDepth: 0.5, patternBreadth: 0.5, themeMeaningMastery: 0.5 }; }
export function addThemeMeaningEntry(state: NarrativeThemeMeaningEngineState, entryId: string, aspect: ThemeMeaningAspect, treatment: ThemeMeaningTreatment, impact: ThemeMeaningImpact, description: string, resonance: number, depth: number, chapter: number): NarrativeThemeMeaningEngineState {
  const entry: ThemeMeaningEntry = { entryId, aspect, treatment, impact, description, resonance, depth, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemeMeaningPattern(state: NarrativeThemeMeaningEngineState, patternId: string, entryIds: string[]): NarrativeThemeMeaningEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeMeaningEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const aspectSet = new Set(entries.map(e => e.aspect));
  const breadth = Math.min(1, aspectSet.size / 7);
  const pattern: ThemeMeaningPattern = { patternId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, patterns: new Map(state.patterns).set(patternId, pattern), totalPatterns: state.patterns.size + 1 });
}
export function getThemeMeaningEntriesByAspect(state: NarrativeThemeMeaningEngineState, aspect: ThemeMeaningAspect): ThemeMeaningEntry[] { return Array.from(state.entries.values()).filter(e => e.aspect === aspect); }
export function getThemeMeaningReport(state: NarrativeThemeMeaningEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme meaning entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.themeMeaningMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalPatterns: state.totalPatterns, averageResonance: Math.round(state.averageResonance * 100) / 100, averageDepth: Math.round(state.averageDepth * 100) / 100, themeMeaningMastery: Math.round(state.themeMeaningMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemeMeaningEngineState): NarrativeThemeMeaningEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const averageDepth = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.depth, 0) / entries.length;
  const patterns = Array.from(state.patterns.values());
  const patternBreadth = patterns.length === 0 ? 0.5 : patterns.reduce((s, p) => s + p.breadth, 0) / patterns.length;
  return { ...state, averageResonance, averageDepth, patternBreadth, themeMeaningMastery: averageResonance * 0.4 + averageDepth * 0.3 + patternBreadth * 0.3 };
}
export function resetNarrativeThemeMeaningEngineState(): NarrativeThemeMeaningEngineState { return createNarrativeThemeMeaningEngineState(); }