/**
 * V1378 NarrativeCharacterRelationshipEngine — Direction K Iter 7/30 (Round 5)
 * Character relationship engine: relationships between characters
 * Sources: nanobot relationship + thunderbolt + ruflo
 */

export type CharacterRelationshipType = 'alliance' | 'rivalry' | 'romance' | 'family' | 'mentorship' | 'enmity' | 'transcendent';
export type CharacterRelationshipDepth = 'surface' | 'functional' | 'meaningful' | 'deep' | 'profound' | 'transcendent' | 'absolute';
export type CharacterRelationshipEvolution = 'static' | 'evolving' | 'transformative' | 'cyclical' | 'spiral' | 'infinite' | 'transcendent';

export interface CharacterRelationshipEntry {
  entryId: string;
  type: CharacterRelationshipType;
  depth: CharacterRelationshipDepth;
  evolution: CharacterRelationshipEvolution;
  description: string;
  authenticity: number;
  complexity: number;
  chapter: number;
}

export interface CharacterRelationshipNetwork {
  networkId: string,
  entryIds: string[],
  cumulativeAuthenticity: number,
  breadth: number,
}

export interface NarrativeCharacterRelationshipEngineState {
  entries: Map<string, CharacterRelationshipEntry>;
  networks: Map<string, CharacterRelationshipNetwork>;
  totalEntries: number;
  totalNetworks: number;
  averageAuthenticity: number;
  averageComplexity: number;
  networkBreadth: number;
  characterRelationshipMastery: number;
}

// Factory
export function createNarrativeCharacterRelationshipEngineState(): NarrativeCharacterRelationshipEngineState {
  return {
    entries: new Map(),
    networks: new Map(),
    totalEntries: 0,
    totalNetworks: 0,
    averageAuthenticity: 0.5,
    averageComplexity: 0.5,
    networkBreadth: 0.5,
    characterRelationshipMastery: 0.5,
  };
}

// Add entry
export function addCharacterRelationshipEntry(
  state: NarrativeCharacterRelationshipEngineState,
  entryId: string,
  type: CharacterRelationshipType,
  depth: CharacterRelationshipDepth,
  evolution: CharacterRelationshipEvolution,
  description: string,
  authenticity: number,
  complexity: number,
  chapter: number
): NarrativeCharacterRelationshipEngineState {
  const entry: CharacterRelationshipEntry = { entryId, type, depth, evolution, description, authenticity, complexity, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeCharacterRelationship({ ...state, entries, totalEntries: entries.size });
}

// Add network
export function addCharacterRelationshipNetwork(
  state: NarrativeCharacterRelationshipEngineState,
  networkId: string,
  entryIds: string[]
): NarrativeCharacterRelationshipEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterRelationshipEntry => e !== undefined);
  const cumulativeAuthenticity = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.authenticity, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const network: CharacterRelationshipNetwork = { networkId, entryIds, cumulativeAuthenticity, breadth };
  const networks = new Map(state.networks).set(networkId, network);
  return recomputeCharacterRelationship({ ...state, networks, totalNetworks: networks.size });
}

// Get entries by type
export function getCharacterRelationshipEntriesByType(state: NarrativeCharacterRelationshipEngineState, type: CharacterRelationshipType): CharacterRelationshipEntry[] {
  return Array.from(state.entries.values()).filter(e => e.type === type);
}

// Get character relationship report
export function getCharacterRelationshipReport(state: NarrativeCharacterRelationshipEngineState): {
  totalEntries: number;
  totalNetworks: number;
  averageAuthenticity: number;
  averageComplexity: number;
  characterRelationshipMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character relationship entries');
  if (state.averageAuthenticity < 0.5) recommendations.push('Low authenticity — strengthen');
  if (state.characterRelationshipMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalNetworks: state.totalNetworks,
    averageAuthenticity: Math.round(state.averageAuthenticity * 100) / 100,
    averageComplexity: Math.round(state.averageComplexity * 100) / 100,
    characterRelationshipMastery: Math.round(state.characterRelationshipMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCharacterRelationship(state: NarrativeCharacterRelationshipEngineState): NarrativeCharacterRelationshipEngineState {
  const entries = Array.from(state.entries.values());
  const averageAuthenticity = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.authenticity, 0) / entries.length;
  const averageComplexity = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.complexity, 0) / entries.length;

  const networks = Array.from(state.networks.values());
  const networkBreadth = networks.length === 0 ? 0.5
    : networks.reduce((s, n) => s + n.breadth, 0) / networks.length;

  const characterRelationshipMastery = (averageAuthenticity * 0.4 + averageComplexity * 0.3 + networkBreadth * 0.3);

  return { ...state, averageAuthenticity, averageComplexity, networkBreadth, characterRelationshipMastery };
}

// Reset
export function resetNarrativeCharacterRelationshipEngineState(): NarrativeCharacterRelationshipEngineState {
  return createNarrativeCharacterRelationshipEngineState();
}