/**
 * V750 AutonomousCore — Direction A Iter 7/9 (Round 3)
 * Autonomous core: autonomous decision-making + self-direction
 * Sources: generic-agent autonomous + nanobot + thunderbolt
 */

export type AutonomyLevel = 'assisted' | 'supervised' | 'conditional' | 'full';
export type ActionType = 'create' | 'modify' | 'delete' | 'execute' | 'monitor' | 'communicate';
export type DecisionSource = 'rules' | 'learning' | 'inference' | 'random' | 'hybrid';

export interface AutonomousAction {
  actionId: string;
  type: ActionType;
  description: string;
  source: DecisionSource;
  confidence: number;
  impact: number;
  timestamp: number;
  outcome: 'success' | 'failure' | 'pending' | 'cancelled';
  reversible: boolean;
}

export interface AutonomyPolicy {
  policyId: string;
  level: AutonomyLevel;
  scope: string;
  constraints: string[];
  escalationRules: string[];
  active: boolean;
}

export interface AutonomousCoreState {
  actions: Map<string, AutonomousAction>;
  policies: Map<string, AutonomyPolicy>;
  totalActions: number;
  successfulActions: number;
  activePolicies: number;
  currentLevel: AutonomyLevel;
  averageConfidence: number;
  autonomyScore: number;
  reversibilityRate: number;
}

// Factory
export function createAutonomousCoreState(): AutonomousCoreState {
  return {
    actions: new Map(),
    policies: new Map(),
    totalActions: 0,
    successfulActions: 0,
    activePolicies: 0,
    currentLevel: 'supervised',
    averageConfidence: 0.7,
    autonomyScore: 0.5,
    reversibilityRate: 0.7,
  };
}

// Take action
export function takeAutonomousAction(
  state: AutonomousCoreState,
  actionId: string,
  type: ActionType,
  description: string,
  source: DecisionSource,
  confidence: number,
  impact: number,
  reversible: boolean = true
): AutonomousCoreState {
  const action: AutonomousAction = {
    actionId,
    type,
    description,
    source,
    confidence: Math.min(1, Math.max(0, confidence)),
    impact: Math.min(1, Math.max(0, impact)),
    timestamp: Date.now(),
    outcome: 'pending',
    reversible,
  };
  const actions = new Map(state.actions).set(actionId, action);
  return recomputeAutonomous({ ...state, actions, totalActions: actions.size });
}

// Record outcome
export function recordActionOutcome(state: AutonomousCoreState, actionId: string, outcome: 'success' | 'failure' | 'cancelled'): AutonomousCoreState {
  const action = state.actions.get(actionId);
  if (!action) return state;

  const updated: AutonomousAction = { ...action, outcome };
  const actions = new Map(state.actions).set(actionId, updated);
  const successfulActions = outcome === 'success' ? state.successfulActions + 1 : state.successfulActions;
  return recomputeAutonomous({ ...state, actions, successfulActions });
}

// Set policy
export function setAutonomyPolicy(
  state: AutonomousCoreState,
  policyId: string,
  level: AutonomyLevel,
  scope: string,
  constraints: string[] = [],
  escalationRules: string[] = [],
  active: boolean = true
): AutonomousCoreState {
  const policy: AutonomyPolicy = { policyId, level, scope, constraints, escalationRules, active };
  const policies = new Map(state.policies).set(policyId, policy);
  const activePolicies = active ? state.activePolicies + 1 : state.activePolicies;
  return recomputeAutonomous({ ...state, policies, activePolicies });
}

// Set autonomy level
export function setAutonomyLevel(state: AutonomousCoreState, level: AutonomyLevel): AutonomousCoreState {
  return { ...state, currentLevel: level };
}

// Get actions by type
export function getActionsByType(state: AutonomousCoreState, type: ActionType): AutonomousAction[] {
  return Array.from(state.actions.values()).filter(a => a.type === type);
}

// Get actions by outcome
export function getActionsByOutcome(state: AutonomousCoreState, outcome: AutonomousAction['outcome']): AutonomousAction[] {
  return Array.from(state.actions.values()).filter(a => a.outcome === outcome);
}

// Get autonomous report
export function getAutonomousCoreReport(state: AutonomousCoreState): {
  totalActions: number;
  successfulActions: number;
  averageConfidence: number;
  autonomyScore: number;
  reversibilityRate: number;
  currentLevel: AutonomyLevel;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalActions === 0) recommendations.push('No actions — take actions');
  if (state.averageConfidence < 0.5) recommendations.push('Low confidence — gather more info');
  if (state.autonomyScore < 0.5) recommendations.push('Low autonomy — increase level');

  return {
    totalActions: state.totalActions,
    successfulActions: state.successfulActions,
    averageConfidence: Math.round(state.averageConfidence * 100) / 100,
    autonomyScore: Math.round(state.autonomyScore * 100) / 100,
    reversibilityRate: Math.round(state.reversibilityRate * 100) / 100,
    currentLevel: state.currentLevel,
    recommendations,
  };
}

// Recompute metrics
function recomputeAutonomous(state: AutonomousCoreState): AutonomousCoreState {
  const actions = Array.from(state.actions.values());
  const averageConfidence = actions.length > 0
    ? actions.reduce((s, a) => s + a.confidence, 0) / actions.length
    : 0.7;

  const reversed = actions.filter(a => a.reversible).length;
  const reversibilityRate = actions.length === 0 ? 0.7 : reversed / actions.length;

  const successRate = actions.length === 0 ? 0.5 : state.successfulActions / actions.length;
  const levelMap: Record<AutonomyLevel, number> = { assisted: 0.25, supervised: 0.5, conditional: 0.75, full: 1.0 };
  const autonomyScore = (successRate + levelMap[state.currentLevel]) / 2;

  return { ...state, averageConfidence, reversibilityRate, autonomyScore };
}

// Reset autonomous state
export function resetAutonomousCoreState(): AutonomousCoreState {
  return createAutonomousCoreState();
}