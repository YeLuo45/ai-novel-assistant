/**
 * V738 NarrativeAdaptationCore — Direction A Iter 1/9 (Round 3)
 * Narrative adaptation core: continuous narrative adaptation
 * Sources: nanobot self-reg + generic-agent + thunderbolt feedback
 */

export type AdaptationType = 'content' | 'style' | 'pacing' | 'structure' | 'tone' | 'character';
export type AdaptationTrigger = 'feedback' | 'metric' | 'time' | 'context' | 'user_action';
export type AdaptationStatus = 'monitoring' | 'adapting' | 'stabilized' | 'overridden' | 'completed';

export interface AdaptationRule {
  ruleId: string;
  type: AdaptationType;
  trigger: AdaptationTrigger;
  condition: string;
  adjustment: string;
  threshold: number;
  active: boolean;
}

export interface AdaptationEvent {
  eventId: string;
  ruleId: string;
  type: AdaptationType;
  trigger: AdaptationTrigger;
  oldValue: number;
  newValue: number;
  timestamp: number;
  impact: number;
  status: AdaptationStatus;
}

export interface NarrativeAdaptationCoreState {
  rules: Map<string, AdaptationRule>;
  events: Map<string, AdaptationEvent>;
  activeRules: number;
  totalRules: number;
  totalEvents: number;
  successfulAdaptations: number;
  averageImpact: number;
  adaptationRate: number;
  stabilityScore: number;
}

// Factory
export function createNarrativeAdaptationCoreState(): NarrativeAdaptationCoreState {
  return {
    rules: new Map(),
    events: new Map(),
    activeRules: 0,
    totalRules: 0,
    totalEvents: 0,
    successfulAdaptations: 0,
    averageImpact: 0.5,
    adaptationRate: 0.5,
    stabilityScore: 0.7,
  };
}

// Add rule
export function addAdaptationRule(
  state: NarrativeAdaptationCoreState,
  ruleId: string,
  type: AdaptationType,
  trigger: AdaptationTrigger,
  condition: string,
  adjustment: string,
  threshold: number = 0.5,
  active: boolean = true
): NarrativeAdaptationCoreState {
  const rule: AdaptationRule = { ruleId, type, trigger, condition, adjustment, threshold, active };
  const rules = new Map(state.rules).set(ruleId, rule);
  return recomputeAdaptation({ ...state, rules, totalRules: rules.size, activeRules: state.activeRules + (active ? 1 : 0) });
}

// Trigger adaptation
export function triggerAdaptation(
  state: NarrativeAdaptationCoreState,
  eventId: string,
  ruleId: string,
  oldValue: number,
  newValue: number,
  impact: number
): NarrativeAdaptationCoreState {
  const rule = state.rules.get(ruleId);
  if (!rule) return state;

  const event: AdaptationEvent = {
    eventId,
    ruleId,
    type: rule.type,
    trigger: rule.trigger,
    oldValue,
    newValue,
    timestamp: Date.now(),
    impact,
    status: 'adapting',
  };
  const events = new Map(state.events).set(eventId, event);
  return recomputeAdaptation({ ...state, events, totalEvents: events.size });
}

// Complete adaptation
export function completeAdaptation(state: NarrativeAdaptationCoreState, eventId: string, successful: boolean): NarrativeAdaptationCoreState {
  const event = state.events.get(eventId);
  if (!event) return state;

  const updated: AdaptationEvent = { ...event, status: successful ? 'completed' : 'overridden' };
  const events = new Map(state.events).set(eventId, updated);
  const successfulAdaptations = successful ? state.successfulAdaptations + 1 : state.successfulAdaptations;
  return recomputeAdaptation({ ...state, events, successfulAdaptations });
}

// Toggle rule
export function toggleAdaptationRule(state: NarrativeAdaptationCoreState, ruleId: string, active: boolean): NarrativeAdaptationCoreState {
  const rule = state.rules.get(ruleId);
  if (!rule) return state;

  const updated: AdaptationRule = { ...rule, active };
  const rules = new Map(state.rules).set(ruleId, updated);
  const activeRules = active ? state.activeRules + 1 : state.activeRules - 1;
  return recomputeAdaptation({ ...state, rules, activeRules: Math.max(0, activeRules) });
}

// Get rules by type
export function getAdaptationRulesByType(state: NarrativeAdaptationCoreState, type: AdaptationType): AdaptationRule[] {
  return Array.from(state.rules.values()).filter(r => r.type === type);
}

// Get events by trigger
export function getAdaptationEventsByTrigger(state: NarrativeAdaptationCoreState, trigger: AdaptationTrigger): AdaptationEvent[] {
  return Array.from(state.events.values()).filter(e => e.trigger === trigger);
}

// Get adaptation report
export function getAdaptationCoreReport(state: NarrativeAdaptationCoreState): {
  totalRules: number;
  activeRules: number;
  totalEvents: number;
  successfulAdaptations: number;
  averageImpact: number;
  adaptationRate: number;
  stabilityScore: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalRules === 0) recommendations.push('No rules — define adaptation rules');
  if (state.adaptationRate < 0.5) recommendations.push('Low adaptation rate — improve success rate');
  if (state.stabilityScore < 0.5) recommendations.push('Low stability — too many changes');

  return {
    totalRules: state.totalRules,
    activeRules: state.activeRules,
    totalEvents: state.totalEvents,
    successfulAdaptations: state.successfulAdaptations,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    adaptationRate: Math.round(state.adaptationRate * 100) / 100,
    stabilityScore: Math.round(state.stabilityScore * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAdaptation(state: NarrativeAdaptationCoreState): NarrativeAdaptationCoreState {
  const events = Array.from(state.events.values());
  const averageImpact = events.length > 0
    ? events.reduce((s, e) => s + e.impact, 0) / events.length
    : 0.5;
  const adaptationRate = state.totalEvents === 0 ? 0.5 : state.successfulAdaptations / state.totalEvents;
  const stabilityScore = state.totalEvents === 0 ? 0.7 : 1 - Math.min(1, state.totalEvents / 20);

  return { ...state, averageImpact, adaptationRate, stabilityScore };
}

// Reset adaptation state
export function resetNarrativeAdaptationCoreState(): NarrativeAdaptationCoreState {
  return createNarrativeAdaptationCoreState();
}