/**
 * V680 ReaderEngagementEngine — Direction C Iter 8/9 (Round 2)
 * Reader engagement engine: hooks, curiosity, suspense, payoff
 * Sources: thunderbolt engagement + nanobot reader-state + generic-agent
 */

export type HookType = 'curiosity' | 'tension' | 'mystery' | 'emotion' | 'humor' | 'revelation';
export type EngagementLevel = 'low' | 'medium' | 'high' | 'peak';

export interface EngagementHook {
  hookId: string;
  type: HookType;
  description: string;
  placement: number;
  strength: number;
  resolved: boolean;
  resolutionPosition: number | null;
}

export interface EngagementEvent {
  sceneId: string;
  engagement: number;
  type: 'climax' | 'calm' | 'build' | 'release';
  timestamp: number;
}

export interface ReaderEngagementState {
  hooks: Map<string, EngagementHook>;
  engagementCurve: EngagementEvent[];
  averageEngagement: number;
  peakEngagement: number;
  engagementVolatility: number;
  unresolvedHooks: number;
  totalHooks: number;
}

// Factory
export function createReaderEngagementState(): ReaderEngagementState {
  return {
    hooks: new Map(),
    engagementCurve: [],
    averageEngagement: 0.5,
    peakEngagement: 0,
    engagementVolatility: 0,
    unresolvedHooks: 0,
    totalHooks: 0,
  };
}

// Add engagement hook
export function addEngagementHook(
  state: ReaderEngagementState,
  hookId: string,
  type: HookType,
  description: string,
  placement: number,
  strength: number = 0.5
): ReaderEngagementState {
  const hook: EngagementHook = {
    hookId,
    type,
    description,
    placement,
    strength: Math.min(1, Math.max(0, strength)),
    resolved: false,
    resolutionPosition: null,
  };

  const hooks = new Map(state.hooks).set(hookId, hook);
  return recomputeEngagementMetrics({ ...state, hooks, totalHooks: hooks.size });
}

// Resolve engagement hook
export function resolveEngagementHook(
  state: ReaderEngagementState,
  hookId: string,
  resolutionPosition: number
): ReaderEngagementState {
  const hook = state.hooks.get(hookId);
  if (!hook) return state;

  const updated: EngagementHook = { ...hook, resolved: true, resolutionPosition };
  const hooks = new Map(state.hooks).set(hookId, updated);
  return recomputeEngagementMetrics({ ...state, hooks });
}

// Add engagement event
export function addEngagementEvent(
  state: ReaderEngagementState,
  sceneId: string,
  engagement: number,
  type: EngagementEvent['type'],
  timestamp: number
): ReaderEngagementState {
  const event: EngagementEvent = { sceneId, engagement, type, timestamp };
  const engagementCurve = [...state.engagementCurve, event];
  return recomputeEngagementMetrics({ ...state, engagementCurve });
}

// Get hooks by type
export function getHooksByType(state: ReaderEngagementState, type: HookType): EngagementHook[] {
  return Array.from(state.hooks.values()).filter(h => h.type === type);
}

// Get engagement level
export function getEngagementLevel(state: ReaderEngagementState): EngagementLevel {
  if (state.averageEngagement >= 0.85) return 'peak';
  if (state.averageEngagement >= 0.65) return 'high';
  if (state.averageEngagement >= 0.4) return 'medium';
  return 'low';
}

// Get engagement recommendations
export function getEngagementRecommendations(state: ReaderEngagementState): string[] {
  const recommendations: string[] = [];
  if (state.unresolvedHooks > 10) recommendations.push('Too many unresolved hooks — resolve some');
  if (state.unresolvedHooks === 0 && state.totalHooks > 5) recommendations.push('All hooks resolved — add new hooks for continued engagement');
  if (state.averageEngagement < 0.5) recommendations.push('Low average engagement — strengthen hooks');
  if (state.engagementVolatility > 0.4) recommendations.push('High volatility — smooth engagement curve');
  return recommendations;
}

// Get engagement report
export function getEngagementReport(state: ReaderEngagementState): {
  totalHooks: number;
  unresolvedHooks: number;
  averageEngagement: number;
  peakEngagement: number;
  engagementLevel: EngagementLevel;
  recommendations: string[];
} {
  return {
    totalHooks: state.totalHooks,
    unresolvedHooks: state.unresolvedHooks,
    averageEngagement: Math.round(state.averageEngagement * 100) / 100,
    peakEngagement: Math.round(state.peakEngagement * 100) / 100,
    engagementLevel: getEngagementLevel(state),
    recommendations: getEngagementRecommendations(state),
  };
}

// Recompute metrics
function recomputeEngagementMetrics(state: ReaderEngagementState): ReaderEngagementState {
  const hooks = Array.from(state.hooks.values());
  const unresolvedHooks = hooks.filter(h => !h.resolved).length;

  const engagementValues = state.engagementCurve.map(e => e.engagement);
  const averageEngagement = engagementValues.length > 0
    ? engagementValues.reduce((s, e) => s + e, 0) / engagementValues.length
    : 0.5;
  const peakEngagement = engagementValues.length > 0
    ? Math.max(...engagementValues)
    : 0;

  let engagementVolatility = 0;
  if (engagementValues.length > 1) {
    const mean = averageEngagement;
    const variance = engagementValues.reduce((s, e) => s + Math.pow(e - mean, 2), 0) / engagementValues.length;
    engagementVolatility = Math.sqrt(variance);
  }

  return { ...state, unresolvedHooks, averageEngagement, peakEngagement, engagementVolatility };
}

// Reset engagement state
export function resetReaderEngagementState(): ReaderEngagementState {
  return createReaderEngagementState();
}