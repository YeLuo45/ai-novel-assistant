/**
 * V774 NarrativeRealityEngine — Direction C Iter 1/9 (Round 3)
 * Narrative reality engine: reality consistency + world physics
 * Sources: ruflo rules + thunderbolt + nanobot
 */

export type RealityType = 'physical' | 'magical' | 'social' | 'temporal' | 'metaphysical' | 'hybrid';
export type RealityStrength = 'rigid' | 'consistent' | 'flexible' | 'malleable' | 'subjective';
export type RealityViolation = 'minor' | 'moderate' | 'major' | 'critical' | 'paradox';

export interface RealityRule {
  ruleId: string;
  type: RealityType;
  description: string;
  strength: RealityStrength;
  exceptions: string[];
  enforced: boolean;
  violations: number;
}

export interface RealityViolationRecord {
  violationId: string;
  ruleId: string;
  severity: RealityViolation;
  description: string;
  chapter: number;
  resolved: boolean;
}

export interface NarrativeRealityEngineState {
  rules: Map<string, RealityRule>;
  violations: Map<string, RealityViolationRecord>;
  totalRules: number;
  enforcedRules: number;
  totalViolations: number;
  criticalViolations: number;
  averageSeverity: number;
  realityConsistency: number;
  dominantType: RealityType | null;
}

// Factory
export function createNarrativeRealityEngineState(): NarrativeRealityEngineState {
  return {
    rules: new Map(),
    violations: new Map(),
    totalRules: 0,
    enforcedRules: 0,
    totalViolations: 0,
    criticalViolations: 0,
    averageSeverity: 0.3,
    realityConsistency: 0.8,
    dominantType: null,
  };
}

// Add rule
export function addRealityRule(
  state: NarrativeRealityEngineState,
  ruleId: string,
  type: RealityType,
  description: string,
  strength: RealityStrength = 'consistent',
  exceptions: string[] = [],
  enforced: boolean = true
): NarrativeRealityEngineState {
  const rule: RealityRule = { ruleId, type, description, strength, exceptions, enforced, violations: 0 };
  const rules = new Map(state.rules).set(ruleId, rule);
  const enforcedRules = enforced ? state.enforcedRules + 1 : state.enforcedRules;
  return recomputeReality({ ...state, rules, totalRules: rules.size, enforcedRules });
}

// Record violation
export function recordViolation(
  state: NarrativeRealityEngineState,
  violationId: string,
  ruleId: string,
  severity: RealityViolation,
  description: string,
  chapter: number
): NarrativeRealityEngineState {
  const record: RealityViolationRecord = { violationId, ruleId, severity, description, chapter, resolved: false };
  const violations = new Map(state.violations).set(violationId, record);

  // Increment rule violations
  const rule = state.rules.get(ruleId);
  let rules = state.rules;
  if (rule) {
    const updated: RealityRule = { ...rule, violations: rule.violations + 1 };
    rules = new Map(state.rules).set(ruleId, updated);
  }

  const criticalViolations = severity === 'critical' || severity === 'paradox' ? state.criticalViolations + 1 : state.criticalViolations;
  return recomputeReality({ ...state, rules, violations, totalViolations: violations.size, criticalViolations });
}

// Resolve violation
export function resolveViolation(state: NarrativeRealityEngineState, violationId: string): NarrativeRealityEngineState {
  const violation = state.violations.get(violationId);
  if (!violation) return state;

  const updated: RealityViolationRecord = { ...violation, resolved: true };
  const violations = new Map(state.violations).set(violationId, updated);
  return recomputeReality({ ...state, violations });
}

// Toggle rule
export function toggleRealityRule(state: NarrativeRealityEngineState, ruleId: string, enforced: boolean): NarrativeRealityEngineState {
  const rule = state.rules.get(ruleId);
  if (!rule) return state;

  const updated: RealityRule = { ...rule, enforced };
  const rules = new Map(state.rules).set(ruleId, updated);
  const enforcedRules = enforced ? state.enforcedRules + 1 : Math.max(0, state.enforcedRules - 1);
  return recomputeReality({ ...state, rules, enforcedRules });
}

// Get rules by type
export function getRealityRulesByType(state: NarrativeRealityEngineState, type: RealityType): RealityRule[] {
  return Array.from(state.rules.values()).filter(r => r.type === type);
}

// Get violations by severity
export function getViolationsBySeverity(state: NarrativeRealityEngineState, severity: RealityViolation): RealityViolationRecord[] {
  return Array.from(state.violations.values()).filter(v => v.severity === severity);
}

// Get reality report
export function getRealityReport(state: NarrativeRealityEngineState): {
  totalRules: number;
  enforcedRules: number;
  totalViolations: number;
  criticalViolations: number;
  averageSeverity: number;
  realityConsistency: number;
  dominantType: RealityType | null;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalRules === 0) recommendations.push('No rules — add reality rules');
  if (state.criticalViolations > 0) recommendations.push(`${state.criticalViolations} critical violations — fix immediately`);
  if (state.realityConsistency < 0.6) recommendations.push('Low consistency — review rules');

  return {
    totalRules: state.totalRules,
    enforcedRules: state.enforcedRules,
    totalViolations: state.totalViolations,
    criticalViolations: state.criticalViolations,
    averageSeverity: Math.round(state.averageSeverity * 100) / 100,
    realityConsistency: Math.round(state.realityConsistency * 100) / 100,
    dominantType: state.dominantType,
    recommendations,
  };
}

// Recompute metrics
function recomputeReality(state: NarrativeRealityEngineState): NarrativeRealityEngineState {
  const violations = Array.from(state.violations.values());
  const severityMap: Record<RealityViolation, number> = { minor: 0.2, moderate: 0.4, major: 0.6, critical: 0.8, paradox: 1.0 };
  const averageSeverity = violations.length === 0 ? 0.3
    : violations.reduce((s, v) => s + severityMap[v.severity], 0) / violations.length;

  const totalRules = state.totalRules;
  const consistencyScore = totalRules === 0 ? 0.8
    : Math.max(0, 1 - violations.length / (totalRules * 5));
  const realityConsistency = consistencyScore;

  let dominantType: RealityType | null = null;
  let maxCount = -1;
  const typeCounts = new Map<RealityType, number>();
  Array.from(state.rules.values()).forEach(r => typeCounts.set(r.type, (typeCounts.get(r.type) || 0) + 1));
  typeCounts.forEach((count, t) => { if (count > maxCount) { maxCount = count; dominantType = t; } });

  return { ...state, averageSeverity, realityConsistency, dominantType };
}

// Reset reality state
export function resetNarrativeRealityEngineState(): NarrativeRealityEngineState {
  return createNarrativeRealityEngineState();
}