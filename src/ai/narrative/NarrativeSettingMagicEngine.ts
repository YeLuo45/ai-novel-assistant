/**
 * V1646 NarrativeSettingMagicEngine — Direction O Iter 21/30 (Round 5)
 */
export type SettingMagicType = 'arcane' | 'divine' | 'natural' | 'psychic' | 'sacrificial' | 'transcendent' | 'infinite';
export type SettingMagicRule = 'none' | 'soft' | 'hard' | 'transcendent' | 'infinite';
export interface SettingMagicEntry { entryId: string; type: SettingMagicType; rule: SettingMagicRule; description: string; wonder: number; chapter: number; }
export interface SettingMagicSystem { systemId: string; entryIds: string[]; cumulativeWonder: number; breadth: number; }
export interface NarrativeSettingMagicEngineState { entries: Map<string, SettingMagicEntry>; systems: Map<string, SettingMagicSystem>; totalEntries: number; totalSystems: number; averageWonder: number; magicComplexity: number; magicMastery: number; }
export function createNarrativeSettingMagicEngineState(): NarrativeSettingMagicEngineState { return { entries: new Map(), systems: new Map(), totalEntries: 0, totalSystems: 0, averageWonder: 0.5, magicComplexity: 0.5, magicMastery: 0.5 }; }
export function addSettingMagicEntry(state: NarrativeSettingMagicEngineState, entryId: string, type: SettingMagicType, rule: SettingMagicRule, description: string, wonder: number, chapter: number): NarrativeSettingMagicEngineState {
  const entry: SettingMagicEntry = { entryId, type, rule, description, wonder, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addSettingMagicSystem(state: NarrativeSettingMagicEngineState, systemId: string, entryIds: string[]): NarrativeSettingMagicEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is SettingMagicEntry => e !== undefined);
  const cumulativeWonder = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.wonder, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const system: SettingMagicSystem = { systemId, entryIds, cumulativeWonder, breadth };
  return recompute({ ...state, systems: new Map(state.systems).set(systemId, system), totalSystems: state.systems.size + 1 });
}
export function getSettingMagicEntriesByType(state: NarrativeSettingMagicEngineState, type: SettingMagicType): SettingMagicEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getSettingMagicReport(state: NarrativeSettingMagicEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add setting magic entries');
  if (state.averageWonder < 0.5) recommendations.push('Low wonder — strengthen');
  if (state.magicMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalSystems: state.totalSystems, averageWonder: Math.round(state.averageWonder * 100) / 100, magicComplexity: Math.round(state.magicComplexity * 100) / 100, magicMastery: Math.round(state.magicMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeSettingMagicEngineState): NarrativeSettingMagicEngineState {
  const entries = Array.from(state.entries.values());
  const averageWonder = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.wonder, 0) / entries.length;
  const systems = Array.from(state.systems.values());
  const magicComplexity = systems.length === 0 ? 0.5 : systems.reduce((s, sy) => s + sy.breadth, 0) / systems.length;
  return { ...state, averageWonder, magicComplexity, magicMastery: averageWonder * 0.5 + magicComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeSettingMagicEngineState(): NarrativeSettingMagicEngineState { return createNarrativeSettingMagicEngineState(); }