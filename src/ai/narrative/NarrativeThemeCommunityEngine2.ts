/**
 * V1452 NarrativeThemeCommunityEngine2 — Direction L Iter 14/30 (Round 5)
 */
export type ThemeCommunityAspect = 'minor' | 'moderate' | 'significant' | 'major' | 'defining' | 'world_shaping' | 'transcendent';
export type ThemeCommunityTreatment = 'hidden' | 'emerging' | 'present' | 'dominant' | 'absolute' | 'transcendent' | 'infinite';
export type ThemeCommunityImpact = 'minor' | 'moderate' | 'significant' | 'major' | 'defining' | 'world_shaping' | 'transcendent';
export interface ThemeCommunityEntry { entryId: string; aspect: ThemeCommunityAspect; treatment: ThemeCommunityTreatment; impact: ThemeCommunityImpact; description: string; resonance: number; depth: number; chapter: number; }
export interface ThemeCommunityPattern { patternId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeThemeCommunity2EngineState { entries: Map<string, ThemeCommunityEntry>; patterns: Map<string, ThemeCommunityPattern>; totalEntries: number; totalPatterns: number; averageResonance: number; averageDepth: number; patternBreadth: number; themeCommunityMastery: number; }
export function createNarrativeThemeCommunity2EngineState(): NarrativeThemeCommunity2EngineState { return { entries: new Map(), patterns: new Map(), totalEntries: 0, totalPatterns: 0, averageResonance: 0.5, averageDepth: 0.5, patternBreadth: 0.5, themeCommunityMastery: 0.5 }; }
export function addThemeCommunityEntry(state: NarrativeThemeCommunity2EngineState, entryId: string, aspect: ThemeCommunityAspect, treatment: ThemeCommunityTreatment, impact: ThemeCommunityImpact, description: string, resonance: number, depth: number, chapter: number): NarrativeThemeCommunity2EngineState {
  const entry: ThemeCommunityEntry = { entryId, aspect, treatment, impact, description, resonance, depth, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemeCommunityPattern(state: NarrativeThemeCommunity2EngineState, patternId: string, entryIds: string[]): NarrativeThemeCommunity2EngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeCommunityEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const aspectSet = new Set(entries.map(e => e.aspect));
  const breadth = Math.min(1, aspectSet.size / 7);
  const pattern: ThemeCommunityPattern = { patternId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, patterns: new Map(state.patterns).set(patternId, pattern), totalPatterns: state.patterns.size + 1 });
}
export function getThemeCommunityEntriesByAspect(state: NarrativeThemeCommunity2EngineState, aspect: ThemeCommunityAspect): ThemeCommunityEntry[] { return Array.from(state.entries.values()).filter(e => e.aspect === aspect); }
export function getThemeCommunityReport(state: NarrativeThemeCommunity2EngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme community entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.themeCommunityMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalPatterns: state.totalPatterns, averageResonance: Math.round(state.averageResonance * 100) / 100, averageDepth: Math.round(state.averageDepth * 100) / 100, themeCommunityMastery: Math.round(state.themeCommunityMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemeCommunity2EngineState): NarrativeThemeCommunity2EngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const averageDepth = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.depth, 0) / entries.length;
  const patterns = Array.from(state.patterns.values());
  const patternBreadth = patterns.length === 0 ? 0.5 : patterns.reduce((s, p) => s + p.breadth, 0) / patterns.length;
  return { ...state, averageResonance, averageDepth, patternBreadth, themeCommunityMastery: averageResonance * 0.4 + averageDepth * 0.3 + patternBreadth * 0.3 };
}
export function resetNarrativeThemeCommunity2EngineState(): NarrativeThemeCommunity2EngineState { return createNarrativeThemeCommunity2EngineState(); }