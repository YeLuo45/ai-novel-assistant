/**
 * V1438 NarrativeThemeTruthEngine — Direction L Iter 7/30 (Round 5)
 */
export type ThemeTruthAspect = 'minor' | 'moderate' | 'significant' | 'major' | 'defining' | 'world_shaping' | 'transcendent';
export type ThemeTruthTreatment = 'hidden' | 'emerging' | 'present' | 'dominant' | 'absolute' | 'transcendent' | 'infinite';
export type ThemeTruthImpact = 'minor' | 'moderate' | 'significant' | 'major' | 'defining' | 'world_shaping' | 'transcendent';
export interface ThemeTruthEntry { entryId: string; aspect: ThemeTruthAspect; treatment: ThemeTruthTreatment; impact: ThemeTruthImpact; description: string; resonance: number; depth: number; chapter: number; }
export interface ThemeTruthPattern { patternId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeThemeTruthEngineState { entries: Map<string, ThemeTruthEntry>; patterns: Map<string, ThemeTruthPattern>; totalEntries: number; totalPatterns: number; averageResonance: number; averageDepth: number; patternBreadth: number; themeTruthMastery: number; }
export function createNarrativeThemeTruthEngineState(): NarrativeThemeTruthEngineState { return { entries: new Map(), patterns: new Map(), totalEntries: 0, totalPatterns: 0, averageResonance: 0.5, averageDepth: 0.5, patternBreadth: 0.5, themeTruthMastery: 0.5 }; }
export function addThemeTruthEntry(state: NarrativeThemeTruthEngineState, entryId: string, aspect: ThemeTruthAspect, treatment: ThemeTruthTreatment, impact: ThemeTruthImpact, description: string, resonance: number, depth: number, chapter: number): NarrativeThemeTruthEngineState {
  const entry: ThemeTruthEntry = { entryId, aspect, treatment, impact, description, resonance, depth, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemeTruthPattern(state: NarrativeThemeTruthEngineState, patternId: string, entryIds: string[]): NarrativeThemeTruthEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeTruthEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const aspectSet = new Set(entries.map(e => e.aspect));
  const breadth = Math.min(1, aspectSet.size / 7);
  const pattern: ThemeTruthPattern = { patternId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, patterns: new Map(state.patterns).set(patternId, pattern), totalPatterns: state.patterns.size + 1 });
}
export function getThemeTruthEntriesByAspect(state: NarrativeThemeTruthEngineState, aspect: ThemeTruthAspect): ThemeTruthEntry[] { return Array.from(state.entries.values()).filter(e => e.aspect === aspect); }
export function getThemeTruthReport(state: NarrativeThemeTruthEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme truth entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.themeTruthMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalPatterns: state.totalPatterns, averageResonance: Math.round(state.averageResonance * 100) / 100, averageDepth: Math.round(state.averageDepth * 100) / 100, themeTruthMastery: Math.round(state.themeTruthMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemeTruthEngineState): NarrativeThemeTruthEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const averageDepth = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.depth, 0) / entries.length;
  const patterns = Array.from(state.patterns.values());
  const patternBreadth = patterns.length === 0 ? 0.5 : patterns.reduce((s, p) => s + p.breadth, 0) / patterns.length;
  return { ...state, averageResonance, averageDepth, patternBreadth, themeTruthMastery: averageResonance * 0.4 + averageDepth * 0.3 + patternBreadth * 0.3 };
}
export function resetNarrativeThemeTruthEngineState(): NarrativeThemeTruthEngineState { return createNarrativeThemeTruthEngineState(); }