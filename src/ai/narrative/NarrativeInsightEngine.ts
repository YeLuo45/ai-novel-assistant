/**
 * V814 NarrativeInsightEngine — Direction E Iter 3/9 (Round 3)
 * Narrative insight engine: deep insights + pattern recognition
 * Sources: nanobot insight + thunderbolt + chatdev
 */

export type InsightType = 'pattern' | 'connection' | 'contradiction' | 'opportunity' | 'warning' | 'discovery';
export type InsightQuality = 'surface' | 'shallow' | 'moderate' | 'deep' | 'profound';
export type InsightStatus = 'emerging' | 'forming' | 'clear' | 'verified' | 'acted_upon';

export interface Insight {
  insightId: string;
  type: InsightType;
  quality: InsightQuality;
  status: InsightStatus;
  description: string;
  evidence: string[];
  implications: string[];
  impact: number;
  timestamp: number;
}

export interface InsightConnection {
  connectionId: string;
  insightId1: string;
  insightId2: string;
  strength: number;
  relationship: string;
}

export interface NarrativeInsightEngineState {
  insights: Map<string, Insight>;
  connections: Map<string, InsightConnection>;
  totalInsights: number;
  totalConnections: number;
  verifiedInsights: number;
  averageQuality: number;
  averageImpact: number;
  insightDensity: number;
  networkCoherence: number;
}

// Factory
export function createNarrativeInsightEngineState(): NarrativeInsightEngineState {
  return {
    insights: new Map(),
    connections: new Map(),
    totalInsights: 0,
    totalConnections: 0,
    verifiedInsights: 0,
    averageQuality: 0.5,
    averageImpact: 0.5,
    insightDensity: 0,
    networkCoherence: 0.5,
  };
}

// Generate insight
export function generateInsight(
  state: NarrativeInsightEngineState,
  insightId: string,
  type: InsightType,
  description: string,
  impact: number = 0.5,
  quality: InsightQuality = 'moderate',
  evidence: string[] = [],
  implications: string[] = []
): NarrativeInsightEngineState {
  const insight: Insight = {
    insightId, type, quality, status: 'emerging',
    description, evidence, implications,
    impact: Math.min(1, Math.max(0, impact)),
    timestamp: Date.now(),
  };
  const insights = new Map(state.insights).set(insightId, insight);
  return recomputeInsight({ ...state, insights, totalInsights: insights.size });
}

// Verify insight
export function verifyInsight(state: NarrativeInsightEngineState, insightId: string): NarrativeInsightEngineState {
  const insight = state.insights.get(insightId);
  if (!insight) return state;

  const updated: Insight = { ...insight, status: 'verified' };
  const insights = new Map(state.insights).set(insightId, updated);
  return recomputeInsight({ ...state, insights, verifiedInsights: state.verifiedInsights + 1 });
}

// Connect insights
export function connectInsights(
  state: NarrativeInsightEngineState,
  connectionId: string,
  insightId1: string,
  insightId2: string,
  strength: number,
  relationship: string
): NarrativeInsightEngineState {
  const connection: InsightConnection = { connectionId, insightId1, insightId2, strength, relationship };
  const connections = new Map(state.connections).set(connectionId, connection);
  return recomputeInsight({ ...state, connections, totalConnections: connections.size });
}

// Get insights by type
export function getInsightsByType(state: NarrativeInsightEngineState, type: InsightType): Insight[] {
  return Array.from(state.insights.values()).filter(i => i.type === type);
}

// Get insight report
export function getInsightReport(state: NarrativeInsightEngineState): {
  totalInsights: number;
  totalConnections: number;
  verifiedInsights: number;
  averageQuality: number;
  averageImpact: number;
  insightDensity: number;
  networkCoherence: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalInsights === 0) recommendations.push('No insights — generate insights');
  if (state.averageQuality < 0.5) recommendations.push('Low quality — deepen insights');
  if (state.networkCoherence < 0.4) recommendations.push('Low coherence — connect insights');

  return {
    totalInsights: state.totalInsights,
    totalConnections: state.totalConnections,
    verifiedInsights: state.verifiedInsights,
    averageQuality: Math.round(state.averageQuality * 100) / 100,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    insightDensity: Math.round(state.insightDensity * 100) / 100,
    networkCoherence: Math.round(state.networkCoherence * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeInsight(state: NarrativeInsightEngineState): NarrativeInsightEngineState {
  const insights = Array.from(state.insights.values());
  const qualityMap: Record<InsightQuality, number> = { surface: 0.2, shallow: 0.4, moderate: 0.6, deep: 0.8, profound: 1.0 };
  const averageQuality = insights.length === 0 ? 0.5
    : insights.reduce((s, i) => s + qualityMap[i.quality], 0) / insights.length;
  const averageImpact = insights.length === 0 ? 0.5
    : insights.reduce((s, i) => s + i.impact, 0) / insights.length;

  const insightDensity = Math.min(1, state.totalInsights / 20);

  const connections = Array.from(state.connections.values());
  const networkCoherence = insights.length === 0 || connections.length === 0 ? 0.5
    : Math.min(1, connections.length / (insights.length * 2));

  return { ...state, averageQuality, averageImpact, insightDensity, networkCoherence };
}

// Reset insight state
export function resetNarrativeInsightEngineState(): NarrativeInsightEngineState {
  return createNarrativeInsightEngineState();
}