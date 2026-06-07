/**
 * V1478 NarrativeThemeDoubtEngine — Direction L Iter 27/30 (Round 5)
 */
export type ThemeDoubtAspect = 'minor' | 'moderate' | 'significant' | 'major' | 'defining' | 'world_shaping' | 'transcendent';
export type ThemeDoubtTreatment = 'hidden' | 'emerging' | 'present' | 'dominant' | 'absolute' | 'transcendent' | 'infinite';
export type ThemeDoubtImpact = 'minor' | 'moderate' | 'significant' | 'major' | 'defining' | 'world_shaping' | 'transcendent';
export interface ThemeDoubtEntry { entryId: string; aspect: ThemeDoubtAspect; treatment: ThemeDoubtTreatment; impact: ThemeDoubtImpact; description: string; resonance: number; depth: number; chapter: number; }
export interface ThemeDoubtPattern { patternId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeThemeDoubtEngineState { entries: Map<string, ThemeDoubtEntry>; patterns: Map<string, ThemeDoubtPattern>; totalEntries: number; totalPatterns: number; averageResonance: number; averageDepth: number; patternBreadth: number; themeDoubtMastery: number; }
export function createNarrativeThemeDoubtEngineState(): NarrativeThemeDoubtEngineState { return { entries: new Map(), patterns: new Map(), totalEntries: 0, totalPatterns: 0, averageResonance: 0.5, averageDepth: 0.5, patternBreadth: 0.5, themeDoubtMastery: 0.5 }; }
export function addThemeDoubtEntry(state: NarrativeThemeDoubtEngineState, entryId: string, aspect: ThemeDoubtAspect, treatment: ThemeDoubtTreatment, impact: ThemeDoubtImpact, description: string, resonance: number, depth: number, chapter: number): NarrativeThemeDoubtEngineState {
  const entry: ThemeDoubtEntry = { entryId, aspect, treatment, impact, description, resonance, depth, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemeDoubtPattern(state: NarrativeThemeDoubtEngineState, patternId: string, entryIds: string[]): NarrativeThemeDoubtEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeDoubtEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const aspectSet = new Set(entries.map(e => e.aspect));
  const breadth = Math.min(1, aspectSet.size / 7);
  const pattern: ThemeDoubtPattern = { patternId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, patterns: new Map(state.patterns).set(patternId, pattern), totalPatterns: state.patterns.size + 1 });
}
export function getThemeDoubtEntriesByAspect(state: NarrativeThemeDoubtEngineState, aspect: ThemeDoubtAspect): ThemeDoubtEntry[] { return Array.from(state.entries.values()).filter(e => e.aspect === aspect); }
export function getThemeDoubtReport(state: NarrativeThemeDoubtEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme doubt entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.themeDoubtMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalPatterns: state.totalPatterns, averageResonance: Math.round(state.averageResonance * 100) / 100, averageDepth: Math.round(state.averageDepth * 100) / 100, themeDoubtMastery: Math.round(state.themeDoubtMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemeDoubtEngineState): NarrativeThemeDoubtEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const averageDepth = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.depth, 0) / entries.length;
  const patterns = Array.from(state.patterns.values());
  const patternBreadth = patterns.length === 0 ? 0.5 : patterns.reduce((s, p) => s + p.breadth, 0) / patterns.length;
  return { ...state, averageResonance, averageDepth, patternBreadth, themeDoubtMastery: averageResonance * 0.4 + averageDepth * 0.3 + patternBreadth * 0.3 };
}
export function resetNarrativeThemeDoubtEngineState(): NarrativeThemeDoubtEngineState { return createNarrativeThemeDoubtEngineState(); }