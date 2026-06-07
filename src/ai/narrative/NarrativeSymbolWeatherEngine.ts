/**
 * V1828 NarrativeSymbolWeatherEngine — Direction R Iter 22/30 (Round 5)
 */
export type SymbolWeatherType = 'storm' | 'rainbow' | 'mist' | 'sunshine' | 'snow' | 'wind' | 'transcendent' | 'infinite';
export type SymbolWeatherEmotion = 'conflict' | 'hope' | 'mystery' | 'joy' | 'purity' | 'transcendent' | 'infinite';
export interface SymbolWeatherEntry { entryId: string; type: SymbolWeatherType; emotion: SymbolWeatherEmotion; description: string; resonance: number; chapter: number; }
export interface SymbolWeatherPattern { patternId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeSymbolWeatherEngineState { entries: Map<string, SymbolWeatherEntry>; patterns: Map<string, SymbolWeatherPattern>; totalEntries: number; totalPatterns: number; averageResonance: number; weatherComplexity: number; weatherMastery: number; }
export function createNarrativeSymbolWeatherEngineState(): NarrativeSymbolWeatherEngineState { return { entries: new Map(), patterns: new Map(), totalEntries: 0, totalPatterns: 0, averageResonance: 0.5, weatherComplexity: 0.5, weatherMastery: 0.5 }; }
export function addSymbolWeatherEntry(state: NarrativeSymbolWeatherEngineState, entryId: string, type: SymbolWeatherType, emotion: SymbolWeatherEmotion, description: string, resonance: number, chapter: number): NarrativeSymbolWeatherEngineState {
  const entry: SymbolWeatherEntry = { entryId, type, emotion, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSymbolWeatherPattern(state: NarrativeSymbolWeatherEngineState, patternId: string, entryIds: string[]): NarrativeSymbolWeatherEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SymbolWeatherEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const pattern: SymbolWeatherPattern = { patternId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, patterns: new Map(state.patterns).set(patternId, pattern), totalPatterns: state.patterns.size + 1 });
}
export function getSymbolWeatherEntriesByType(state: NarrativeSymbolWeatherEngineState, type: SymbolWeatherType): SymbolWeatherEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSymbolWeatherReport(state: NarrativeSymbolWeatherEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add symbol weather entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.weatherMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalPatterns: state.totalPatterns, averageResonance: Math.round(state.averageResonance * 100) / 100, weatherComplexity: Math.round(state.weatherComplexity * 100) / 100, weatherMastery: Math.round(state.weatherMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSymbolWeatherEngineState): NarrativeSymbolWeatherEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const patterns = Array.from(state.patterns.values());
  const weatherComplexity = patterns.length === 0 ? 0.5 : patterns.reduce((s, p) => s + p.breadth, 0) / patterns.length;
  return { ...state, averageResonance, weatherComplexity, weatherMastery: averageResonance * 0.5 + weatherComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSymbolWeatherEngineState(): NarrativeSymbolWeatherEngineState { return createNarrativeSymbolWeatherEngineState(); }