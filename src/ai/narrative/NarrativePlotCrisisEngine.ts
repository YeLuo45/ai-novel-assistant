/**
 * V1510 NarrativePlotCrisisEngine — Direction M Iter 13/30 (Round 5)
 */
export type PlotCrisisType = 'choice' | 'confrontation' | 'revelation' | 'turning_point' | 'stakes' | 'transcendent' | 'infinite';
export type PlotCrisisStakes = 'personal' | 'interpersonal' | 'communal' | 'global' | 'existential' | 'transcendent' | 'infinite';
export interface PlotCrisisEntry { entryId: string; type: PlotCrisisType; stakes: PlotCrisisStakes; description: string; urgency: number; chapter: number; }
export interface PlotCrisisPoint { pointId: string; entryIds: string[]; cumulativeUrgency: number; breadth: number; }
export interface NarrativePlotCrisisEngineState { entries: Map<string, PlotCrisisEntry>; points: Map<string, PlotCrisisPoint>; totalEntries: number; totalPoints: number; averageUrgency: number; crisisComplexity: number; crisisMastery: number; }
export function createNarrativePlotCrisisEngineState(): NarrativePlotCrisisEngineState { return { entries: new Map(), points: new Map(), totalEntries: 0, totalPoints: 0, averageUrgency: 0.5, crisisComplexity: 0.5, crisisMastery: 0.5 }; }
export function addPlotCrisisEntry(state: NarrativePlotCrisisEngineState, entryId: string, type: PlotCrisisType, stakes: PlotCrisisStakes, description: string, urgency: number, chapter: number): NarrativePlotCrisisEngineState {
  const entry: PlotCrisisEntry = { entryId, type, stakes, description, urgency, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addPlotCrisisPoint(state: NarrativePlotCrisisEngineState, pointId: string, entryIds: string[]): NarrativePlotCrisisEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is PlotCrisisEntry => e !== undefined);
  const cumulativeUrgency = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.urgency, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const point: PlotCrisisPoint = { pointId, entryIds, cumulativeUrgency, breadth };
  return recompute({ ...state, points: new Map(state.points).set(pointId, point), totalPoints: state.points.size + 1 });
}
export function getPlotCrisisEntriesByType(state: NarrativePlotCrisisEngineState, type: PlotCrisisType): PlotCrisisEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getPlotCrisisReport(state: NarrativePlotCrisisEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add plot crisis entries');
  if (state.averageUrgency < 0.5) recommendations.push('Low urgency — strengthen');
  if (state.crisisMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalPoints: state.totalPoints, averageUrgency: Math.round(state.averageUrgency * 100) / 100, crisisComplexity: Math.round(state.crisisComplexity * 100) / 100, crisisMastery: Math.round(state.crisisMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativePlotCrisisEngineState): NarrativePlotCrisisEngineState {
  const entries = Array.from(state.entries.values());
  const averageUrgency = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.urgency, 0) / entries.length;
  const points = Array.from(state.points.values());
  const crisisComplexity = points.length === 0 ? 0.5 : points.reduce((s, p) => s + p.breadth, 0) / points.length;
  return { ...state, averageUrgency, crisisComplexity, crisisMastery: averageUrgency * 0.5 + crisisComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativePlotCrisisEngineState(): NarrativePlotCrisisEngineState { return createNarrativePlotCrisisEngineState(); }