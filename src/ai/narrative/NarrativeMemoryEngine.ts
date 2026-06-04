/**
 * V652 NarrativeMemoryEngine — Direction E Iter 3/9
 * Narrative memory engine: episodic + semantic + working memory integration
 * Sources: nanobot memory + thunderbolt temporal + chatdev episodic
 */

export type MemoryType = 'episodic' | 'semantic' | 'working' | 'procedural';
export type MemoryState = 'encoding' | 'consolidating' | 'retrieving' | 'forgotten';

export interface MemoryEntry {
  entryId: string;
  type: MemoryType;
  content: string;
  timestamp: number;
  importance: number;
  state: MemoryState;
  accessCount: number;
  associations: string[];
}

export interface NarrativeMemoryState {
  episodic: Map<string, MemoryEntry>;
  semantic: Map<string, MemoryEntry>;
  working: Map<string, MemoryEntry>;
  procedural: Map<string, MemoryEntry>;
  totalEntries: number;
  retrievalAccuracy: number;
  memoryConsolidationLevel: number;
}

export interface MemoryRetrievalResult {
  entries: MemoryEntry[];
  relevanceScore: number;
  retrievalTime: number;
}

// Factory
export function createNarrativeMemoryState(): NarrativeMemoryState {
  return {
    episodic: new Map(),
    semantic: new Map(),
    working: new Map(),
    procedural: new Map(),
    totalEntries: 0,
    retrievalAccuracy: 0.8,
    memoryConsolidationLevel: 0.5,
  };
}

// Encode memory
export function encodeMemory(
  state: NarrativeMemoryState,
  entryId: string,
  type: MemoryType,
  content: string,
  importance: number = 0.5
): NarrativeMemoryState {
  const entry: MemoryEntry = {
    entryId,
    type,
    content,
    timestamp: Date.now(),
    importance,
    state: 'encoding',
    accessCount: 0,
    associations: [],
  };

  const maps = { episodic: state.episodic, semantic: state.semantic, working: state.working, procedural: state.procedural };
  const targetMap = maps[type];
  const updatedMap = new Map(targetMap).set(entryId, entry);
  const totalEntries = state.totalEntries + 1;

  return recomputeMetrics({ ...state, [type]: updatedMap, totalEntries });
}

// Consolidate memory
export function consolidateMemory(state: NarrativeMemoryState, entryId: string): NarrativeMemoryState {
  const type = guessMemoryType(state, entryId);
  if (!type) return state;

  const maps = { episodic: state.episodic, semantic: state.semantic, working: state.working, procedural: state.procedural };
  const entry = maps[type].get(entryId);
  if (!entry) return state;

  const updatedEntry: MemoryEntry = { ...entry, state: 'consolidating' };
  const updatedMap = new Map(maps[type]).set(entryId, updatedEntry);

  return recomputeMetrics({ ...state, [type]: updatedMap });
}

// Retrieve memory
export function retrieveMemory(state: NarrativeMemoryState, query: string): MemoryRetrievalResult {
  const allEntries: MemoryEntry[] = [];
  [state.episodic, state.semantic, state.working, state.procedural].forEach(map => {
    map.forEach(entry => allEntries.push(entry));
  });

  const relevanceScore = state.retrievalAccuracy;
  const retrievalTime = Math.random() * 100 + 20;

  const entries = allEntries
    .filter(e => e.content.toLowerCase().includes(query.toLowerCase()) || e.associations.some(a => a.includes(query)))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 5);

  return { entries, relevanceScore, retrievalTime };
}

// Add association
export function addAssociation(state: NarrativeMemoryState, entryId: string, associatedId: string): NarrativeMemoryState {
  const type = guessMemoryType(state, entryId);
  if (!type) return state;

  const maps = { episodic: state.episodic, semantic: state.semantic, working: state.working, procedural: state.procedural };
  const entry = maps[type].get(entryId);
  if (!entry) return state;

  const updatedEntry: MemoryEntry = { ...entry, associations: [...entry.associations, associatedId] };
  const updatedMap = new Map(maps[type]).set(entryId, updatedEntry);

  return { ...state, [type]: updatedMap };
}

// Access memory
export function accessMemory(state: NarrativeMemoryState, entryId: string): NarrativeMemoryState {
  const type = guessMemoryType(state, entryId);
  if (!type) return state;

  const maps = { episodic: state.episodic, semantic: state.semantic, working: state.working, procedural: state.procedural };
  const entry = maps[type].get(entryId);
  if (!entry) return state;

  const updatedEntry: MemoryEntry = { ...entry, accessCount: entry.accessCount + 1 };
  const updatedMap = new Map(maps[type]).set(entryId, updatedEntry);

  return { ...state, [type]: updatedMap };
}

// Get memory report
export function getMemoryReport(state: NarrativeMemoryState): {
  episodicCount: number;
  semanticCount: number;
  workingCount: number;
  proceduralCount: number;
  totalEntries: number;
  retrievalAccuracy: number;
  consolidationLevel: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries > 100) recommendations.push('High memory count — consider consolidation');
  if (state.retrievalAccuracy < 0.6) recommendations.push('Low retrieval accuracy — strengthen memory associations');
  if (state.memoryConsolidationLevel < 0.5) recommendations.push('Low consolidation — review important memories');

  return {
    episodicCount: state.episodic.size,
    semanticCount: state.semantic.size,
    workingCount: state.working.size,
    proceduralCount: state.procedural.size,
    totalEntries: state.totalEntries,
    retrievalAccuracy: Math.round(state.retrievalAccuracy * 100) / 100,
    consolidationLevel: Math.round(state.memoryConsolidationLevel * 100) / 100,
    recommendations,
  };
}

// Helper to guess memory type
function guessMemoryType(state: NarrativeMemoryState, entryId: string): MemoryType | null {
  const types: MemoryType[] = ['episodic', 'semantic', 'working', 'procedural'];
  for (const type of types) {
    if (state[type].has(entryId)) return type;
  }
  return null;
}

// Recompute metrics
function recomputeMetrics(state: NarrativeMemoryState): NarrativeMemoryState {
  const totalEntries = state.episodic.size + state.semantic.size + state.working.size + state.procedural.size;
  const consolidationLevel = totalEntries > 0
    ? (state.episodic.size * 0.3 + state.semantic.size * 0.4 + state.procedural.size * 0.3) / totalEntries
    : 0.5;
  return { ...state, totalEntries, memoryConsolidationLevel: consolidationLevel };
}

// Reset memory state
export function resetNarrativeMemoryState(): NarrativeMemoryState {
  return createNarrativeMemoryState();
}