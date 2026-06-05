/**
 * V804 CritiqueIntegrationEngine — Direction D Iter 7/9 (Round 3)
 * Critique integration engine: feedback aggregation + multi-source critique
 * Sources: chatdev critique + thunderbolt + nanobot
 */

export type CritiqueSource = 'self' | 'peer' | 'editor' | 'reader' | 'automated' | 'panel';
export type CritiqueCategory = 'plot' | 'character' | 'prose' | 'pacing' | 'theme' | 'world' | 'dialogue';
export type CritiqueSentiment = 'positive' | 'neutral' | 'mixed' | 'negative' | 'critical';

export interface Critique {
  critiqueId: string;
  source: CritiqueSource;
  category: CritiqueCategory;
  sentiment: CritiqueSentiment;
  rating: number;
  text: string;
  suggestions: string[];
  timestamp: number;
  weight: number;
}

export interface CritiqueConsensus {
  category: CritiqueCategory;
  averageRating: number;
  consensus: CritiqueSentiment;
  critiqueCount: number;
  topSuggestions: string[];
}

export interface CritiqueIntegrationEngineState {
  critiques: Map<string, Critique>;
  totalCritiques: number;
  totalCategories: number;
  averageRating: number;
  consensusStrength: number;
  topIssues: string[];
  sentimentDistribution: Map<CritiqueSentiment, number>;
  integrationScore: number;
  sourceBalance: number;
}

// Factory
export function createCritiqueIntegrationEngineState(): CritiqueIntegrationEngineState {
  return {
    critiques: new Map(),
    totalCritiques: 0,
    totalCategories: 0,
    averageRating: 0.5,
    consensusStrength: 0,
    topIssues: [],
    sentimentDistribution: new Map(),
    integrationScore: 0.5,
    sourceBalance: 0.5,
  };
}

// Add critique
export function addCritique(
  state: CritiqueIntegrationEngineState,
  critiqueId: string,
  source: CritiqueSource,
  category: CritiqueCategory,
  rating: number,
  text: string,
  suggestions: string[] = [],
  sentiment: CritiqueSentiment = 'neutral',
  weight: number = 1.0
): CritiqueIntegrationEngineState {
  const critique: Critique = {
    critiqueId, source, category,
    rating: Math.min(1, Math.max(0, rating)),
    text, suggestions,
    sentiment,
    timestamp: Date.now(),
    weight: Math.min(2, Math.max(0, weight)),
  };
  const critiques = new Map(state.critiques).set(critiqueId, critique);

  const sentimentDistribution = new Map(state.sentimentDistribution);
  sentimentDistribution.set(sentiment, (sentimentDistribution.get(sentiment) || 0) + 1);

  return recomputeCritique({ ...state, critiques, sentimentDistribution, totalCritiques: critiques.size });
}

// Get consensus by category
export function getConsensusByCategory(state: CritiqueIntegrationEngineState, category: CritiqueCategory): CritiqueConsensus {
  const categoryCritiques = Array.from(state.critiques.values()).filter(c => c.category === category);
  if (categoryCritiques.length === 0) {
    return { category, averageRating: 0.5, consensus: 'neutral', critiqueCount: 0, topSuggestions: [] };
  }

  const totalWeight = categoryCritiques.reduce((s, c) => s + c.weight, 0);
  const averageRating = categoryCritiques.reduce((s, c) => s + c.rating * c.weight, 0) / totalWeight;

  const sentimentCounts = new Map<CritiqueSentiment, number>();
  categoryCritiques.forEach(c => sentimentCounts.set(c.sentiment, (sentimentCounts.get(c.sentiment) || 0) + c.weight));

  let dominantSentiment: CritiqueSentiment = 'neutral';
  let maxWeight = -1;
  sentimentCounts.forEach((w, s) => { if (w > maxWeight) { maxWeight = w; dominantSentiment = s; } });

  const allSuggestions = categoryCritiques.flatMap(c => c.suggestions);
  const suggestionCounts = new Map<string, number>();
  allSuggestions.forEach(s => suggestionCounts.set(s, (suggestionCounts.get(s) || 0) + 1));
  const topSuggestions = Array.from(suggestionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(e => e[0]);

  return { category, averageRating, consensus: dominantSentiment, critiqueCount: categoryCritiques.length, topSuggestions };
}

// Get critiques by source
export function getCritiquesBySource(state: CritiqueIntegrationEngineState, source: CritiqueSource): Critique[] {
  return Array.from(state.critiques.values()).filter(c => c.source === source);
}

// Get critique report
export function getCritiqueIntegrationReport(state: CritiqueIntegrationEngineState): {
  totalCritiques: number;
  totalCategories: number;
  averageRating: number;
  consensusStrength: number;
  integrationScore: number;
  sourceBalance: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalCritiques === 0) recommendations.push('No critiques — gather feedback');
  if (state.averageRating < 0.5) recommendations.push('Low average rating — address issues');
  if (state.sourceBalance < 0.3) recommendations.push('Limited source diversity — gather from more sources');

  return {
    totalCritiques: state.totalCritiques,
    totalCategories: state.totalCategories,
    averageRating: Math.round(state.averageRating * 100) / 100,
    consensusStrength: Math.round(state.consensusStrength * 100) / 100,
    integrationScore: Math.round(state.integrationScore * 100) / 100,
    sourceBalance: Math.round(state.sourceBalance * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCritique(state: CritiqueIntegrationEngineState): CritiqueIntegrationEngineState {
  const critiques = Array.from(state.critiques.values());
  const totalWeight = critiques.reduce((s, c) => s + c.weight, 0);
  const averageRating = totalWeight === 0 ? 0.5
    : critiques.reduce((s, c) => s + c.rating * c.weight, 0) / totalWeight;

  const categorySet = new Set(critiques.map(c => c.category));
  const totalCategories = categorySet.size;

  // Consensus strength: how aligned are the critiques
  const sentimentCounts = new Map<CritiqueSentiment, number>();
  critiques.forEach(c => sentimentCounts.set(c.sentiment, (sentimentCounts.get(c.sentiment) || 0) + c.weight));
  let maxSentimentWeight = 0;
  sentimentCounts.forEach(w => { if (w > maxSentimentWeight) maxSentimentWeight = w; });
  const consensusStrength = totalWeight === 0 ? 0 : maxSentimentWeight / totalWeight;

  const sourceSet = new Set(critiques.map(c => c.source));
  const sourceBalance = Math.min(1, sourceSet.size / 6);

  const integrationScore = (averageRating * 0.4 + consensusStrength * 0.3 + sourceBalance * 0.3);

  return { ...state, totalCategories, averageRating, consensusStrength, integrationScore, sourceBalance };
}

// Reset critique state
export function resetCritiqueIntegrationEngineState(): CritiqueIntegrationEngineState {
  return createCritiqueIntegrationEngineState();
}