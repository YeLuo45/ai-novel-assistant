/**
 * V1654 NarrativeSettingLegendEngine — Direction O Iter 25/30 (Round 5)
 */
export type SettingLegendType = 'heroic' | 'trickster' | 'founder' | 'warning' | 'romantic' | 'transcendent' | 'infinite';
export type SettingLegendTruth = 'pure_fiction' | 'kernel_of_truth' | 'distorted' | 'accurate' | 'transcendent' | 'infinite';
export interface SettingLegendEntry { entryId: string; type: SettingLegendType; truth: SettingLegendTruth; description: string; weight: number; chapter: number; }
export interface SettingLegendRepertoire { repertoireId: string; entryIds: string[]; cumulativeWeight: number; breadth: number; }
export interface NarrativeSettingLegendEngineState { entries: Map<string, SettingLegendEntry>; repertoires: Map<string, SettingLegendRepertoire>; totalEntries: number; totalRepertoires: number; averageWeight: number; legendComplexity: number; legendMastery: number; }
export function createNarrativeSettingLegendEngineState(): NarrativeSettingLegendEngineState { return { entries: new Map(), repertoires: new Map(), totalEntries: 0, totalRepertoires: 0, averageWeight: 0.5, legendComplexity: 0.5, legendMastery: 0.5 }; }
export function addSettingLegendEntry(state: NarrativeSettingLegendEngineState, entryId: string, type: SettingLegendType, truth: SettingLegendTruth, description: string, weight: number, chapter: number): NarrativeSettingLegendEngineState {
  const entry: SettingLegendEntry = { entryId, type, truth, description, weight, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSettingLegendRepertoire(state: NarrativeSettingLegendEngineState, repertoireId: string, entryIds: string[]): NarrativeSettingLegendEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SettingLegendEntry => e !== undefined);
  const cumulativeWeight = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.weight, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const repertoire: SettingLegendRepertoire = { repertoireId, entryIds, cumulativeWeight, breadth };
  return recompute({ ...state, repertoires: new Map(state.repertoires).set(repertoireId, repertoire), totalRepertoires: state.repertoires.size + 1 });
}
export function getSettingLegendEntriesByType(state: NarrativeSettingLegendEngineState, type: SettingLegendType): SettingLegendEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSettingLegendReport(state: NarrativeSettingLegendEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add setting legend entries');
  if (state.averageWeight < 0.5) recommendations.push('Low weight — strengthen');
  if (state.legendMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalRepertoires: state.totalRepertoires, averageWeight: Math.round(state.averageWeight * 100) / 100, legendComplexity: Math.round(state.legendComplexity * 100) / 100, legendMastery: Math.round(state.legendMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSettingLegendEngineState): NarrativeSettingLegendEngineState {
  const entries = Array.from(state.entries.values());
  const averageWeight = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.weight, 0) / entries.length;
  const repertoires = Array.from(state.repertoires.values());
  const legendComplexity = repertoires.length === 0 ? 0.5 : repertoires.reduce((s, r) => s + r.breadth, 0) / repertoires.length;
  return { ...state, averageWeight, legendComplexity, legendMastery: averageWeight * 0.5 + legendComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSettingLegendEngineState(): NarrativeSettingLegendEngineState { return createNarrativeSettingLegendEngineState(); }