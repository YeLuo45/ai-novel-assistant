/**
 * V1694 NarrativeReaderTransportationEngine — Direction P Iter 15/30 (Round 5)
 */
export type ReaderTransportationType = 'attention' | 'imagery' | 'emotion' | 'narrative_presence' | 'transcendent' | 'infinite';
export type ReaderTransportationLevel = 'mild' | 'moderate' | 'strong' | 'total' | 'transcendent' | 'infinite';
export interface ReaderTransportationEntry { entryId: string; type: ReaderTransportationType; level: ReaderTransportationLevel; description: string; transport: number; chapter: number; }
export interface ReaderTransportationTrip { tripId: string; entryIds: string[]; cumulativeTransport: number; breadth: number; }
export interface NarrativeReaderTransportationEngineState { entries: Map<string, ReaderTransportationEntry>; trips: Map<string, ReaderTransportationTrip>; totalEntries: number; totalTrips: number; averageTransport: number; transportationComplexity: number; transportationMastery: number; }
export function createNarrativeReaderTransportationEngineState(): NarrativeReaderTransportationEngineState { return { entries: new Map(), trips: new Map(), totalEntries: 0, totalTrips: 0, averageTransport: 0.5, transportationComplexity: 0.5, transportationMastery: 0.5 }; }
export function addReaderTransportationEntry(state: NarrativeReaderTransportationEngineState, entryId: string, type: ReaderTransportationType, level: ReaderTransportationLevel, description: string, transport: number, chapter: number): NarrativeReaderTransportationEngineState {
  const entry: ReaderTransportationEntry = { entryId, type, level, description, transport, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}
export function addReaderTransportationTrip(state: NarrativeReaderTransportationEngineState, tripId: string, entryIds: string[]): NarrativeReaderTransportationEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ReaderTransportationEntry => e !== undefined);
  const cumulativeTransport = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.transport, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 6);
  const trip: ReaderTransportationTrip = { tripId, entryIds, cumulativeTransport, breadth };
  return recompute({ ...state, trips: new Map(state.trips).set(tripId, trip), totalTrips: state.trips.size + 1 });
}
export function getReaderTransportationEntriesByType(state: NarrativeReaderTransportationEngineState, type: ReaderTransportationType): ReaderTransportationEntry[] { return Array.from(state.entries.values()).filter(e => e.type === type); }
export function getReaderTransportationReport(state: NarrativeReaderTransportationEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add reader transportation entries');
  if (state.averageTransport < 0.5) recommendations.push('Low transport — strengthen');
  if (state.transportationMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalTrips: state.totalTrips, averageTransport: Math.round(state.averageTransport * 100) / 100, transportationComplexity: Math.round(state.transportationComplexity * 100) / 100, transportationMastery: Math.round(state.transportationMastery * 100) / 100, recommendations };
}
function recompute(state: NarrativeReaderTransportationEngineState): NarrativeReaderTransportationEngineState {
  const entries = Array.from(state.entries.values());
  const averageTransport = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.transport, 0) / entries.length;
  const trips = Array.from(state.trips.values());
  const transportationComplexity = trips.length === 0 ? 0.5 : trips.reduce((s, t) => s + t.breadth, 0) / trips.length;
  return { ...state, averageTransport, transportationComplexity, transportationMastery: averageTransport * 0.5 + transportationComplexity * 0.3 + Math.min(0.2, state.totalEntries / 100 * 0.2) };
}
export function resetNarrativeReaderTransportationEngineState(): NarrativeReaderTransportationEngineState { return createNarrativeReaderTransportationEngineState(); }