/**
 * V1388 NarrativeCharacterGrowthEngine — Direction K Iter 12/30 (Round 5)
 * Character growth engine: growth over time
 * Sources: ruflo growth + nanobot + thunderbolt
 */

export type CharacterGrowthAspect = 'skill' | 'wisdom' | 'empathy' | 'courage' | 'self_awareness' | 'mastery' | 'transcendent';
export type CharacterGrowthRate = 'static' | 'slow' | 'moderate' | 'rapid' | 'exponential' | 'infinite' | 'transcendent';
export type CharacterGrowthCatalyst = 'practice' | 'experience' | 'teaching' | 'struggle' | 'insight' | 'grace' | 'transcendent';

export interface CharacterGrowthEntry {
  entryId: string;
  aspect: CharacterGrowthAspect;
  rate: CharacterGrowthRate;
  catalyst: CharacterGrowthCatalyst;
  description: string;
  development: number;
  integration: number;
  chapter: number;
}

export interface CharacterGrowthCurve {
  curveId: string,
  entryIds: string[],
  cumulativeDevelopment: number,
  consistency: number,
}

export interface NarrativeCharacterGrowthEngineState {
  entries: Map<string, CharacterGrowthEntry>;
  curves: Map<string, CharacterGrowthCurve>;
  totalEntries: number;
  totalCurves: number;
  averageDevelopment: number;
  averageIntegration: number;
  curveConsistency: number;
  characterGrowthMastery: number;
}

export function createNarrativeCharacterGrowthEngineState(): NarrativeCharacterGrowthEngineState {
  return { entries: new Map(), curves: new Map(), totalEntries: 0, totalCurves: 0, averageDevelopment: 0.5, averageIntegration: 0.5, curveConsistency: 0.5, characterGrowthMastery: 0.5 };
}

export function addCharacterGrowthEntry(state: NarrativeCharacterGrowthEngineState, entryId: string, aspect: CharacterGrowthAspect, rate: CharacterGrowthRate, catalyst: CharacterGrowthCatalyst, description: string, development: number, integration: number, chapter: number): NarrativeCharacterGrowthEngineState {
  const entry: CharacterGrowthEntry = { entryId, aspect, rate, catalyst, description, development, integration, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}

export function addCharacterGrowthCurve(state: NarrativeCharacterGrowthEngineState, curveId: string, entryIds: string[]): NarrativeCharacterGrowthEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterGrowthEntry => e !== undefined);
  const cumulativeDevelopment = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.development, 0) / entries.length;
  const aspectSet = new Set(entries.map(e => e.aspect));
  const consistency = Math.min(1, aspectSet.size / 7);
  const curve: CharacterGrowthCurve = { curveId, entryIds, cumulativeDevelopment, consistency };
  return recompute({ ...state, curves: new Map(state.curves).set(curveId, curve), totalCurves: state.curves.size + 1 });
}

export function getCharacterGrowthEntriesByAspect(state: NarrativeCharacterGrowthEngineState, aspect: CharacterGrowthAspect): CharacterGrowthEntry[] {
  return Array.from(state.entries.values()).filter(e => e.aspect === aspect);
}

export function getCharacterGrowthReport(state: NarrativeCharacterGrowthEngineState): { totalEntries: number; totalCurves: number; averageDevelopment: number; averageIntegration: number; characterGrowthMastery: number; recommendations: string[] } {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character growth entries');
  if (state.averageDevelopment < 0.5) recommendations.push('Low development — strengthen');
  if (state.characterGrowthMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalCurves: state.totalCurves, averageDevelopment: Math.round(state.averageDevelopment * 100) / 100, averageIntegration: Math.round(state.averageIntegration * 100) / 100, characterGrowthMastery: Math.round(state.characterGrowthMastery * 100) / 100, recommendations };
}

function recompute(state: NarrativeCharacterGrowthEngineState): NarrativeCharacterGrowthEngineState {
  const entries = Array.from(state.entries.values());
  const averageDevelopment = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.development, 0) / entries.length;
  const averageIntegration = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.integration, 0) / entries.length;
  const curves = Array.from(state.curves.values());
  const curveConsistency = curves.length === 0 ? 0.5 : curves.reduce((s, c) => s + c.consistency, 0) / curves.length;
  const characterGrowthMastery = (averageDevelopment * 0.4 + averageIntegration * 0.3 + curveConsistency * 0.3);
  return { ...state, averageDevelopment, averageIntegration, curveConsistency, characterGrowthMastery };
}

export function resetNarrativeCharacterGrowthEngineState(): NarrativeCharacterGrowthEngineState {
  return createNarrativeCharacterGrowthEngineState();
}