/**
 * V1944 NarrativeCultureImperialismEngine — Direction T Iter 20/30 (Round 5)
 */
export type CultureImperialismType = 'formal' | 'informal' | 'economic' | 'cultural' | 'digital' | 'transcendent' | 'infinite';
export type CultureImperialismMechanism = 'military' | 'trade' | 'media' | 'technology' | 'transcendent' | 'infinite';
export interface CultureImperialismEntry { entryId: string; type: CultureImperialismType; mechanism: CultureImperialismMechanism; description: string; resonance: number; chapter: number; }
export interface CultureImperialismEmpire { empireId: string; entryIds: string[]; cumulativeResonance: number; breadth: number; }
export interface NarrativeCultureImperialismEngineState { entries: Map<string, CultureImperialismEntry>; empires: Map<string, CultureImperialismEmpire>; totalEntries: number; totalEmpires: number; averageResonance: number; imperialismComplexity: number; imperialismMastery: number; }
export function createNarrativeCultureImperialismEngineState(): NarrativeCultureImperialismEngineState { return { entries: new Map(), empires: new Map(), totalEntries: 0, totalEmpires: 0, averageResonance: 0.5, imperialismComplexity: 0.5, imperialismMastery: 0.5 }; }
export function addCultureImperialismEntry(state: NarrativeCultureImperialismEngineState, entryId: string, type: CultureImperialismType, mechanism: CultureImperialismMechanism, description: string, resonance: number, chapter: number): NarrativeCultureImperialismEngineState {
  const entry: CultureImperialismEntry = { entryId, type, mechanism, description, resonance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addCultureImperialismEmpire(state: NarrativeCultureImperialismEngineState, empireId: string, entryIds: string[]): NarrativeCultureImperialismEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CultureImperialismEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const empire: CultureImperialismEmpire = { empireId, entryIds, cumulativeResonance, breadth };
  return recompute({ ...state, empires: new Map(state.empires).set(empireId, empire), totalEmpires: state.empires.size + 1 });
}
export function getCultureImperialismEntriesByType(state: NarrativeCultureImperialismEngineState, type: CultureImperialismType): CultureImperialismEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getCultureImperialismReport(state: NarrativeCultureImperialismEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add culture imperialism entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.imperialismMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalEmpires: state.totalEmpires, averageResonance: Math.round(state.averageResonance * 100) / 100, imperialismComplexity: Math.round(state.imperialismComplexity * 100) / 100, imperialismMastery: Math.round(state.imperialismMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeCultureImperialismEngineState): NarrativeCultureImperialismEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const empires = Array.from(state.empires.values());
  const imperialismComplexity = empires.length === 0 ? 0.5 : empires.reduce((s, em) => s + em.breadth, 0) / empires.length;
  return { ...state, averageResonance, imperialismComplexity, imperialismMastery: averageResonance * 0.5 + imperialismComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeCultureImperialismEngineState(): NarrativeCultureImperialismEngineState { return createNarrativeCultureImperialismEngineState(); }