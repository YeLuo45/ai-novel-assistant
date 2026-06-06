/**
 * V982 NarrativeAdaptiveOrchestratorCore — Direction A Iter 9/15 (Round 5)
 * Adaptive orchestrator core: orchestration that adapts dynamically
 * Sources: ruflo orchestrator + nanobot + thunderbolt
 */

export type OrchestrationMode = 'reactive' | 'proactive' | 'anticipatory' | 'adaptive' | 'predictive';
export type ComponentState = 'inactive' | 'active' | 'busy' | 'overloaded' | 'degraded' | 'failed';
export type OrchestrationPolicy = 'strict' | 'balanced' | 'flexible' | 'permissive' | 'autonomous';

export interface OrchestrationComponent {
  componentId: string;
  state: ComponentState;
  mode: OrchestrationMode;
  load: number;
  capacity: number;
  utilization: number;
  chapter: number;
}

export interface OrchestrationPlan {
  planId: string,
  name: string,
  componentIds: string[],
  policy: OrchestrationPolicy,
  coherence: number,
  efficiency: number,
}

export interface NarrativeAdaptiveOrchestratorCoreState {
  components: Map<string, OrchestrationComponent>;
  plans: Map<string, OrchestrationPlan>;
  totalComponents: number;
  totalPlans: number;
  averageUtilization: number;
  policyEffectiveness: number;
  orchestrationFlow: number;
  adaptiveOrchestrationMastery: number;
}

// Factory
export function createNarrativeAdaptiveOrchestratorCoreState(): NarrativeAdaptiveOrchestratorCoreState {
  return {
    components: new Map(),
    plans: new Map(),
    totalComponents: 0,
    totalPlans: 0,
    averageUtilization: 0.5,
    policyEffectiveness: 0.5,
    orchestrationFlow: 0.5,
    adaptiveOrchestrationMastery: 0.5,
  };
}

// Add component
export function addOrchestrationComponent(
  state: NarrativeAdaptiveOrchestratorCoreState,
  componentId: string,
  mode: OrchestrationMode,
  load: number,
  capacity: number,
  chapter: number
): NarrativeAdaptiveOrchestratorCoreState {
  const utilization = capacity === 0 ? 0 : Math.min(1, load / capacity);
  const stateValue: ComponentState = utilization > 0.95 ? 'overloaded'
    : utilization > 0.8 ? 'busy'
    : utilization > 0.1 ? 'active'
    : 'inactive';
  const component: OrchestrationComponent = { componentId, state: stateValue, mode, load, capacity, utilization, chapter };
  const components = new Map(state.components).set(componentId, component);
  return recomputeOrchestrator({ ...state, components, totalComponents: components.size });
}

// Create plan
export function createOrchestrationPlan(
  state: NarrativeAdaptiveOrchestratorCoreState,
  planId: string,
  name: string,
  componentIds: string[],
  policy: OrchestrationPolicy
): NarrativeAdaptiveOrchestratorCoreState {
  const components = componentIds.map(id => state.components.get(id)).filter((c): c is OrchestrationComponent => c !== undefined);
  const efficiency = components.length === 0 ? 0.5
    : 1 - (components.reduce((s, c) => s + c.utilization, 0) / components.length - 0.7) ** 2;
  const coherence = components.length < 2 ? 1
    : Math.max(0, 1 - Math.abs(components[0].utilization - components[components.length - 1].utilization));
  const plan: OrchestrationPlan = { planId, name, componentIds, policy, coherence, efficiency };
  const plans = new Map(state.plans).set(planId, plan);
  return recomputeOrchestrator({ ...state, plans, totalPlans: plans.size });
}

// Get components by mode
export function getComponentsByMode(state: NarrativeAdaptiveOrchestratorCoreState, mode: OrchestrationMode): OrchestrationComponent[] {
  return Array.from(state.components.values()).filter(c => c.mode === mode);
}

// Get orchestrator report
export function getOrchestratorReport(state: NarrativeAdaptiveOrchestratorCoreState): {
  totalComponents: number;
  totalPlans: number;
  averageUtilization: number;
  policyEffectiveness: number;
  adaptiveOrchestrationMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalComponents === 0) recommendations.push('No components — add components');
  if (state.averageUtilization < 0.2 || state.averageUtilization > 0.9) recommendations.push('Utilization out of range');
  if (state.adaptiveOrchestrationMastery < 0.5) recommendations.push('Low mastery — improve');

  return {
    totalComponents: state.totalComponents,
    totalPlans: state.totalPlans,
    averageUtilization: Math.round(state.averageUtilization * 100) / 100,
    policyEffectiveness: Math.round(state.policyEffectiveness * 100) / 100,
    adaptiveOrchestrationMastery: Math.round(state.adaptiveOrchestrationMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeOrchestrator(state: NarrativeAdaptiveOrchestratorCoreState): NarrativeAdaptiveOrchestratorCoreState {
  const components = Array.from(state.components.values());
  const averageUtilization = components.length === 0 ? 0.5
    : components.reduce((s, c) => s + c.utilization, 0) / components.length;

  // Flow: how close to optimal (0.7) utilization
  const orchestrationFlow = 1 - Math.abs(0.7 - averageUtilization);

  const plans = Array.from(state.plans.values());
  const policyEffectiveness = plans.length === 0 ? 0.5
    : plans.reduce((s, p) => s + p.efficiency, 0) / plans.length;

  const adaptiveOrchestrationMastery = (orchestrationFlow * 0.4 + policyEffectiveness * 0.3 + averageUtilization * 0.3);

  return { ...state, averageUtilization, policyEffectiveness, orchestrationFlow, adaptiveOrchestrationMastery };
}

// Reset
export function resetNarrativeAdaptiveOrchestratorCoreState(): NarrativeAdaptiveOrchestratorCoreState {
  return createNarrativeAdaptiveOrchestratorCoreState();
}