/**
 * V1794 NarrativeSymbolSeasonEngine — Direction R Iter 5/30 (Round 5)
 */
export type SymbolSeasonType = 'spring' | 'summer' | 'autumn' | 'winter' | 'monsoon' | 'transcendent' | 'infinite';
export type SymbolSeasonQuality = 'rebirth' | 'peak' | 'decline' | 'death' | 'transition' | 'transcendent' | 'infinite';
export interface SymbolSeasonEntry { entryId: string; type: SymbolSeasonType; quality: SymbolSeasonQuality; description: string; resonance: number; chapter: number; }
export interface SymbolSeasonCalendar { calendarId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeSymbolSeasonEngineState { entries: Map<string, SymbolSeasonEntry>; calendars: Map<string, SymbolSeasonCalendar>; totalEntries: number; totalCalendars: number; averageResonance: number; seasonComplexity: number; seasonMastery: number; }
export function createNarrativeSymbolSeasonEngineState(): NarrativeSymbolSeasonEngineState { return { entries: new Map(), calendars: new Map(), totalEntries: 0, totalCalendars: 0, averageResonance: 0.5, seasonComplexity: 0.5, seasonMastery: 0.5 }; }
export function addSymbolSeasonEntry(state: NarrativeSymbolSeasonEngineState, entryId: string, type: SymbolSeasonType, quality: SymbolSeasonQuality, description: string, resonance: number, chapter: number): NarrativeSymbolSeasonEngineState {
  const entry: SymbolSeasonEntry = { entryId, type, quality, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSymbolSeasonCalendar(state: NarrativeSymbolSeasonEngineState, calendarId: string, entryIds: string[]): NarrativeSymbolSeasonEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SymbolSeasonEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const calendar: SymbolSeasonCalendar = { calendarId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, calendars: new Map(state.calendars).set(calendarId, calendar), totalCalendars: state.calendars.size + 1 });
}
export function getSymbolSeasonEntriesByType(state: NarrativeSymbolSeasonEngineState, type: SymbolSeasonType): SymbolSeasonEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSymbolSeasonReport(state: NarrativeSymbolSeasonEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add symbol season entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.seasonMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalCalendars: state.totalCalendars, averageResonance: Math.round(state.averageResonance * 100) / 100, seasonComplexity: Math.round(state.seasonComplexity * 100) / 100, seasonMastery: Math.round(state.seasonMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSymbolSeasonEngineState): NarrativeSymbolSeasonEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const calendars = Array.from(state.calendars.values());
  const seasonComplexity = calendars.length === 0 ? 0.5 : calendars.reduce((s, c) => s + c.breadth, 0) / calendars.length;
  return { ...state, averageResonance, seasonComplexity, seasonMastery: averageResonance * 0.5 + seasonComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSymbolSeasonEngineState(): NarrativeSymbolSeasonEngineState { return createNarrativeSymbolSeasonEngineState(); }