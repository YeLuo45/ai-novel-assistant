/**
 * V1428 NarrativeThemeDeathEngine — Direction L Iter 2/30 (Round 5)
 * Theme death engine: death as narrative theme
 * Sources: thunderbolt death + nanobot + ruflo
 */

export type ThemeDeathAspect = 'mortality' | 'loss' | 'transformation' | 'mystery' | 'release' | 'cycle' | 'transcendent';
export type ThemeDeathTreatment = 'avoided' | 'implied' | 'confronted' | 'embraced' | 'transcended' | 'absolute' | 'infinite';
export type ThemeDeathImpact = 'minor' | 'moderate' | 'significant' | 'defining' | 'world_ending' | 'absolute' | 'transcendent';

export interface ThemeDeathEntry {
  entryId: string;
  aspect: ThemeDeathAspect;
  treatment: ThemeDeathTreatment;
  impact: ThemeDeathImpact;
  description: string;
  gravitas: number;
  wisdom: number;
  chapter: number;
}

export interface ThemeDeathPattern {
  patternId: string,
  entryIds: string[],
  cumulativeGravitas: number,
  range: number,
}

export interface NarrativeThemeDeathEngineState {
  entries: Map<string, ThemeDeathEntry>;
  patterns: Map<string, ThemeDeathPattern>;
  totalEntries: number;
  totalPatterns: number;
  averageGravitas: number;
  averageWisdom: number;
  patternRange: number;
  themeDeathMastery: number;
}

export function createNarrativeThemeDeathEngineState(): NarrativeThemeDeathEngineState {
  return { entries: new Map(), patterns: new Map(), totalEntries: 0, totalPatterns: 0, averageGravitas: 0.5, averageWisdom: 0.5, patternRange: 0.5, themeDeathMastery: 0.5 };
}

export function addThemeDeathEntry(state: NarrativeThemeDeathEngineState, entryId: string, aspect: ThemeDeathAspect, treatment: ThemeDeathTreatment, impact: ThemeDeathImpact, description: string, gravitas: number, wisdom: number, chapter: number): NarrativeThemeDeathEngineState {
  const entry: ThemeDeathEntry = { entryId, aspect, treatment, impact, description, gravitas, wisdom, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}

export function addThemeDeathPattern(state: NarrativeThemeDeathEngineState, patternId: string, entryIds: string[]): NarrativeThemeDeathEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeDeathEntry => e !== undefined);
  const cumulativeGravitas = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.gravitas, 0) / entries.length;
  const aspectSet = new Set(entries.map(e => e.aspect));
  const range = Math.min(1, aspectSet.size / 7);
  const pattern: ThemeDeathPattern = { patternId, entryIds, cumulativeGravitas, range };
  return recompute({ ...state, patterns: new Map(state.patterns).set(patternId, pattern), totalPatterns: state.patterns.size + 1 });
}

export function getThemeDeathEntriesByAspect(state: NarrativeThemeDeathEngineState, aspect: ThemeDeathAspect): ThemeDeathEntry[] {
  return Array.from(state.entries.values()).filter(e => e.aspect === aspect);
}

export function getThemeDeathReport(state: NarrativeThemeDeathEngineState): { totalEntries: number; totalPatterns: number; averageGravitas: number; averageWisdom: number; themeDeathMastery: number; recommendations: string[] } {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme death entries');
  if (state.averageGravitas < 0.5) recommendations.push('Low gravitas — strengthen');
  if (state.themeDeathMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalPatterns: state.totalPatterns, averageGravitas: Math.round(state.averageGravitas * 100) / 100, averageWisdom: Math.round(state.averageWisdom * 100) / 100, themeDeathMastery: Math.round(state.themeDeathMastery * 100) / 100, recommendations };
}

function recompute(state: NarrativeThemeDeathEngineState): NarrativeThemeDeathEngineState {
  const entries = Array.from(state.entries.values());
  const averageGravitas = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.gravitas, 0) / entries.length;
  const averageWisdom = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.wisdom, 0) / entries.length;
  const patterns = Array.from(state.patterns.values());
  const patternRange = patterns.length === 0 ? 0.5 : patterns.reduce((s, p) => s + p.range, 0) / patterns.length;
  const themeDeathMastery = (averageGravitas * 0.4 + averageWisdom * 0.3 + patternRange * 0.3);
  return { ...state, averageGravitas, averageWisdom, patternRange, themeDeathMastery };
}

export function resetNarrativeThemeDeathEngineState(): NarrativeThemeDeathEngineState {
  return createNarrativeThemeDeathEngineState();
}