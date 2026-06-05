/**
 * V768 WorldLoreEngine — Direction B Iter 7/9 (Round 3)
 * World lore engine: history + mythology + culture + legends
 * Sources: nanobot lore + ruflo hierarchical + thunderbolt
 */

export type LoreType = 'history' | 'mythology' | 'legend' | 'culture' | 'religion' | 'language' | 'tradition';
export type LoreEra = 'ancient' | 'classical' | 'medieval' | 'modern' | 'future' | 'timeless';
export type LoreReliability = 'verified' | 'legendary' | 'mythological' | 'disputed' | 'unknown';

export interface LoreEntry {
  entryId: string;
  title: string;
  type: LoreType;
  era: LoreEra;
  reliability: LoreReliability;
  content: string;
  connections: string[];
  significance: number;
}

export interface LoreConnection {
  connectionId: string;
  fromEntryId: string;
  toEntryId: string;
  type: 'causes' | 'influences' | 'contradicts' | 'supports' | 'evolves_into';
  strength: number;
}

export interface WorldLoreEngineState {
  entries: Map<string, LoreEntry>;
  connections: Map<string, LoreConnection>;
  totalEntries: number;
  totalConnections: number;
  typeDistribution: Map<LoreType, number>;
  averageSignificance: number;
  eraCoverage: number;
  dominantEra: LoreEra | null;
  loreDepth: number;
}

// Factory
export function createWorldLoreEngineState(): WorldLoreEngineState {
  return {
    entries: new Map(),
    connections: new Map(),
    totalEntries: 0,
    totalConnections: 0,
    typeDistribution: new Map(),
    averageSignificance: 0,
    eraCoverage: 0,
    dominantEra: null,
    loreDepth: 0.5,
  };
}

// Add lore entry
export function addLoreEntry(
  state: WorldLoreEngineState,
  entryId: string,
  title: string,
  type: LoreType,
  era: LoreEra,
  content: string,
  reliability: LoreReliability = 'verified',
  significance: number = 0.5
): WorldLoreEngineState {
  const entry: LoreEntry = {
    entryId,
    title,
    type,
    era,
    reliability,
    content,
    connections: [],
    significance: Math.min(1, Math.max(0, significance)),
  };
  const entries = new Map(state.entries).set(entryId, entry);
  const typeDistribution = new Map(state.typeDistribution);
  typeDistribution.set(type, (typeDistribution.get(type) || 0) + 1);
  return recomputeLore({ ...state, entries, typeDistribution, totalEntries: entries.size });
}

// Connect lore
export function connectLore(
  state: WorldLoreEngineState,
  connectionId: string,
  fromEntryId: string,
  toEntryId: string,
  type: LoreConnection['type'],
  strength: number = 0.5
): WorldLoreEngineState {
  const connection: LoreConnection = { connectionId, fromEntryId, toEntryId, type, strength: Math.min(1, Math.max(0, strength)) };
  const connections = new Map(state.connections).set(connectionId, connection);

  // Update entry connections
  const fromEntry = state.entries.get(fromEntryId);
  let entries = state.entries;
  if (fromEntry) {
    const updated: LoreEntry = { ...fromEntry, connections: [...fromEntry.connections, toEntryId] };
    entries = new Map(state.entries).set(fromEntryId, updated);
  }

  return recomputeLore({ ...state, entries, connections, totalConnections: connections.size });
}

// Get entries by type
export function getEntriesByType(state: WorldLoreEngineState, type: LoreType): LoreEntry[] {
  return Array.from(state.entries.values()).filter(e => e.type === type);
}

// Get entries by era
export function getEntriesByEra(state: WorldLoreEngineState, era: LoreEra): LoreEntry[] {
  return Array.from(state.entries.values()).filter(e => e.era === era);
}

// Get lore report
export function getLoreReport(state: WorldLoreEngineState): {
  totalEntries: number;
  totalConnections: number;
  averageSignificance: number;
  eraCoverage: number;
  dominantEra: LoreEra | null;
  loreDepth: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No lore — add lore entries');
  if (state.totalConnections === 0) recommendations.push('No connections — connect lore');
  if (state.eraCoverage < 0.5) recommendations.push('Limited era coverage — add eras');

  return {
    totalEntries: state.totalEntries,
    totalConnections: state.totalConnections,
    averageSignificance: Math.round(state.averageSignificance * 100) / 100,
    eraCoverage: Math.round(state.eraCoverage * 100) / 100,
    dominantEra: state.dominantEra,
    loreDepth: Math.round(state.loreDepth * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeLore(state: WorldLoreEngineState): WorldLoreEngineState {
  const entries = Array.from(state.entries.values());
  const averageSignificance = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.significance, 0) / entries.length;

  const eraSet = new Set(entries.map(e => e.era));
  const eraCoverage = Math.min(1, eraSet.size / 5);

  const connectionDensity = state.totalEntries === 0 ? 0
    : Math.min(1, state.totalConnections / state.totalEntries);
  const significanceFactor = averageSignificance;
  const loreDepth = (eraCoverage * 0.4 + connectionDensity * 0.3 + significanceFactor * 0.3);

  let dominantEra: LoreEra | null = null;
  let maxCount = -1;
  const eraCounts = new Map<LoreEra, number>();
  entries.forEach(e => eraCounts.set(e.era, (eraCounts.get(e.era) || 0) + 1));
  eraCounts.forEach((count, e) => { if (count > maxCount) { maxCount = count; dominantEra = e; } });

  return { ...state, averageSignificance, eraCoverage, dominantEra, loreDepth };
}

// Reset lore state
export function resetWorldLoreEngineState(): WorldLoreEngineState {
  return createWorldLoreEngineState();
}