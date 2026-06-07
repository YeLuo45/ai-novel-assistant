/**
 * V1450 NarrativeThemeIsolationEngine — Direction L Iter 13/30 (Round 5)
 */
export type ThemeIsolationAspect = 'minor' | 'moderate' | 'significant' | 'major' | 'defining' | 'world_shaping' | 'transcendent';
export type ThemeIsolationTreatment = 'hidden' | 'emerging' | 'present' | 'dominant' | 'absolute' | 'transcendent' | 'infinite';
export type ThemeIsolationImpact = 'minor' | 'moderate' | 'significant' | 'major' | 'defining' | 'world_shaping' | 'transcendent';
export interface ThemeIsolationEntry { entryId: string; aspect: ThemeIsolationAspect; treatment: ThemeIsolationTreatment; impact: ThemeIsolationImpact; description: string; resonance: number; depth: number; chapter: number; }
export interface ThemeIsolationPattern { patternId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeThemeIsolationEngineState { entries: Map<string, ThemeIsolationEntry>; patterns: Map<string, ThemeIsolationPattern>; totalEntries: number; totalPatterns: number; averageResonance: number; averageDepth: number; patternBreadth: number; themeIsolationMastery: number; }
export function createNarrativeThemeIsolationEngineState(): NarrativeThemeIsolationEngineState { return { entries: new Map(), patterns: new Map(), totalEntries: 0, totalPatterns: 0, averageResonance: 0.5, averageDepth: 0.5, patternBreadth: 0.5, themeIsolationMastery: 0.5 }; }
export function addThemeIsolationEntry(state: NarrativeThemeIsolationEngineState, entryId: string, aspect: ThemeIsolationAspect, treatment: ThemeIsolationTreatment, impact: ThemeIsolationImpact, description: string, resonance: number, depth: number, chapter: number): NarrativeThemeIsolationEngineState {
  const entry: ThemeIsolationEntry = { entryId, aspect, treatment, impact, description, resonance, depth, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemeIsolationPattern(state: NarrativeThemeIsolationEngineState, patternId: string, entryIds: string[]): NarrativeThemeIsolationEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeIsolationEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const aspectSet = new Set(entries.map(e => e.aspect));
  const breadth = Math.min(1, aspectSet.size / 7);
  const pattern: ThemeIsolationPattern = { patternId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, patterns: new Map(state.patterns).set(patternId, pattern), totalPatterns: state.patterns.size + 1 });
}
export function getThemeIsolationEntriesByAspect(state: NarrativeThemeIsolationEngineState, aspect: ThemeIsolationAspect): ThemeIsolationEntry[] { return Array.from(state.entries.values()).filter(e => e.aspect === aspect); }
export function getThemeIsolationReport(state: NarrativeThemeIsolationEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme isolation entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.themeIsolationMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalPatterns: state.totalPatterns, averageResonance: Math.round(state.averageResonance * 100) / 100, averageDepth: Math.round(state.averageDepth * 100) / 100, themeIsolationMastery: Math.round(state.themeIsolationMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemeIsolationEngineState): NarrativeThemeIsolationEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const averageDepth = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.depth, 0) / entries.length;
  const patterns = Array.from(state.patterns.values());
  const patternBreadth = patterns.length === 0 ? 0.5 : patterns.reduce((s, p) => s + p.breadth, 0) / patterns.length;
  return { ...state, averageResonance, averageDepth, patternBreadth, themeIsolationMastery: averageResonance * 0.4 + averageDepth * 0.3 + patternBreadth * 0.3 };
}
export function resetNarrativeThemeIsolationEngineState(): NarrativeThemeIsolationEngineState { return createNarrativeThemeIsolationEngineState(); }