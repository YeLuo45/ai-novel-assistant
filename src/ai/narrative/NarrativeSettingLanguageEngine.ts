/**
 * V1648 NarrativeSettingLanguageEngine — Direction O Iter 22/30 (Round 5)
 */
export type SettingLanguageType = 'common' | 'formal' | 'archaic' | 'specialized' | 'invented' | 'transcendent' | 'infinite';
export type SettingLanguageUse = 'everyday' | 'formal' | 'literary' | 'ritual' | 'transcendent' | 'infinite';
export interface SettingLanguageEntry { entryId: string; type: SettingLanguageType; use: SettingLanguageUse; description: string; eloquence: number; chapter: number; }
export interface SettingLanguageFamily { familyId: string; entryIds: string[]; cumulativeEloquence: number; breadth: number; }
export interface NarrativeSettingLanguageEngineState { entries: Map<string, SettingLanguageEntry>; families: Map<string, SettingLanguageFamily>; totalEntries: number; totalFamilies: number; averageEloquence: number; languageComplexity: number; languageMastery: number; }
export function createNarrativeSettingLanguageEngineState(): NarrativeSettingLanguageEngineState { return { entries: new Map(), families: new Map(), totalEntries: 0, totalFamilies: 0, averageEloquence: 0.5, languageComplexity: 0.5, languageMastery: 0.5 }; }
export function addSettingLanguageEntry(state: NarrativeSettingLanguageEngineState, entryId: string, type: SettingLanguageType, use: SettingLanguageUse, description: string, eloquence: number, chapter: number): NarrativeSettingLanguageEngineState {
  const entry: SettingLanguageEntry = { entryId, type, use, description, eloquence, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSettingLanguageFamily(state: NarrativeSettingLanguageEngineState, familyId: string, entryIds: string[]): NarrativeSettingLanguageEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SettingLanguageEntry => e !== undefined);
  const cumulativeEloquence = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.eloquence, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const family: SettingLanguageFamily = { familyId, entryIds, cumulativeEloquence, breadth };
  return recompute({ ...state, families: new Map(state.families).set(familyId, family), totalFamilies: state.families.size + 1 });
}
export function getSettingLanguageEntriesByType(state: NarrativeSettingLanguageEngineState, type: SettingLanguageType): SettingLanguageEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSettingLanguageReport(state: NarrativeSettingLanguageEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add setting language entries');
  if (state.averageEloquence < 0.5) recommendations.push('Low eloquence — strengthen');
  if (state.languageMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalFamilies: state.totalFamilies, averageEloquence: Math.round(state.averageEloquence * 100) / 100, languageComplexity: Math.round(state.languageComplexity * 100) / 100, languageMastery: Math.round(state.languageMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSettingLanguageEngineState): NarrativeSettingLanguageEngineState {
  const entries = Array.from(state.entries.values());
  const averageEloquence = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.eloquence, 0) / entries.length;
  const families = Array.from(state.families.values());
  const languageComplexity = families.length === 0 ? 0.5 : families.reduce((s, f) => s + f.breadth, 0) / families.length;
  return { ...state, averageEloquence, languageComplexity, languageMastery: averageEloquence * 0.5 + languageComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSettingLanguageEngineState(): NarrativeSettingLanguageEngineState { return createNarrativeSettingLanguageEngineState(); }