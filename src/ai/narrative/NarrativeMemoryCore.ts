/**
 * V728 NarrativeMemoryCore — Direction E Iter 5/9 (Round 2)
 * Narrative memory core: multi-layered memory + retrieval + consolidation
 * Sources: nanobot memory + thunderbolt + ruflo
 */

export type MemoryLayer = 'sensory' | 'working' | 'episodic' | 'semantic' | 'procedural' | 'autobiographical';
export type MemoryState = 'encoding' | 'consolidating' | 'stored' | 'retrieving' | 'retrieved' | 'forgotten';
export type MemoryTrace = 'strong' | 'moderate' | 'weak' | 'fading';

export interface MemoryRecord {
  recordId: string;
  layer: MemoryLayer;
  content: string;
  timestamp: number;
  accessCount: number;
  state: MemoryState;
  trace: MemoryTrace;
  importance: number;
  associations: string[];
  lastAccessed: number;
}

export interface NarrativeMemoryCoreState {
  records: Map<string, MemoryRecord>;
  layerDistribution: Map<MemoryLayer, number>;
  totalRecords: number;
  activeRetrievals: number;
  averageImportance: number;
  consolidationRate: number;
  retentionScore: number;
  dominantLayer: MemoryLayer | null;
}

// Factory
export function createNarrativeMemoryCoreState(): NarrativeMemoryCoreState {
  return {
    records: new Map(),
    layerDistribution: new Map(),
    totalRecords: 0,
    activeRetrievals: 0,
    averageImportance: 0.5,
    consolidationRate: 0.5,
    retentionScore: 0.7,
    dominantLayer: null,
  };
}

// Encode memory
export function encodeMemory(
  state: NarrativeMemoryCoreState,
  recordId: string,
  layer: MemoryLayer,
  content: string,
  importance: number = 0.5
): NarrativeMemoryCoreState {
  const record: MemoryRecord = {
    recordId,
    layer,
    content,
    timestamp: Date.now(),
    accessCount: 0,
    state: 'encoding',
    trace: 'strong',
    importance: Math.min(1, Math.max(0, importance)),
    associations: [],
    lastAccessed: Date.now(),
  };
  const records = new Map(state.records).set(recordId, record);
  const layerDistribution = new Map(state.layerDistribution);
  layerDistribution.set(layer, (layerDistribution.get(layer) || 0) + 1);
  return recomputeMemory({ ...state, records, layerDistribution, totalRecords: records.size });
}

// Consolidate memory
export function consolidateMemory(state: NarrativeMemoryCoreState, recordId: string): NarrativeMemoryCoreState {
  const record = state.records.get(recordId);
  if (!record) return state;

  const updated: MemoryRecord = { ...record, state: 'consolidating' };
  const records = new Map(state.records).set(recordId, updated);
  return recomputeMemory({ ...state, records });
}

// Store memory
export function storeMemory(state: NarrativeMemoryCoreState, recordId: string): NarrativeMemoryCoreState {
  const record = state.records.get(recordId);
  if (!record) return state;

  const updated: MemoryRecord = { ...record, state: 'stored' };
  const records = new Map(state.records).set(recordId, updated);
  return recomputeMemory({ ...state, records });
}

// Retrieve memory
export function retrieveMemory(
  state: NarrativeMemoryCoreState,
  recordId: string,
  query: string = ''
): { state: NarrativeMemoryCoreState; record: MemoryRecord | null; relevance: number } {
  const record = state.records.get(recordId);
  if (!record) return { state, record: null, relevance: 0 };

  const updated: MemoryRecord = {
    ...record,
    state: 'retrieved',
    accessCount: record.accessCount + 1,
    lastAccessed: Date.now(),
  };
  const records = new Map(state.records).set(recordId, updated);
  const relevance = query && record.content.toLowerCase().includes(query.toLowerCase()) ? 0.9 : 0.5;

  return {
    state: recomputeMemory({ ...state, records, activeRetrievals: state.activeRetrievals + 1 }),
    record: updated,
    relevance,
  };
}

// Forget memory
export function forgetMemory(state: NarrativeMemoryCoreState, recordId: string): NarrativeMemoryCoreState {
  const record = state.records.get(recordId);
  if (!record) return state;

  const updated: MemoryRecord = { ...record, state: 'forgotten', trace: 'fading' };
  const records = new Map(state.records).set(recordId, updated);
  return recomputeMemory({ ...state, records });
}

// Get records by layer
export function getRecordsByLayer(state: NarrativeMemoryCoreState, layer: MemoryLayer): MemoryRecord[] {
  return Array.from(state.records.values()).filter(r => r.layer === layer);
}

// Get records by state
export function getRecordsByState(state: NarrativeMemoryCoreState, memState: MemoryState): MemoryRecord[] {
  return Array.from(state.records.values()).filter(r => r.state === memState);
}

// Get memory report
export function getMemoryCoreReport(state: NarrativeMemoryCoreState): {
  totalRecords: number;
  averageImportance: number;
  consolidationRate: number;
  retentionScore: number;
  dominantLayer: MemoryLayer | null;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalRecords < 5) recommendations.push('Few memories — encode more');
  if (state.consolidationRate < 0.5) recommendations.push('Low consolidation — consolidate memories');
  if (state.retentionScore < 0.6) recommendations.push('Low retention — strengthen memory traces');

  return {
    totalRecords: state.totalRecords,
    averageImportance: Math.round(state.averageImportance * 100) / 100,
    consolidationRate: Math.round(state.consolidationRate * 100) / 100,
    retentionScore: Math.round(state.retentionScore * 100) / 100,
    dominantLayer: state.dominantLayer,
    recommendations,
  };
}

// Recompute metrics
function recomputeMemory(state: NarrativeMemoryCoreState): NarrativeMemoryCoreState {
  const records = Array.from(state.records.values());
  const averageImportance = records.length > 0
    ? records.reduce((s, r) => s + r.importance, 0) / records.length
    : 0.5;

  const stored = records.filter(r => r.state === 'stored' || r.state === 'retrieved').length;
  const consolidationRate = records.length === 0 ? 0.5 : stored / records.length;

  const strong = records.filter(r => r.trace === 'strong' || r.trace === 'moderate').length;
  const retentionScore = records.length === 0 ? 0.7 : strong / records.length;

  let dominantLayer: MemoryLayer | null = null;
  let maxCount = -1;
  state.layerDistribution.forEach((count, layer) => {
    if (count > maxCount) {
      maxCount = count;
      dominantLayer = layer;
    }
  });

  return { ...state, averageImportance, consolidationRate, retentionScore, dominantLayer };
}

// Reset memory core
export function resetNarrativeMemoryCoreState(): NarrativeMemoryCoreState {
  return createNarrativeMemoryCoreState();
}