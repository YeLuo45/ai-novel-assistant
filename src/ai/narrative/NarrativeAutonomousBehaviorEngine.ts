/**
 * V990 NarrativeAutonomousBehaviorEngine — Direction A Iter 13/15 (Round 5)
 * Autonomous behavior engine: autonomous narrative behaviors
 * Sources: generic-agent autonomous + thunderbolt + nanobot
 */

export type BehaviorType = 'explore' | 'exploit' | 'experiment' | 'persist' | 'flex' | 'reflect';
export type BehaviorOrigin = 'innate' | 'learned' | 'emergent' | 'evolved' | 'composed';
export type BehaviorFrequency = 'rare' | 'occasional' | 'common' | 'frequent' | 'constant';

export interface AutonomousBehavior {
  behaviorId: string;
  type: BehaviorType;
  origin: BehaviorOrigin;
  frequency: BehaviorFrequency;
  description: string;
  effectiveness: number;
  successRate: number;
  chapter: number;
}

export interface BehaviorRule {
  ruleId: string,
  condition: string,
  action: string,
  priority: number,
  successCount: number,
}

export interface NarrativeAutonomousBehaviorEngineState {
  behaviors: Map<string, AutonomousBehavior>;
  rules: Map<string, BehaviorRule>;
  totalBehaviors: number;
  totalRules: number;
  totalActivations: number;
  averageEffectiveness: number;
  behaviorAutonomy: number;
  autonomousBehaviorMastery: number;
}

// Factory
export function createNarrativeAutonomousBehaviorEngineState(): NarrativeAutonomousBehaviorEngineState {
  return {
    behaviors: new Map(),
    rules: new Map(),
    totalBehaviors: 0,
    totalRules: 0,
    totalActivations: 0,
    averageEffectiveness: 0.5,
    behaviorAutonomy: 0.5,
    autonomousBehaviorMastery: 0.5,
  };
}

// Add behavior
export function addAutonomousBehavior(
  state: NarrativeAutonomousBehaviorEngineState,
  behaviorId: string,
  type: BehaviorType,
  origin: BehaviorOrigin,
  frequency: BehaviorFrequency,
  description: string,
  effectiveness: number,
  successRate: number,
  chapter: number
): NarrativeAutonomousBehaviorEngineState {
  const behavior: AutonomousBehavior = { behaviorId, type, origin, frequency, description, effectiveness, successRate, chapter };
  const behaviors = new Map(state.behaviors).set(behaviorId, behavior);
  return recomputeAutoBehavior({ ...state, behaviors, totalBehaviors: behaviors.size });
}

// Activate behavior
export function activateBehavior(state: NarrativeAutonomousBehaviorEngineState, behaviorId: string): NarrativeAutonomousBehaviorEngineState {
  const totalActivations = state.totalActivations + 1;
  return recomputeAutoBehavior({ ...state, totalActivations });
}

// Add rule
export function addBehaviorRule(
  state: NarrativeAutonomousBehaviorEngineState,
  ruleId: string,
  condition: string,
  action: string,
  priority: number
): NarrativeAutonomousBehaviorEngineState {
  const rule: BehaviorRule = { ruleId, condition, action, priority, successCount: 0 };
  const rules = new Map(state.rules).set(ruleId, rule);
  return recomputeAutoBehavior({ ...state, rules, totalRules: rules.size });
}

// Use rule
export function useBehaviorRule(state: NarrativeAutonomousBehaviorEngineState, ruleId: string, success: boolean): NarrativeAutonomousBehaviorEngineState {
  const rule = state.rules.get(ruleId);
  if (!rule) return state;

  const updated: BehaviorRule = { ...rule, successCount: success ? rule.successCount + 1 : rule.successCount };
  const rules = new Map(state.rules).set(ruleId, updated);
  return recomputeAutoBehavior({ ...state, rules });
}

// Get behaviors by type
export function getBehaviorsByType(state: NarrativeAutonomousBehaviorEngineState, type: BehaviorType): AutonomousBehavior[] {
  return Array.from(state.behaviors.values()).filter(b => b.type === type);
}

// Get behavior report
export function getAutonomousBehaviorReport(state: NarrativeAutonomousBehaviorEngineState): {
  totalBehaviors: number;
  totalRules: number;
  totalActivations: number;
  averageEffectiveness: number;
  autonomousBehaviorMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalBehaviors === 0) recommendations.push('No behaviors — add behaviors');
  if (state.averageEffectiveness < 0.5) recommendations.push('Low effectiveness — improve');
  if (state.autonomousBehaviorMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalBehaviors: state.totalBehaviors,
    totalRules: state.totalRules,
    totalActivations: state.totalActivations,
    averageEffectiveness: Math.round(state.averageEffectiveness * 100) / 100,
    autonomousBehaviorMastery: Math.round(state.autonomousBehaviorMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAutoBehavior(state: NarrativeAutonomousBehaviorEngineState): NarrativeAutonomousBehaviorEngineState {
  const behaviors = Array.from(state.behaviors.values());
  const averageEffectiveness = behaviors.length === 0 ? 0.5
    : behaviors.reduce((s, b) => s + b.effectiveness, 0) / behaviors.length;
  const averageSuccess = behaviors.length === 0 ? 0.5
    : behaviors.reduce((s, b) => s + b.successRate, 0) / behaviors.length;

  const typeSet = new Set(behaviors.map(b => b.type));
  const typeCoverage = Math.min(1, typeSet.size / 5);

  // Autonomy: behaviors that are emergent or evolved
  const originMap: Record<BehaviorOrigin, number> = { innate: 0.5, learned: 0.6, emergent: 0.8, evolved: 0.9, composed: 0.7 };
  const behaviorAutonomy = behaviors.length === 0 ? 0.5
    : behaviors.reduce((s, b) => s + originMap[b.origin], 0) / behaviors.length;

  const autonomousBehaviorMastery = (averageEffectiveness * 0.4 + averageSuccess * 0.3 + behaviorAutonomy * 0.3);

  return { ...state, averageEffectiveness, behaviorAutonomy, autonomousBehaviorMastery };
}

// Reset
export function resetNarrativeAutonomousBehaviorEngineState(): NarrativeAutonomousBehaviorEngineState {
  return createNarrativeAutonomousBehaviorEngineState();
}