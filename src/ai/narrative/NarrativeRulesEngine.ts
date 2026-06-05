/**
 * V788 NarrativeRulesEngine — Direction C Iter 8/9 (Round 3)
 * Narrative rules engine: rule-based narrative + genre conventions
 * Sources: ruflo rules + thunderbolt + chatdev
 */

export type RuleCategory = 'genre' | 'plot' | 'character' | 'world' | 'style' | 'theme';
export type RuleScope = 'global' | 'arc' | 'chapter' | 'scene' | 'character' | 'location';
export type RuleStatus = 'draft' | 'active' | 'suspended' | 'deprecated' | 'broken';

export interface NarrativeRule {
  ruleId: string;
  name: string;
  category: RuleCategory;
  scope: RuleScope;
  description: string;
  status: RuleStatus;
  priority: number;
  violations: number;
  successes: number;
}

export interface RuleViolation {
  violationId: string;
  ruleId: string;
  description: string;
  chapter: number;
  severity: number;
  acknowledged: boolean;
}

export interface NarrativeRulesEngineState {
  rules: Map<string, NarrativeRule>;
  violations: Map<string, RuleViolation>;
  totalRules: number;
  activeRules: number;
  totalViolations: number;
  acknowledgedViolations: number;
  averageCompliance: number;
  categoryDistribution: Map<RuleCategory, number>;
  ruleHealth: number;
}

// Factory
export function createNarrativeRulesEngineState(): NarrativeRulesEngineState {
  return {
    rules: new Map(),
    violations: new Map(),
    totalRules: 0,
    activeRules: 0,
    totalViolations: 0,
    acknowledgedViolations: 0,
    averageCompliance: 0.7,
    categoryDistribution: new Map(),
    ruleHealth: 0.7,
  };
}

// Add rule
export function addNarrativeRule(
  state: NarrativeRulesEngineState,
  ruleId: string,
  name: string,
  category: RuleCategory,
  scope: RuleScope,
  description: string,
  priority: number = 1,
  status: RuleStatus = 'active'
): NarrativeRulesEngineState {
  const rule: NarrativeRule = { ruleId, name, category, scope, description, status, priority, violations: 0, successes: 0 };
  const rules = new Map(state.rules).set(ruleId, rule);
  const activeRules = status === 'active' ? state.activeRules + 1 : state.activeRules;
  const categoryDistribution = new Map(state.categoryDistribution);
  categoryDistribution.set(category, (categoryDistribution.get(category) || 0) + 1);
  return recomputeRules({ ...state, rules, activeRules, categoryDistribution, totalRules: rules.size });
}

// Set rule status
export function setRuleStatus(state: NarrativeRulesEngineState, ruleId: string, status: RuleStatus): NarrativeRulesEngineState {
  const rule = state.rules.get(ruleId);
  if (!rule) return state;

  const updated: NarrativeRule = { ...rule, status };
  const rules = new Map(state.rules).set(ruleId, updated);

  // Adjust active count
  let activeRules = state.activeRules;
  if (status === 'active' && rule.status !== 'active') activeRules++;
  if (status !== 'active' && rule.status === 'active') activeRules = Math.max(0, activeRules - 1);

  return recomputeRules({ ...state, rules, activeRules });
}

// Record violation
export function recordRuleViolation(
  state: NarrativeRulesEngineState,
  violationId: string,
  ruleId: string,
  description: string,
  chapter: number,
  severity: number = 0.5
): NarrativeRulesEngineState {
  const violation: RuleViolation = { violationId, ruleId, description, chapter, severity: Math.min(1, Math.max(0, severity)), acknowledged: false };
  const violations = new Map(state.violations).set(violationId, violation);

  // Increment rule violations
  const rule = state.rules.get(ruleId);
  let rules = state.rules;
  if (rule) {
    const updated: NarrativeRule = { ...rule, violations: rule.violations + 1 };
    rules = new Map(state.rules).set(ruleId, updated);
  }

  return recomputeRules({ ...state, rules, violations, totalViolations: violations.size });
}

// Record success
export function recordRuleSuccess(state: NarrativeRulesEngineState, ruleId: string): NarrativeRulesEngineState {
  const rule = state.rules.get(ruleId);
  if (!rule) return state;

  const updated: NarrativeRule = { ...rule, successes: rule.successes + 1 };
  const rules = new Map(state.rules).set(ruleId, updated);
  return recomputeRules({ ...state, rules });
}

// Acknowledge violation
export function acknowledgeViolation(state: NarrativeRulesEngineState, violationId: string): NarrativeRulesEngineState {
  const violation = state.violations.get(violationId);
  if (!violation) return state;

  const updated: RuleViolation = { ...violation, acknowledged: true };
  const violations = new Map(state.violations).set(violationId, updated);
  return recomputeRules({ ...state, violations, acknowledgedViolations: state.acknowledgedViolations + 1 });
}

// Get rules by category
export function getRulesByCategory(state: NarrativeRulesEngineState, category: RuleCategory): NarrativeRule[] {
  return Array.from(state.rules.values()).filter(r => r.category === category);
}

// Get rules report
export function getRulesReport(state: NarrativeRulesEngineState): {
  totalRules: number;
  activeRules: number;
  totalViolations: number;
  averageCompliance: number;
  ruleHealth: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalRules === 0) recommendations.push('No rules — add narrative rules');
  if (state.averageCompliance < 0.5) recommendations.push('Low compliance — review rules');
  if (state.ruleHealth < 0.5) recommendations.push('Low rule health — review violations');

  return {
    totalRules: state.totalRules,
    activeRules: state.activeRules,
    totalViolations: state.totalViolations,
    averageCompliance: Math.round(state.averageCompliance * 100) / 100,
    ruleHealth: Math.round(state.ruleHealth * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeRules(state: NarrativeRulesEngineState): NarrativeRulesEngineState {
  const rules = Array.from(state.rules.values());
  const totalChecks = rules.reduce((s, r) => s + r.violations + r.successes, 0);
  const totalSuccesses = rules.reduce((s, r) => s + r.successes, 0);
  const averageCompliance = totalChecks === 0 ? 0.7 : totalSuccesses / totalChecks;

  const healthScore = state.totalViolations === 0
    ? 0.9
    : Math.max(0, 1 - state.totalViolations / Math.max(1, state.totalRules * 5));
  const ruleHealth = healthScore;

  return { ...state, averageCompliance, ruleHealth };
}

// Reset rules state
export function resetNarrativeRulesEngineState(): NarrativeRulesEngineState {
  return createNarrativeRulesEngineState();
}