/**
 * V1246 NarrativeAudienceMemoryEngine — Direction H Iter 11/20 (Round 5)
 * Audience memory engine: audience memory of narrative
 * Sources: ruflo memory + nanobot + thunderbolt
 */

export type AudienceMemoryType = 'episodic' | 'semantic' | 'emotional' | 'procedural' | 'thematic' | 'symbolic';
export type AudienceMemoryStrength = 'faint' | 'weak' | 'moderate' | 'strong' | 'permanent';
export type AudienceMemoryAccuracy = 'distorted' | 'partial' | 'good' | 'accurate' | 'photographic';

export interface AudienceMemory {
  memoryId: string;
  type: AudienceMemoryType;
  strength: AudienceMemoryStrength;
  accuracy: AudienceMemoryAccuracy;
  description: string;
  recall: number;
  retention: number;
  chapter: number;
}

export interface AudienceMemoryBank {
  bankId: string,
  memoryIds: string[],
  cumulativeRecall: number,
  diversity: number,
}

export interface NarrativeAudienceMemoryEngineState {
  memories: Map<string, AudienceMemory>;
  banks: Map<string, AudienceMemoryBank>;
  totalMemories: number;
  totalBanks: number;
  averageRecall: number;
  averageRetention: number;
  bankDiversity: number;
  audienceMemoryMastery: number;
}

// Factory
export function createNarrativeAudienceMemoryEngineState(): NarrativeAudienceMemoryEngineState {
  return {
    memories: new Map(),
    banks: new Map(),
    totalMemories: 0,
    totalBanks: 0,
    averageRecall: 0.5,
    averageRetention: 0.5,
    bankDiversity: 0.5,
    audienceMemoryMastery: 0.5,
  };
}

// Add memory
export function addAudienceMemory(
  state: NarrativeAudienceMemoryEngineState,
  memoryId: string,
  type: AudienceMemoryType,
  strength: AudienceMemoryStrength,
  accuracy: AudienceMemoryAccuracy,
  description: string,
  recall: number,
  retention: number,
  chapter: number
): NarrativeAudienceMemoryEngineState {
  const memory: AudienceMemory = { memoryId, type, strength, accuracy, description, recall, retention, chapter };
  const memories = new Map(state.memories).set(memoryId, memory);
  return recomputeAudienceMemory({ ...state, memories, totalMemories: memories.size });
}

// Add bank
export function addAudienceMemoryBank(
  state: NarrativeAudienceMemoryEngineState,
  bankId: string,
  memoryIds: string[]
): NarrativeAudienceMemoryEngineState {
  const memories = memoryIds.map(id => state.memories.get(id)).filter((m): m is AudienceMemory => m !== undefined);
  const cumulativeRecall = memories.length === 0 ? 0
    : memories.reduce((s, m) => s + m.recall, 0) / memories.length;
  const typeSet = new Set(memories.map(m => m.type));
  const diversity = Math.min(1, typeSet.size / 6);
  const bank: AudienceMemoryBank = { bankId, memoryIds, cumulativeRecall, diversity };
  const banks = new Map(state.banks).set(bankId, bank);
  return recomputeAudienceMemory({ ...state, banks, totalBanks: banks.size });
}

// Get memories by type
export function getAudienceMemoriesByType(state: NarrativeAudienceMemoryEngineState, type: AudienceMemoryType): AudienceMemory[] {
  return Array.from(state.memories.values()).filter(m => m.type === type);
}

// Get audience memory report
export function getAudienceMemoryReport(state: NarrativeAudienceMemoryEngineState): {
  totalMemories: number;
  totalBanks: number;
  averageRecall: number;
  averageRetention: number;
  audienceMemoryMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalMemories === 0) recommendations.push('No memories — add audience memories');
  if (state.averageRecall < 0.5) recommendations.push('Low recall — strengthen');
  if (state.audienceMemoryMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalMemories: state.totalMemories,
    totalBanks: state.totalBanks,
    averageRecall: Math.round(state.averageRecall * 100) / 100,
    averageRetention: Math.round(state.averageRetention * 100) / 100,
    audienceMemoryMastery: Math.round(state.audienceMemoryMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAudienceMemory(state: NarrativeAudienceMemoryEngineState): NarrativeAudienceMemoryEngineState {
  const memories = Array.from(state.memories.values());
  const averageRecall = memories.length === 0 ? 0.5
    : memories.reduce((s, m) => s + m.recall, 0) / memories.length;
  const averageRetention = memories.length === 0 ? 0.5
    : memories.reduce((s, m) => s + m.retention, 0) / memories.length;

  const banks = Array.from(state.banks.values());
  const bankDiversity = banks.length === 0 ? 0.5
    : banks.reduce((s, b) => s + b.diversity, 0) / banks.length;

  const audienceMemoryMastery = (averageRecall * 0.4 + averageRetention * 0.3 + bankDiversity * 0.3);

  return { ...state, averageRecall, averageRetention, bankDiversity, audienceMemoryMastery };
}

// Reset
export function resetNarrativeAudienceMemoryEngineState(): NarrativeAudienceMemoryEngineState {
  return createNarrativeAudienceMemoryEngineState();
}