/**
 * V802 ContentEnhancementEngine — Direction D Iter 6/9 (Round 3)
 * Content enhancement engine: content improvement + value addition
 * Sources: thunderbolt enhancement + chatdev + nanobot
 */

export type EnhancementType = 'detail' | 'depth' | 'sensory' | 'emotional' | 'context' | 'connection';
export type EnhancementPriority = 'critical' | 'high' | 'medium' | 'low' | 'optional';
export type EnhancementStatus = 'identified' | 'planned' | 'in_progress' | 'completed' | 'rejected';

export interface EnhancementOpportunity {
  opportunityId: string;
  type: EnhancementType;
  priority: EnhancementPriority;
  location: string;
  description: string;
  valueScore: number;
  effortScore: number;
  status: EnhancementStatus;
  appliedAt: number | null;
}

export interface EnhancementResult {
  resultId: string;
  opportunityId: string;
  originalText: string;
  enhancedText: string;
  qualityImprovement: number;
  timestamp: number;
}

export interface ContentEnhancementEngineState {
  opportunities: Map<string, EnhancementOpportunity>;
  results: Map<string, EnhancementResult>;
  totalOpportunities: number;
  totalResults: number;
  completedResults: number;
  averageValueScore: number;
  averageImprovement: number;
  completionRate: number;
  typeDistribution: Map<EnhancementType, number>;
  enhancementVelocity: number;
}

// Factory
export function createContentEnhancementEngineState(): ContentEnhancementEngineState {
  return {
    opportunities: new Map(),
    results: new Map(),
    totalOpportunities: 0,
    totalResults: 0,
    completedResults: 0,
    averageValueScore: 0.5,
    averageImprovement: 0,
    completionRate: 0,
    typeDistribution: new Map(),
    enhancementVelocity: 0,
  };
}

// Identify opportunity
export function identifyOpportunity(
  state: ContentEnhancementEngineState,
  opportunityId: string,
  type: EnhancementType,
  location: string,
  description: string,
  valueScore: number = 0.5,
  effortScore: number = 0.5,
  priority: EnhancementPriority = 'medium'
): ContentEnhancementEngineState {
  const opportunity: EnhancementOpportunity = {
    opportunityId, type, location, description,
    valueScore: Math.min(1, Math.max(0, valueScore)),
    effortScore: Math.min(1, Math.max(0, effortScore)),
    priority, status: 'identified', appliedAt: null,
  };
  const opportunities = new Map(state.opportunities).set(opportunityId, opportunity);
  const typeDistribution = new Map(state.typeDistribution);
  typeDistribution.set(type, (typeDistribution.get(type) || 0) + 1);
  return recomputeEnhancement({ ...state, opportunities, typeDistribution, totalOpportunities: opportunities.size });
}

// Set priority
export function setOpportunityPriority(state: ContentEnhancementEngineState, opportunityId: string, priority: EnhancementPriority): ContentEnhancementEngineState {
  const opportunity = state.opportunities.get(opportunityId);
  if (!opportunity) return state;

  const updated: EnhancementOpportunity = { ...opportunity, priority };
  const opportunities = new Map(state.opportunities).set(opportunityId, updated);
  return recomputeEnhancement({ ...state, opportunities });
}

// Apply enhancement
export function applyEnhancement(
  state: ContentEnhancementEngineState,
  resultId: string,
  opportunityId: string,
  originalText: string,
  enhancedText: string,
  qualityImprovement: number
): ContentEnhancementEngineState {
  const result: EnhancementResult = {
    resultId, opportunityId, originalText, enhancedText,
    qualityImprovement: Math.min(1, Math.max(0, qualityImprovement)),
    timestamp: Date.now(),
  };
  const results = new Map(state.results).set(resultId, result);

  // Update opportunity
  const opportunity = state.opportunities.get(opportunityId);
  let opportunities = state.opportunities;
  if (opportunity) {
    const updated: EnhancementOpportunity = { ...opportunity, status: 'completed', appliedAt: Date.now() };
    opportunities = new Map(state.opportunities).set(opportunityId, updated);
  }

  return recomputeEnhancement({ ...state, opportunities, results, totalResults: results.size, completedResults: state.completedResults + 1 });
}

// Reject opportunity
export function rejectOpportunity(state: ContentEnhancementEngineState, opportunityId: string): ContentEnhancementEngineState {
  const opportunity = state.opportunities.get(opportunityId);
  if (!opportunity) return state;

  const updated: EnhancementOpportunity = { ...opportunity, status: 'rejected' };
  const opportunities = new Map(state.opportunities).set(opportunityId, updated);
  return recomputeEnhancement({ ...state, opportunities });
}

// Get opportunities by type
export function getOpportunitiesByType(state: ContentEnhancementEngineState, type: EnhancementType): EnhancementOpportunity[] {
  return Array.from(state.opportunities.values()).filter(o => o.type === type);
}

// Get enhancement report
export function getContentEnhancementReport(state: ContentEnhancementEngineState): {
  totalOpportunities: number;
  totalResults: number;
  completedResults: number;
  averageValueScore: number;
  averageImprovement: number;
  completionRate: number;
  enhancementVelocity: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalOpportunities === 0) recommendations.push('No opportunities — identify enhancements');
  if (state.completionRate < 0.3) recommendations.push('Low completion — apply enhancements');
  if (state.averageImprovement < 0.1) recommendations.push('Low improvement — strengthen enhancements');

  return {
    totalOpportunities: state.totalOpportunities,
    totalResults: state.totalResults,
    completedResults: state.completedResults,
    averageValueScore: Math.round(state.averageValueScore * 100) / 100,
    averageImprovement: Math.round(state.averageImprovement * 100) / 100,
    completionRate: Math.round(state.completionRate * 100) / 100,
    enhancementVelocity: Math.round(state.enhancementVelocity * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeEnhancement(state: ContentEnhancementEngineState): ContentEnhancementEngineState {
  const opportunities = Array.from(state.opportunities.values());
  const results = Array.from(state.results.values());
  const averageValueScore = opportunities.length === 0 ? 0.5
    : opportunities.reduce((s, o) => s + o.valueScore, 0) / opportunities.length;
  const averageImprovement = results.length === 0 ? 0
    : results.reduce((s, r) => s + r.qualityImprovement, 0) / results.length;
  const completionRate = state.totalOpportunities === 0 ? 0 : state.completedResults / state.totalOpportunities;
  const enhancementVelocity = state.totalOpportunities === 0 ? 0
    : Math.min(1, state.completedResults / Math.max(1, state.totalOpportunities));

  return { ...state, averageValueScore, averageImprovement, completionRate, enhancementVelocity };
}

// Reset enhancement state
export function resetContentEnhancementEngineState(): ContentEnhancementEngineState {
  return createContentEnhancementEngineState();
}