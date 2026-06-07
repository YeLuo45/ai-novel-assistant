/**
 * V1456 NarrativeThemeTimeEngine2 — Direction L Iter 16/30 (Round 5)
 */
export type ThemeTimeAspect = 'minor' | 'moderate' | 'significant' | 'major' | 'defining' | 'world_shaping' | 'transcendent';
export type ThemeTimeTreatment = 'hidden' | 'emerging' | 'present' | 'dominant' | 'absolute' | 'transcendent' | 'infinite';
export type ThemeTimeImpact = 'minor' | 'moderate' | 'significant' | 'major' | 'defining' | 'world_shaping' | 'transcendent';
export interface ThemeTimeEntry { entryId: string; aspect: ThemeTimeAspect; treatment: ThemeTimeTreatment; impact: ThemeTimeImpact; description: string; resonance: number; depth: number; chapter: number; }
export interface ThemeTimePattern { patternId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeThemeTime2EngineState { entries: Map<string, ThemeTimeEntry>; patterns: Map<string, ThemeTimePattern>; totalEntries: number; totalPatterns: number; averageResonance: number; averageDepth: number; patternBreadth: number; themeTimeMastery: number; }
export function createNarrativeThemeTime2EngineState(): NarrativeThemeTime2EngineState { return { entries: new Map(), patterns: new Map(), totalEntries: 0, totalPatterns: 0, averageResonance: 0.5, averageDepth: 0.5, patternBreadth: 0.5, themeTimeMastery: 0.5 }; }
export function addThemeTimeEntry(state: NarrativeThemeTime2EngineState, entryId: string, aspect: ThemeTimeAspect, treatment: ThemeTimeTreatment, impact: ThemeTimeImpact, description: string, resonance: number, depth: number, chapter: number): NarrativeThemeTime2EngineState {
  const entry: ThemeTimeEntry = { entryId, aspect, treatment, impact, description, resonance, depth, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemeTimePattern(state: NarrativeThemeTime2EngineState, patternId: string, entryIds: string[]): NarrativeThemeTime2EngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeTimeEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const aspectSet = new Set(entries.map(e => e.aspect));
  const breadth = Math.min(1, aspectSet.size / 7);
  const pattern: ThemeTimePattern = { patternId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, patterns: new Map(state.patterns).set(patternId, pattern), totalPatterns: state.patterns.size + 1 });
}
export function getThemeTimeEntriesByAspect(state: NarrativeThemeTime2EngineState, aspect: ThemeTimeAspect): ThemeTimeEntry[] { return Array.from(state.entries.values()).filter(e => e.aspect === aspect); }
export function getThemeTimeReport(state: NarrativeThemeTime2EngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme time entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.themeTimeMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalPatterns: state.totalPatterns, averageResonance: Math.round(state.averageResonance * 100) / 100, averageDepth: Math.round(state.averageDepth * 100) / 100, themeTimeMastery: Math.round(state.themeTimeMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemeTime2EngineState): NarrativeThemeTime2EngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const averageDepth = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.depth, 0) / entries.length;
  const patterns = Array.from(state.patterns.values());
  const patternBreadth = patterns.length === 0 ? 0.5 : patterns.reduce((s, p) => s + p.breadth, 0) / patterns.length;
  return { ...state, averageResonance, averageDepth, patternBreadth, themeTimeMastery: averageResonance * 0.4 + averageDepth * 0.3 + patternBreadth * 0.3 };
}
export function resetNarrativeThemeTime2EngineState(): NarrativeThemeTime2EngineState { return createNarrativeThemeTime2EngineState(); }