/**
 * V1140 NarrativeRecommendationEngine — Direction E Iter 18/20 (Round 5)
 * Recommendation engine: how narrative gets recommended
 * Sources: thunderbolt recommendation + nanobot + ruflo
 */

export type RecommendationType = 'similar' | 'complementary' | 'contrasting' | 'expansion' | 'companion' | 'sequel';
export type RecommendationStrength = 'weak' | 'moderate' | 'strong' | 'compelling' | 'irresistible';
export type RecommendationContext = 'casual' | 'curated' | 'expert' | 'algorithmic' | 'peer';

export interface Recommendation {
  recommendationId: string;
  type: RecommendationType;
  strength: RecommendationStrength;
  context: RecommendationContext;
  description: string;
  relevance: number;
  conversion: number;
  chapter: number;
}

export interface RecommendationFlow {
  flowId: string,
  recommendationIds: string[],
  cumulativeRelevance: number,
  conversion: number,
}

export interface NarrativeRecommendationEngineState {
  recommendations: Map<string, Recommendation>;
  flows: Map<string, RecommendationFlow>;
  totalRecommendations: number;
  totalFlows: number;
  averageRelevance: number;
  averageConversion: number;
  flowConversion: number;
  recommendationMastery: number;
}

// Factory
export function createNarrativeRecommendationEngineState(): NarrativeRecommendationEngineState {
  return {
    recommendations: new Map(),
    flows: new Map(),
    totalRecommendations: 0,
    totalFlows: 0,
    averageRelevance: 0.5,
    averageConversion: 0.5,
    flowConversion: 0.5,
    recommendationMastery: 0.5,
  };
}

// Add recommendation
export function addRecommendation(
  state: NarrativeRecommendationEngineState,
  recommendationId: string,
  type: RecommendationType,
  strength: RecommendationStrength,
  context: RecommendationContext,
  description: string,
  relevance: number,
  conversion: number,
  chapter: number
): NarrativeRecommendationEngineState {
  const recommendation: Recommendation = { recommendationId, type, strength, context, description, relevance, conversion, chapter };
  const recommendations = new Map(state.recommendations).set(recommendationId, recommendation);
  return recomputeRecommendation({ ...state, recommendations, totalRecommendations: recommendations.size });
}

// Add flow
export function addRecommendationFlow(
  state: NarrativeRecommendationEngineState,
  flowId: string,
  recommendationIds: string[]
): NarrativeRecommendationEngineState {
  const recommendations = recommendationIds.map(id => state.recommendations.get(id)).filter((r): r is Recommendation => r !== undefined);
  const cumulativeRelevance = recommendations.length === 0 ? 0
    : recommendations.reduce((s, r) => s + r.relevance, 0) / recommendations.length;
  const conversion = recommendations.length === 0 ? 0
    : recommendations.reduce((s, r) => s + r.conversion, 0) / recommendations.length;
  const flow: RecommendationFlow = { flowId, recommendationIds, cumulativeRelevance, conversion };
  const flows = new Map(state.flows).set(flowId, flow);
  return recomputeRecommendation({ ...state, flows, totalFlows: flows.size });
}

// Get recommendations by type
export function getRecommendationsByType(state: NarrativeRecommendationEngineState, type: RecommendationType): Recommendation[] {
  return Array.from(state.recommendations.values()).filter(r => r.type === type);
}

// Get recommendation report
export function getRecommendationReport(state: NarrativeRecommendationEngineState): {
  totalRecommendations: number;
  totalFlows: number;
  averageRelevance: number;
  averageConversion: number;
  recommendationMastery: number;
  recommendations: string[];
} {
  const recs: string[] = [];
  if (state.totalRecommendations === 0) recs.push('No recommendations — add recommendations');
  if (state.averageRelevance < 0.5) recs.push('Low relevance — strengthen');
  if (state.recommendationMastery < 0.5) recs.push('Low mastery — develop');

  return {
    totalRecommendations: state.totalRecommendations,
    totalFlows: state.totalFlows,
    averageRelevance: Math.round(state.averageRelevance * 100) / 100,
    averageConversion: Math.round(state.averageConversion * 100) / 100,
    recommendationMastery: Math.round(state.recommendationMastery * 100) / 100,
    recommendations: recs,
  };
}

// Recompute metrics
function recomputeRecommendation(state: NarrativeRecommendationEngineState): NarrativeRecommendationEngineState {
  const recommendations = Array.from(state.recommendations.values());
  const averageRelevance = recommendations.length === 0 ? 0.5
    : recommendations.reduce((s, r) => s + r.relevance, 0) / recommendations.length;
  const averageConversion = recommendations.length === 0 ? 0.5
    : recommendations.reduce((s, r) => s + r.conversion, 0) / recommendations.length;

  const flows = Array.from(state.flows.values());
  const flowConversion = flows.length === 0 ? 0.5
    : flows.reduce((s, f) => s + f.conversion, 0) / flows.length;

  const recommendationMastery = (averageRelevance * 0.4 + averageConversion * 0.3 + flowConversion * 0.3);

  return { ...state, averageRelevance, averageConversion, flowConversion, recommendationMastery };
}

// Reset
export function resetNarrativeRecommendationEngineState(): NarrativeRecommendationEngineState {
  return createNarrativeRecommendationEngineState();
}