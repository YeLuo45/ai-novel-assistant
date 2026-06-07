/**
 * V1432 NarrativeThemeFreedomEngine — Direction L Iter 4/30 (Round 5)
 * Theme freedom engine: freedom as narrative theme
 * Sources: nanobot freedom + thunderbolt + ruflo
 */

export type ThemeFreedomType = 'physical' | 'mental' | 'emotional' | 'spiritual' | 'social' | 'absolute' | 'transcendent';
export type ThemeFreedomCost = 'minimal' | 'moderate' | 'heavy' | 'extreme' | 'total' | 'transcendent' | 'infinite';
export type ThemeFreedomOpposition = 'internal' | 'external' | 'systemic' | 'cosmic' | 'paradoxical' | 'transcendent' | 'absolute';

export interface ThemeFreedomEntry {
  entryId: string;
  type: ThemeFreedomType;
  cost: ThemeFreedomCost;
  opposition: ThemeFreedomOpposition;
  description: string;
  liberation: number;
  responsibility: number;
  chapter: number;
}

export interface ThemeFreedomStruggle {
  struggleId: string,
  entryIds: string[],
  cumulativeLiberation: number,
  intensity: number,
}

export interface NarrativeThemeFreedomEngineState {
  entries: Map<string, ThemeFreedomEntry>;
  struggles: Map<string, ThemeFreedomStruggle>;
  totalEntries: number;
  totalStruggles: number;
  averageLiberation: number;
  averageResponsibility: number;
  struggleIntensity: number;
  themeFreedomMastery: number;
}

export function createNarrativeThemeFreedomEngineState(): NarrativeThemeFreedomEngineState {
  return { entries: new Map(), struggles: new Map(), totalEntries: 0, totalStruggles: 0, averageLiberation: 0.5, averageResponsibility: 0.5, struggleIntensity: 0.5, themeFreedomMastery: 0.5 };
}

export function addThemeFreedomEntry(state: NarrativeThemeFreedomEngineState, entryId: string, type: ThemeFreedomType, cost: ThemeFreedomCost, opposition: ThemeFreedomOpposition, description: string, liberation: number, responsibility: number, chapter: number): NarrativeThemeFreedomEngineState {
  const entry: ThemeFreedomEntry = { entryId, type, cost, opposition, description, liberation, responsibility, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}

export function addThemeFreedomStruggle(state: NarrativeThemeFreedomEngineState, struggleId: string, entryIds: string[]): NarrativeThemeFreedomEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemeFreedomEntry => e !== undefined);
  const cumulativeLiberation = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.liberation, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const intensity = Math.min(1, typeSet.size / 7);
  const struggle: ThemeFreedomStruggle = { struggleId, entryIds, cumulativeLiberation, intensity };
  return recompute({ ...state, struggles: new Map(state.struggles).set(struggleId, struggle), totalStruggles: state.struggles.size + 1 });
}

export function getThemeFreedomEntriesByType(state: NarrativeThemeFreedomEngineState, type: ThemeFreedomType): ThemeFreedomEntry[] {
  return Array.from(state.entries.values()).filter(e => e.type === type);
}

export function getThemeFreedomReport(state: NarrativeThemeFreedomEngineState): { totalEntries: number; totalStruggles: number; averageLiberation: number; averageResponsibility: number; themeFreedomMastery: number; recommendations: string[] } {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme freedom entries');
  if (state.averageLiberation < 0.5) recommendations.push('Low liberation — strengthen');
  if (state.themeFreedomMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalStruggles: state.totalStruggles, averageLiberation: Math.round(state.averageLiberation * 100) / 100, averageResponsibility: Math.round(state.averageResponsibility * 100) / 100, themeFreedomMastery: Math.round(state.themeFreedomMastery * 100) / 100, recommendations };
}

function recompute(state: NarrativeThemeFreedomEngineState): NarrativeThemeFreedomEngineState {
  const entries = Array.from(state.entries.values());
  const averageLiberation = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.liberation, 0) / entries.length;
  const averageResponsibility = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.responsibility, 0) / entries.length;
  const struggles = Array.from(state.struggles.values());
  const struggleIntensity = struggles.length === 0 ? 0.5 : struggles.reduce((s, st) => s + st.intensity, 0) / struggles.length;
  const themeFreedomMastery = (averageLiberation * 0.4 + averageResponsibility * 0.3 + struggleIntensity * 0.3);
  return { ...state, averageLiberation, averageResponsibility, struggleIntensity, themeFreedomMastery };
}

export function resetNarrativeThemeFreedomEngineState(): NarrativeThemeFreedomEngineState {
  return createNarrativeThemeFreedomEngineState();
}