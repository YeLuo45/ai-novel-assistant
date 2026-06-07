/**
 * V1460 NarrativeThemeLossEngine — Direction L Iter 18/30 (Round 5)
 */
export type ThemeLossAspect = 'minor' | 'moderate' | 'significant' | 'major' | 'defining' | 'world_shaping' | 'transcendent';
export type ThemeLossTreatment = 'hidden' | 'emerging' | 'present' | 'dominant' | 'absolute' | 'transcendent' | 'infinite';
export type ThemeLossImpact = 'minor' | 'moderate' | 'significant' | 'major' | 'defining' | 'world_shaping' | 'transcendent';
export interface ThemeLossEntry { entryId: string; aspect: ThemeLossAspect; treatment: ThemeLossTreatment; impact: ThemeLossImpact; description: string; resonance: number; depth: number; chapter: number; }
export interface ThemeLossPattern { patternId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeThemeLossEngineState { entries: Map<string, ThemeLossEntry>; patterns: Map<string, ThemeLossPattern>; totalEntries: number; totalPatterns: number; averageResonance: number; averageDepth: number; patternBreadth: number; themeLossMastery: number; }
export function createNarrativeThemeLossEngineState(): NarrativeThemeLossEngineState { return { entries: new Map(), patterns: new Map(), totalEntries: 0, totalPatterns: 0, averageResonance: 0.5, averageDepth: 0.5, patternBreadth: 0.5, themeLossMastery: 0.5 }; }
export function addThemeLossEntry(state: NarrativeThemeLossEngineState, entryId: string, aspect: ThemeLossAspect, treatment: ThemeLossTreatment, impact: ThemeLossImpact, description: string, resonance: number, depth: number, chapter: number): NarrativeThemeLossEngineState {
  const entry: ThemeLossEntry = { entryId, aspect, treatment, impact, description, resonance, depth, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addThemeLossPattern(state: NarrativeThemeLossEngineState, patternId: string, entryIds: string[]): NarrativeThemeLossEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeLossEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const aspectSet = new Set(entries.map(e => e.aspect));
  const breadth = Math.min(1, aspectSet.size / 7);
  const pattern: ThemeLossPattern = { patternId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, patterns: new Map(state.patterns).set(patternId, pattern), totalPatterns: state.patterns.size + 1 });
}
export function getThemeLossEntriesByAspect(state: NarrativeThemeLossEngineState, aspect: ThemeLossAspect): ThemeLossEntry[] { return Array.from(state.entries.values()).filter(e => e.aspect === aspect); }
export function getThemeLossReport(state: NarrativeThemeLossEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme loss entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.themeLossMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalPatterns: state.totalPatterns, averageResonance: Math.round(state.averageResonance * 100) / 100, averageDepth: Math.round(state.averageDepth * 100) / 100, themeLossMastery: Math.round(state.themeLossMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeThemeLossEngineState): NarrativeThemeLossEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const averageDepth = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.depth, 0) / entries.length;
  const patterns = Array.from(state.patterns.values());
  const patternBreadth = patterns.length === 0 ? 0.5 : patterns.reduce((s, p) => s + p.breadth, 0) / patterns.length;
  return { ...state, averageResonance, averageDepth, patternBreadth, themeLossMastery: averageResonance * 0.4 + averageDepth * 0.3 + patternBreadth * 0.3 };
}
export function resetNarrativeThemeLossEngineState(): NarrativeThemeLossEngineState { return createNarrativeThemeLossEngineState(); }