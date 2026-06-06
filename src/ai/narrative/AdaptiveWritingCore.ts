/**
 * V906 AdaptiveWritingCore — Direction D Iter 1/15 (Round 4)
 * Adaptive writing core: writing adaptation + responsive composition
 * Sources: generic-agent adaptive + thunderbolt feedback + nanobot
 */

export type AdaptationTrigger = 'feedback' | 'metrics' | 'context' | 'time' | 'goal' | 'random';
export type AdaptationResponse = 'maintain' | 'adjust' | 'transform' | 'reinforce' | 'explore' | 'consolidate';
export type AdaptationStrength = 'minimal' | 'subtle' | 'moderate' | 'strong' | 'radical';

export interface AdaptationEvent {
  eventId: string;
  trigger: AdaptationTrigger;
  response: AdaptationResponse;
  strength: AdaptationStrength;
  description: string;
  impact: number;
  success: boolean;
  chapter: number;
}

export interface AdaptationPattern {
  patternId: string;
  name: string;
  triggerEventIds: string[];
  successRate: number;
  usage: number;
}

export interface AdaptiveWritingCoreState {
  events: Map<string, AdaptationEvent>;
  patterns: Map<string, AdaptationPattern>;
  totalEvents: number;
  totalPatterns: number;
  successCount: number;
  successRate: number;
  averageImpact: number;
  adaptationAgility: number;
  coreMastery: number;
}

// Factory
export function createAdaptiveWritingCoreState(): AdaptiveWritingCoreState {
  return {
    events: new Map(),
    patterns: new Map(),
    totalEvents: 0,
    totalPatterns: 0,
    successCount: 0,
    successRate: 0.5,
    averageImpact: 0.5,
    adaptationAgility: 0.5,
    coreMastery: 0.5,
  };
}

// Record adaptation
export function recordAdaptation(
  state: AdaptiveWritingCoreState,
  eventId: string,
  trigger: AdaptationTrigger,
  response: AdaptationResponse,
  strength: AdaptationStrength,
  description: string,
  impact: number,
  success: boolean,
  chapter: number
): AdaptiveWritingCoreState {
  const event: AdaptationEvent = {
    eventId, trigger, response, strength, description,
    impact: Math.min(1, Math.max(0, impact)), success, chapter,
  };
  const events = new Map(state.events).set(eventId, event);
  const successCount = success ? state.successCount + 1 : state.successCount;
  return recomputeAdaptCore({ ...state, events, successCount, totalEvents: events.size });
}

// Add pattern
export function addAdaptationPattern(
  state: AdaptiveWritingCoreState,
  patternId: string,
  name: string,
  triggerEventIds: string[]
): AdaptiveWritingCoreState {
  const events = triggerEventIds.map(id => state.events.get(id)).filter((e): e is AdaptationEvent => e !== undefined);
  const successCount = events.filter(e => e.success).length;
  const successRate = events.length === 0 ? 0.5 : successCount / events.length;
  const pattern: AdaptationPattern = { patternId, name, triggerEventIds, successRate, usage: 0 };
  const patterns = new Map(state.patterns).set(patternId, pattern);
  return recomputeAdaptCore({ ...state, patterns, totalPatterns: patterns.size });
}

// Use pattern
export function useAdaptationPattern(state: AdaptiveWritingCoreState, patternId: string): AdaptiveWritingCoreState {
  const pattern = state.patterns.get(patternId);
  if (!pattern) return state;

  const updated: AdaptationPattern = { ...pattern, usage: pattern.usage + 1 };
  const patterns = new Map(state.patterns).set(patternId, updated);
  return recomputeAdaptCore({ ...state, patterns });
}

// Get events by trigger
export function getEventsByTrigger(state: AdaptiveWritingCoreState, trigger: AdaptationTrigger): AdaptationEvent[] {
  return Array.from(state.events.values()).filter(e => e.trigger === trigger);
}

// Get adaptation report
export function getAdaptationReport(state: AdaptiveWritingCoreState): {
  totalEvents: number;
  totalPatterns: number;
  successRate: number;
  averageImpact: number;
  adaptationAgility: number;
  coreMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEvents === 0) recommendations.push('No events — record adaptations');
  if (state.successRate < 0.5) recommendations.push('Low success — improve adaptations');
  if (state.adaptationAgility < 0.4) recommendations.push('Low agility — improve responsiveness');

  return {
    totalEvents: state.totalEvents,
    totalPatterns: state.totalPatterns,
    successRate: Math.round(state.successRate * 100) / 100,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    adaptationAgility: Math.round(state.adaptationAgility * 100) / 100,
    coreMastery: Math.round(state.coreMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAdaptCore(state: AdaptiveWritingCoreState): AdaptiveWritingCoreState {
  const events = Array.from(state.events.values());
  const successRate = events.length === 0 ? 0.5
    : events.filter(e => e.success).length / events.length;
  const averageImpact = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.impact, 0) / events.length;

  // Agility: response diversity + strength range
  const responseSet = new Set(events.map(e => e.response));
  const strengthMap: Record<AdaptationStrength, number> = { minimal: 0.2, subtle: 0.4, moderate: 0.6, strong: 0.8, radical: 1.0 };
  const avgStrength = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + strengthMap[e.strength], 0) / events.length;
  const adaptationAgility = Math.min(1, (responseSet.size / 6) * 0.5 + avgStrength * 0.5);

  const patterns = Array.from(state.patterns.values());
  const avgPatternSuccess = patterns.length === 0 ? 0.5
    : patterns.reduce((s, p) => s + p.successRate, 0) / patterns.length;
  const coreMastery = (successRate * 0.4 + averageImpact * 0.3 + avgPatternSuccess * 0.3);

  return { ...state, successRate, averageImpact, adaptationAgility, coreMastery };
}

// Reset adaptation state
export function resetAdaptiveWritingCoreState(): AdaptiveWritingCoreState {
  return createAdaptiveWritingCoreState();
}