/**
 * V820 NarrativeKnowledgeCore — Direction E Iter 6/9 (Round 3)
 * Narrative knowledge core: knowledge base + retrieval + reasoning
 * Sources: nanobot knowledge + ruflo + thunderbolt
 */

export type KnowledgeType = 'fact' | 'rule' | 'pattern' | 'concept' | 'procedure' | 'meta';
export type KnowledgeSource = 'manual' | 'inferred' | 'observed' | 'computed' | 'provided';
export type KnowledgeConfidence = 'speculative' | 'low' | 'medium' | 'high' | 'verified';

export interface KnowledgeItem {
  itemId: string;
  type: KnowledgeType;
  source: KnowledgeSource;
  confidence: KnowledgeConfidence;
  content: string;
  tags: string[];
  references: string[];
  usageCount: number;
  lastUsed: number;
}

export interface KnowledgeQuery {
  queryId: string;
  text: string;
  resultIds: string[];
  relevantCount: number;
  confidence: number;
  timestamp: number;
}

export interface NarrativeKnowledgeCoreState {
  items: Map<string, KnowledgeItem>;
  queries: Map<string, KnowledgeQuery>;
  totalItems: number;
  totalQueries: number;
  averageConfidence: number;
  usageRate: number;
  coverageScore: number;
  retrievalAccuracy: number;
  knowledgeGrowth: number;
}

// Factory
export function createNarrativeKnowledgeCoreState(): NarrativeKnowledgeCoreState {
  return {
    items: new Map(),
    queries: new Map(),
    totalItems: 0,
    totalQueries: 0,
    averageConfidence: 0.5,
    usageRate: 0,
    coverageScore: 0,
    retrievalAccuracy: 0.5,
    knowledgeGrowth: 0,
  };
}

// Add knowledge
export function addKnowledge(
  state: NarrativeKnowledgeCoreState,
  itemId: string,
  type: KnowledgeType,
  content: string,
  source: KnowledgeSource = 'manual',
  confidence: KnowledgeConfidence = 'medium',
  tags: string[] = []
): NarrativeKnowledgeCoreState {
  const item: KnowledgeItem = {
    itemId, type, source, confidence,
    content, tags, references: [], usageCount: 0, lastUsed: Date.now(),
  };
  const items = new Map(state.items).set(itemId, item);
  return recomputeKnowledge({ ...state, items, totalItems: items.size });
}

// Use knowledge
export function useKnowledge(state: NarrativeKnowledgeCoreState, itemId: string): NarrativeKnowledgeCoreState {
  const item = state.items.get(itemId);
  if (!item) return state;

  const updated: KnowledgeItem = { ...item, usageCount: item.usageCount + 1, lastUsed: Date.now() };
  const items = new Map(state.items).set(itemId, updated);
  return recomputeKnowledge({ ...state, items });
}

// Query knowledge
export function queryKnowledge(
  state: NarrativeKnowledgeCoreState,
  queryId: string,
  text: string,
  resultIds: string[]
): NarrativeKnowledgeCoreState {
  const relevantCount = resultIds.length;
  const confidence = state.totalItems === 0 ? 0
    : Math.min(1, relevantCount / Math.max(1, state.totalItems / 4));

  const query: KnowledgeQuery = { queryId, text, resultIds, relevantCount, confidence, timestamp: Date.now() };
  const queries = new Map(state.queries).set(queryId, query);
  return recomputeKnowledge({ ...state, queries, totalQueries: queries.size });
}

// Get items by type
export function getItemsByType(state: NarrativeKnowledgeCoreState, type: KnowledgeType): KnowledgeItem[] {
  return Array.from(state.items.values()).filter(i => i.type === type);
}

// Get knowledge report
export function getKnowledgeCoreReport(state: NarrativeKnowledgeCoreState): {
  totalItems: number;
  totalQueries: number;
  averageConfidence: number;
  usageRate: number;
  coverageScore: number;
  retrievalAccuracy: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalItems === 0) recommendations.push('No items — add knowledge');
  if (state.averageConfidence < 0.5) recommendations.push('Low confidence — verify items');
  if (state.coverageScore < 0.4) recommendations.push('Low coverage — diversify types');

  return {
    totalItems: state.totalItems,
    totalQueries: state.totalQueries,
    averageConfidence: Math.round(state.averageConfidence * 100) / 100,
    usageRate: Math.round(state.usageRate * 100) / 100,
    coverageScore: Math.round(state.coverageScore * 100) / 100,
    retrievalAccuracy: Math.round(state.retrievalAccuracy * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeKnowledge(state: NarrativeKnowledgeCoreState): NarrativeKnowledgeCoreState {
  const items = Array.from(state.items.values());
  const confidenceMap: Record<KnowledgeConfidence, number> = { speculative: 0.2, low: 0.4, medium: 0.6, high: 0.8, verified: 1.0 };
  const averageConfidence = items.length === 0 ? 0.5
    : items.reduce((s, i) => s + confidenceMap[i.confidence], 0) / items.length;

  const usedItems = items.filter(i => i.usageCount > 0);
  const usageRate = items.length === 0 ? 0 : usedItems.length / items.length;

  const typeSet = new Set(items.map(i => i.type));
  const coverageScore = Math.min(1, typeSet.size / 6);

  const queries = Array.from(state.queries.values());
  const retrievalAccuracy = queries.length === 0 ? 0.5
    : queries.reduce((s, q) => s + q.confidence, 0) / queries.length;

  const knowledgeGrowth = state.totalItems;

  return { ...state, averageConfidence, usageRate, coverageScore, retrievalAccuracy, knowledgeGrowth };
}

// Reset knowledge state
export function resetNarrativeKnowledgeCoreState(): NarrativeKnowledgeCoreState {
  return createNarrativeKnowledgeCoreState();
}