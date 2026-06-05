/**
 * V836 AdaptiveBehaviorEngine — Direction A Iter 5/9 (Round 4)
 * Adaptive behavior engine: behavioral patterns + adaptation strategies
 * Sources: nanobot adaptive + thunderbolt + generic-agent
 */

export type BehaviorPattern = 'reactive' | 'proactive' | 'reflective' | 'exploratory' | 'consolidating';
export type AdaptationStrategy = 'incremental' | 'transformational' | 'preservative' | 'experimental';
export type BehaviorState = 'inactive' | 'active' | 'adapting' | 'mastered' | 'deprecated';

export interface Behavior {
  behaviorId: string;
  name: string;
  pattern: BehaviorPattern;
  strategy: AdaptationStrategy;
  state: BehaviorState;
  effectiveness: number;
  frequency: number;
  successRate: number;
  adaptations: number;
}

export interface BehaviorTrigger {
  triggerId: string;
  behaviorId: string;
  condition: string;
  context: string;
  active: boolean;
  activations: number;
}

export interface AdaptiveBehaviorEngineState {
  behaviors: Map<string, Behavior>;
  triggers: Map<string, BehaviorTrigger>;
  totalBehaviors: number;
  totalTriggers: number;
  activeBehaviors: number;
  masteredBehaviors: number;
  averageEffectiveness: number;
  averageSuccessRate: number;
  patternDistribution: Map<BehaviorPattern, number>;
  adaptationRate: number;
  behavioralDiversity: number;
}

// Factory
export function createAdaptiveBehaviorEngineState(): AdaptiveBehaviorEngineState {
  return {
    behaviors: new Map(),
    triggers: new Map(),
    totalBehaviors: 0,
    totalTriggers: 0,
    activeBehaviors: 0,
    masteredBehaviors: 0,
    averageEffectiveness: 0.5,
    averageSuccessRate: 0.5,
    patternDistribution: new Map(),
    adaptationRate: 0,
    behavioralDiversity: 0,
  };
}

// Add behavior
export function addBehavior(
  state: AdaptiveBehaviorEngineState,
  behaviorId: string,
  name: string,
  pattern: BehaviorPattern,
  strategy: AdaptationStrategy,
  effectiveness: number = 0.5
): AdaptiveBehaviorEngineState {
  const behavior: Behavior = {
    behaviorId, name, pattern, strategy, state: 'inactive',
    effectiveness: Math.min(1, Math.max(0, effectiveness)),
    frequency: 0, successRate: 0, adaptations: 0,
  };
  const behaviors = new Map(state.behaviors).set(behaviorId, behavior);
  const patternDistribution = new Map(state.patternDistribution);
  patternDistribution.set(pattern, (patternDistribution.get(pattern) || 0) + 1);
  return recomputeBehavior({ ...state, behaviors, patternDistribution, totalBehaviors: behaviors.size });
}

// Activate behavior
export function activateBehavior(state: AdaptiveBehaviorEngineState, behaviorId: string): AdaptiveBehaviorEngineState {
  const behavior = state.behaviors.get(behaviorId);
  if (!behavior) return state;

  const updated: Behavior = { ...behavior, state: 'active' };
  const behaviors = new Map(state.behaviors).set(behaviorId, updated);
  const activeBehaviors = state.activeBehaviors + 1;
  return recomputeBehavior({ ...state, behaviors, activeBehaviors });
}

// Record outcome
export function recordBehaviorOutcome(state: AdaptiveBehaviorEngineState, behaviorId: string, success: boolean): AdaptiveBehaviorEngineState {
  const behavior = state.behaviors.get(behaviorId);
  if (!behavior) return state;

  const newSuccessRate = (behavior.successRate * behavior.frequency + (success ? 1 : 0)) / (behavior.frequency + 1);
  const updated: Behavior = { ...behavior, successRate: newSuccessRate, frequency: behavior.frequency + 1 };
  const behaviors = new Map(state.behaviors).set(behaviorId, updated);
  return recomputeBehavior({ ...state, behaviors });
}

// Adapt behavior
export function adaptBehavior(state: AdaptiveBehaviorEngineState, behaviorId: string, effectivenessDelta: number = 0.1): AdaptiveBehaviorEngineState {
  const behavior = state.behaviors.get(behaviorId);
  if (!behavior) return state;

  const newEffectiveness = Math.min(1, Math.max(0, behavior.effectiveness + effectivenessDelta));
  const newState: BehaviorState = newEffectiveness >= 0.9 ? 'mastered' : newEffectiveness >= 0.5 ? 'adapting' : 'active';
  const updated: Behavior = { ...behavior, effectiveness: newEffectiveness, state: newState, adaptations: behavior.adaptations + 1 };
  const behaviors = new Map(state.behaviors).set(behaviorId, updated);
  const masteredBehaviors = newState === 'mastered' && behavior.state !== 'mastered' ? state.masteredBehaviors + 1 : state.masteredBehaviors;
  return recomputeBehavior({ ...state, behaviors, masteredBehaviors });
}

// Get behaviors by pattern
export function getBehaviorsByPattern(state: AdaptiveBehaviorEngineState, pattern: BehaviorPattern): Behavior[] {
  return Array.from(state.behaviors.values()).filter(b => b.pattern === pattern);
}

// Get behavior report
export function getBehaviorReport(state: AdaptiveBehaviorEngineState): {
  totalBehaviors: number;
  totalTriggers: number;
  activeBehaviors: number;
  masteredBehaviors: number;
  averageEffectiveness: number;
  averageSuccessRate: number;
  behavioralDiversity: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalBehaviors === 0) recommendations.push('No behaviors — add behaviors');
  if (state.averageEffectiveness < 0.5) recommendations.push('Low effectiveness — adapt');
  if (state.behavioralDiversity < 0.3) recommendations.push('Low diversity — add patterns');

  return {
    totalBehaviors: state.totalBehaviors,
    totalTriggers: state.totalTriggers,
    activeBehaviors: state.activeBehaviors,
    masteredBehaviors: state.masteredBehaviors,
    averageEffectiveness: Math.round(state.averageEffectiveness * 100) / 100,
    averageSuccessRate: Math.round(state.averageSuccessRate * 100) / 100,
    behavioralDiversity: Math.round(state.behavioralDiversity * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeBehavior(state: AdaptiveBehaviorEngineState): AdaptiveBehaviorEngineState {
  const behaviors = Array.from(state.behaviors.values());
  const averageEffectiveness = behaviors.length === 0 ? 0.5
    : behaviors.reduce((s, b) => s + b.effectiveness, 0) / behaviors.length;
  const averageSuccessRate = behaviors.length === 0 ? 0.5
    : behaviors.reduce((s, b) => s + b.successRate, 0) / behaviors.length;

  const patternSet = new Set(behaviors.map(b => b.pattern));
  const behavioralDiversity = Math.min(1, patternSet.size / 4);

  const totalAdaptations = behaviors.reduce((s, b) => s + b.adaptations, 0);
  const adaptationRate = behaviors.length === 0 ? 0 : totalAdaptations / behaviors.length;

  return { ...state, averageEffectiveness, averageSuccessRate, behavioralDiversity, adaptationRate };
}

// Reset behavior state
export function resetAdaptiveBehaviorEngineState(): AdaptiveBehaviorEngineState {
  return createAdaptiveBehaviorEngineState();
}