/**
 * V1430 NarrativeThemePowerEngine — Direction L Iter 3/30 (Round 5)
 * Theme power engine: power as narrative theme
 * Sources: ruflo power + nanobot + thunderbolt
 */

export type ThemePowerType = 'political' | 'social' | 'economic' | 'physical' | 'magical' | 'spiritual' | 'transcendent';
export type ThemePowerCorruption = 'pure' | 'tempting' | 'corrosive' | 'corrupting' | 'absolute' | 'transcendent' | 'infinite';
export type ThemePowerExpression = 'subtle' | 'overt' | 'violent' | 'systemic' | 'cosmic' | 'absolute' | 'transcendent';

export interface ThemePowerEntry {
  entryId: string;
  type: ThemePowerType;
  corruption: ThemePowerCorruption;
  expression: ThemePowerExpression;
  description: string;
  weight: number;
  consequence: number;
  chapter: number;
}

export interface ThemePowerNetwork {
  networkId: string,
  entryIds: string[],
  cumulativeWeight: number,
  complexity: number,
}

export interface NarrativeThemePowerEngineState {
  entries: Map<string, ThemePowerEntry>;
  networks: Map<string, ThemePowerNetwork>;
  totalEntries: number;
  totalNetworks: number;
  averageWeight: number;
  averageConsequence: number;
  networkComplexity: number;
  themePowerMastery: number;
}

export function createNarrativeThemePowerEngineState(): NarrativeThemePowerEngineState {
  return { entries: new Map(), networks: new Map(), totalEntries: 0, totalNetworks: 0, averageWeight: 0.5, averageConsequence: 0.5, networkComplexity: 0.5, themePowerMastery: 0.5 };
}

export function addThemePowerEntry(state: NarrativeThemePowerEngineState, entryId: string, type: ThemePowerType, corruption: ThemePowerCorruption, expression: ThemePowerExpression, description: string, weight: number, consequence: number, chapter: number): NarrativeThemePowerEngineState {
  const entry: ThemePowerEntry = { entryId, type, corruption, expression, description, weight, consequence, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}

export function addThemePowerNetwork(state: NarrativeThemePowerEngineState, networkId: string, entryIds: string[]): NarrativeThemePowerEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is ThemePowerEntry => e !== undefined);
  const cumulativeWeight = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.weight, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const complexity = Math.min(1, typeSet.size / 7);
  const network: ThemePowerNetwork = { networkId, entryIds, cumulativeWeight, complexity };
  return recompute({ ...state, networks: new Map(state.networks).set(networkId, network), totalNetworks: state.networks.size + 1 });
}

export function getThemePowerEntriesByType(state: NarrativeThemePowerEngineState, type: ThemePowerType): ThemePowerEntry[] {
  return Array.from(state.entries.values()).filter(e => e.type === type);
}

export function getThemePowerReport(state: NarrativeThemePowerEngineState): { totalEntries: number; totalNetworks: number; averageWeight: number; averageConsequence: number; themePowerMastery: number; recommendations: string[] } {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add theme power entries');
  if (state.averageWeight < 0.5) recommendations.push('Low weight — strengthen');
  if (state.themePowerMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalNetworks: state.totalNetworks, averageWeight: Math.round(state.averageWeight * 100) / 100, averageConsequence: Math.round(state.averageConsequence * 100) / 100, themePowerMastery: Math.round(state.themePowerMastery * 100) / 100, recommendations };
}

function recompute(state: NarrativeThemePowerEngineState): NarrativeThemePowerEngineState {
  const entries = Array.from(state.entries.values());
  const averageWeight = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.weight, 0) / entries.length;
  const averageConsequence = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.consequence, 0) / entries.length;
  const networks = Array.from(state.networks.values());
  const networkComplexity = networks.length === 0 ? 0.5 : networks.reduce((s, n) => s + n.complexity, 0) / networks.length;
  const themePowerMastery = (averageWeight * 0.4 + averageConsequence * 0.3 + networkComplexity * 0.3);
  return { ...state, averageWeight, averageConsequence, networkComplexity, themePowerMastery };
}

export function resetNarrativeThemePowerEngineState(): NarrativeThemePowerEngineState {
  return createNarrativeThemePowerEngineState();
}