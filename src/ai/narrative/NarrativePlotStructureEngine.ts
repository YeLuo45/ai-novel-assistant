/**
 * V1486 NarrativePlotStructureEngine — Direction M Iter 1/30 (Round 5)
 * Plot structure engine: 3-act + 5-act + hero's journey + others
 * Sources: thunderbolt structure + nanobot + ruflo
 */

export type PlotStructureType = 'three_act' | 'five_act' | 'hero_journey' | 'freytag' | 'fichtean' | 'snowflake' | 'in_medias_res' | 'frame' | 'episodic' | 'modular' | 'transcendent' | 'infinite';
export type PlotStructurePhase = 'setup' | 'rising' | 'crisis' | 'climax' | 'falling' | 'resolution' | 'denouement' | 'transcendent' | 'infinite';
export type PlotStructurePacing = 'glacial' | 'slow' | 'moderate' | 'brisk' | 'rapid' | 'breakneck' | 'lightning' | 'transcendent' | 'infinite';

export interface PlotStructureEntry {
  entryId: string;
  type: PlotStructureType;
  phase: PlotStructurePhase;
  pacing: PlotStructurePacing;
  description: string;
  tension: number;
  chapter: number;
}

export interface PlotStructureBeat {
  beatId: string;
  entryIds: string[];
  cumulativeTension: number;
  breadth: number;
}

export interface NarrativePlotStructureEngineState {
  entries: Map<string, PlotStructureEntry>;
  beats: Map<string, PlotStructureBeat>;
  totalEntries: number;
  totalBeats: number;
  averageTension: number;
  structureComplexity: number;
  plotMastery: number;
}

export function createNarrativePlotStructureEngineState(): NarrativePlotStructureEngineState {
  return { entries: new Map(), beats: new Map(), totalEntries: 0, totalBeats: 0, averageTension: 0.5, structureComplexity: 0.5, plotMastery: 0.5 };
}

export function addPlotStructureEntry(state: NarrativePlotStructureEngineState, entryId: string, type: PlotStructureType, phase: PlotStructurePhase, pacing: PlotStructurePacing, description: string, tension: number, chapter: number): NarrativePlotStructureEngineState {
  const entry: PlotStructureEntry = { entryId, type, phase, pacing, description, tension, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}

export function addPlotStructureBeat(state: NarrativePlotStructureEngineState, beatId: string, entryIds: string[]): NarrativePlotStructureEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is PlotStructureEntry => e !== undefined);
  const cumulativeTension = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.tension, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 12);
  const beat: PlotStructureBeat = { beatId, entryIds, cumulativeTension, breadth };
  return recompute({ ...state, beats: new Map(state.beats).set(beatId, beat), totalBeats: state.beats.size + 1 });
}

export function getPlotStructureEntriesByType(state: NarrativePlotStructureEngineState, type: PlotStructureType): PlotStructureEntry[] {
  return Array.from(state.entries.values()).filter(e => e.type === type);
}

export function getPlotStructureReport(state: NarrativePlotStructureEngineState) {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add plot structure entries');
  if (state.averageTension < 0.5) recommendations.push('Low tension — strengthen');
  if (state.plotMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalBeats: state.totalBeats, averageTension: Math.round(state.averageTension * 100) / 100, structureComplexity: Math.round(state.structureComplexity * 100) / 100, plotMastery: Math.round(state.plotMastery * 100) / 100, recommendations };
}

function recompute(state: NarrativePlotStructureEngineState): NarrativePlotStructureEngineState {
  const entries = Array.from(state.entries.values());
  const averageTension = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.tension, 0) / entries.length;
  const beats = Array.from(state.beats.values());
  const structureComplexity = beats.length === 0 ? 0.5 : beats.reduce((s, b) => s + b.breadth, 0) / beats.length;
  const plotMastery = (averageTension * 0.4 + structureComplexity * 0.3 + (state.totalEntries / 100) * 0.3);
  return { ...state, averageTension, structureComplexity, plotMastery: Math.min(1, plotMastery) };
}

export function resetNarrativePlotStructureEngineState(): NarrativePlotStructureEngineState {
  return createNarrativePlotStructureEngineState();
}