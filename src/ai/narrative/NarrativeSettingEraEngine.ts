/**
 * V1628 NarrativeSettingEraEngine — Direction O Iter 12/30 (Round 5)
 */
export type SettingEraType = 'dawn' | 'rise' | 'peak' | 'decline' | 'fall' | 'reborn' | 'transcendent' | 'infinite';
export type SettingEraActivity = 'building' | 'stable' | 'changing' | 'collapsing' | 'transcendent' | 'infinite';
export interface SettingEraEntry { entryId: string; type: SettingEraType; activity: SettingEraActivity; description: string; momentum: number; chapter: number; }
export interface SettingEraPhase { phaseId: string; entryIds: string[]; cumulativeMomentum: number; breadth: number; }
export interface NarrativeSettingEraEngineState { entries: Map<string, SettingEraEntry>; phases: Map<string, SettingEraPhase>; totalEntries: number; totalPhases: number; averageMomentum: number; eraComplexity: number; eraMastery: number; }
export function createNarrativeSettingEraEngineState(): NarrativeSettingEraEngineState { return { entries: new Map(), phases: new Map(), totalEntries: 0, totalPhases: 0, averageMomentum: 0.5, eraComplexity: 0.5, eraMastery: 0.5 }; }
export function addSettingEraEntry(state: NarrativeSettingEraEngineState, entryId: string, type: SettingEraType, activity: SettingEraActivity, description: string, momentum: number, chapter: number): NarrativeSettingEraEngineState {
  const entry: SettingEraEntry = { entryId, type, activity, description, momentum, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSettingEraPhase(state: NarrativeSettingEraEngineState, phaseId: string, entryIds: string[]): NarrativeSettingEraEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SettingEraEntry => e !== undefined);
  const cumulativeMomentum = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.momentum, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 8);
  const phase: SettingEraPhase = { phaseId, entryIds, cumulativeMomentum, breadth };
  return recompute({ ...state, phases: new Map(state.phases).set(phaseId, phase), totalPhases: state.phases.size + 1 });
}
export function getSettingEraEntriesByType(state: NarrativeSettingEraEngineState, type: SettingEraType): SettingEraEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSettingEraReport(state: NarrativeSettingEraEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add setting era entries');
  if (state.averageMomentum < 0.5) recommendations.push('Low momentum — strengthen');
  if (state.eraMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalPhases: state.totalPhases, averageMomentum: Math.round(state.averageMomentum * 100) / 100, eraComplexity: Math.round(state.eraComplexity * 100) / 100, eraMastery: Math.round(state.eraMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSettingEraEngineState): NarrativeSettingEraEngineState {
  const entries = Array.from(state.entries.values());
  const averageMomentum = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.momentum, 0) / entries.length;
  const phases = Array.from(state.phases.values());
  const eraComplexity = phases.length === 0 ? 0.5 : phases.reduce((s, ph) => s + ph.breadth, 0) / phases.length;
  return { ...state, averageMomentum, eraComplexity, eraMastery: averageMomentum * 0.5 + eraComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSettingEraEngineState(): NarrativeSettingEraEngineState { return createNarrativeSettingEraEngineState(); }