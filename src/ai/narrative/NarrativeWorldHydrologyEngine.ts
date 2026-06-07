/**
 * V1326 NarrativeWorldHydrologyEngine — Direction J Iter 11/30 (Round 5)
 * World hydrology engine: water systems of narrative world
 * Sources: thunderbolt hydrology + nanobot + ruflo
 */

export type WorldHydrologyBody = 'river' | 'lake' | 'ocean' | 'stream' | 'spring' | 'underground' | 'transcendent';
export type WorldHydrologyFlow = 'stagnant' | 'slow' | 'moderate' | 'fast' | 'rushing' | 'legendary' | 'transcendent';
export type WorldHydrologyPurity = 'muddy' | 'murky' | 'clear' | 'pure' | 'crystal' | 'ethereal' | 'transcendent';

export interface WorldHydrologyEntry {
  entryId: string;
  body: WorldHydrologyBody;
  flow: WorldHydrologyFlow;
  purity: WorldHydrologyPurity;
  description: string;
  depth: number;
  mystery: number;
  chapter: number;
}

export interface WorldHydrologyNetwork {
  networkId: string,
  entryIds: string[],
  cumulativeDepth: number,
  flow: number,
}

export interface NarrativeWorldHydrologyEngineState {
  entries: Map<string, WorldHydrologyEntry>;
  networks: Map<string, WorldHydrologyNetwork>;
  totalEntries: number;
  totalNetworks: number;
  averageDepth: number;
  averageMystery: number;
  networkFlow: number;
  worldHydrologyMastery: number;
}

// Factory
export function createNarrativeWorldHydrologyEngineState(): NarrativeWorldHydrologyEngineState {
  return {
    entries: new Map(),
    networks: new Map(),
    totalEntries: 0,
    totalNetworks: 0,
    averageDepth: 0.5,
    averageMystery: 0.5,
    networkFlow: 0.5,
    worldHydrologyMastery: 0.5,
  };
}

// Add entry
export function addWorldHydrologyEntry(
  state: NarrativeWorldHydrologyEngineState,
  entryId: string,
  body: WorldHydrologyBody,
  flow: WorldHydrologyFlow,
  purity: WorldHydrologyPurity,
  description: string,
  depth: number,
  mystery: number,
  chapter: number
): NarrativeWorldHydrologyEngineState {
  const entry: WorldHydrologyEntry = { entryId, body, flow, purity, description, depth, mystery, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldHydrology({ ...state, entries, totalEntries: entries.size });
}

// Add network
export function addWorldHydrologyNetwork(
  state: NarrativeWorldHydrologyEngineState,
  networkId: string,
  entryIds: string[]
): NarrativeWorldHydrologyEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldHydrologyEntry => e !== undefined);
  const cumulativeDepth = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.depth, 0) / entries.length;
  const bodySet = new Set(entries.map(e => e.body));
  const flow = Math.min(1, bodySet.size / 7);
  const network: WorldHydrologyNetwork = { networkId, entryIds, cumulativeDepth, flow };
  const networks = new Map(state.networks).set(networkId, network);
  return recomputeWorldHydrology({ ...state, networks, totalNetworks: networks.size });
}

// Get entries by body
export function getWorldHydrologyEntriesByBody(state: NarrativeWorldHydrologyEngineState, body: WorldHydrologyBody): WorldHydrologyEntry[] {
  return Array.from(state.entries.values()).filter(e => e.body === body);
}

// Get world hydrology report
export function getWorldHydrologyReport(state: NarrativeWorldHydrologyEngineState): {
  totalEntries: number;
  totalNetworks: number;
  averageDepth: number;
  averageMystery: number;
  worldHydrologyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world hydrology entries');
  if (state.averageDepth < 0.5) recommendations.push('Low depth — strengthen');
  if (state.worldHydrologyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalNetworks: state.totalNetworks,
    averageDepth: Math.round(state.averageDepth * 100) / 100,
    averageMystery: Math.round(state.averageMystery * 100) / 100,
    worldHydrologyMastery: Math.round(state.worldHydrologyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldHydrology(state: NarrativeWorldHydrologyEngineState): NarrativeWorldHydrologyEngineState {
  const entries = Array.from(state.entries.values());
  const averageDepth = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.depth, 0) / entries.length;
  const averageMystery = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.mystery, 0) / entries.length;

  const networks = Array.from(state.networks.values());
  const networkFlow = networks.length === 0 ? 0.5
    : networks.reduce((s, n) => s + n.flow, 0) / networks.length;

  const worldHydrologyMastery = (averageDepth * 0.4 + averageMystery * 0.3 + networkFlow * 0.3);

  return { ...state, averageDepth, averageMystery, networkFlow, worldHydrologyMastery };
}

// Reset
export function resetNarrativeWorldHydrologyEngineState(): NarrativeWorldHydrologyEngineState {
  return createNarrativeWorldHydrologyEngineState();
}