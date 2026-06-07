/**
 * V1462 NarrativeThemeHomeEngine — Direction L Iter 19/30 (Round 5)
 */
export type ThemeHomeAspect = 'minor' | 'moderate' | 'significant' | 'major' | 'defining' | 'world_shaping' | 'transcendent';
export type ThemeHomeTreatment = 'hidden' | 'emerging' | 'present' | 'dominant' | 'absolute' | 'transcendent' | 'infinite';
export type ThemeHomeImpact = 'minor' | 'moderate' | 'significant' | 'major' | 'defining' | 'world_shaping' | 'transcendent';
export interface ThemeHomeEntry { entryId: string; aspect: ThemeHomeAspect; treatment: ThemeHomeTreatment; impact: ThemeHomeImpact; description: string; resonance: number; depth: number; chapter: number; }
export interface ThemeHomePattern { patternId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeThemeHomeEngineState { entries: Map<string, ThemeHomeEntry>; patterns: Map<string, ThemeHomePattern>; totalEntries: number; totalPatterns: number; averageResonance: number; averageDepth: number; patternBreadth: number; themeHomeMastery: number; }
export function createNarrativeThemeHomeEngineState(): NarrativeThemeHomeEngineState { return { entries: new Map(), patterns: new Map(), totalEntries: 0, totalPatterns: 0, averageResonance: 0.5, averageDepth: 0.5, patternBreadth: 0.5, themeHomeMastery: 0.5 }; }
export function addThemeHomeEntry(state: NarrativeThemeHomeEngineState, entryId: string, aspect: ThemeHomeAspect, treatment: ThemeHomeTreatment, impact: ThemeHomeImpact, description: string, resonance: number, depth: number, chapter: number): NarrativeThemeHomeEngineState {
  const entry: ThemeHomeEntry = { entryId, aspect, treatment, impact, description, resonance, depth, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemeHomePattern(state: NarrativeThemeHomeEngineState, patternId: string, entryIds: string[]): NarrativeThemeHomeEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeHomeEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const aspectSet = new Set(entries.map(e => e.aspect));
  const breadth = Math.min(1, aspectSet.size / 7);
  const pattern: ThemeHomePattern = { patternId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, patterns: new Map(state.patterns).set(patternId, pattern), totalPatterns: state.patterns.size + 1 });
}
export function getThemeHomeEntriesByAspect(state: NarrativeThemeHomeEngineState, aspect: ThemeHomeAspect): ThemeHomeEntry[] { return Array.from(state.entries.values()).filter(e => e.aspect === aspect); }
export function getThemeHomeReport(state: NarrativeThemeHomeEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme home entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.themeHomeMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalPatterns: state.totalPatterns, averageResonance: Math.round(state.averageResonance * 100) / 100, averageDepth: Math.round(state.averageDepth * 100) / 100, themeHomeMastery: Math.round(state.themeHomeMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemeHomeEngineState): NarrativeThemeHomeEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const averageDepth = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.depth, 0) / entries.length;
  const patterns = Array.from(state.patterns.values());
  const patternBreadth = patterns.length === 0 ? 0.5 : patterns.reduce((s, p) => s + p.breadth, 0) / patterns.length;
  return { ...state, averageResonance, averageDepth, patternBreadth, themeHomeMastery: averageResonance * 0.4 + averageDepth * 0.3 + patternBreadth * 0.3 };
}
export function resetNarrativeThemeHomeEngineState(): NarrativeThemeHomeEngineState { return createNarrativeThemeHomeEngineState(); }