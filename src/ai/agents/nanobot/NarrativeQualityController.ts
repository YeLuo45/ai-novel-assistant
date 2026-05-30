/**
 * NarrativeQualityController - V162
 * Narrative Quality Closed-Loop Controller
 * 
 * The central orchestrator that integrates all nanobot subsystems and enforces quality gates.
 * Design references:
 * - thunderbolt: pipeline feedback loops for continuous quality monitoring
 * - ruflo: hierarchical decomposition (quality gate → subsystem → component)
 * - chatdev: multi-agent coordination for consistent quality enforcement
 * - nanobot: distributed mesh for autonomous quality improvement
 */

export type QualityGate = 'alpha' | 'beta' | 'gamma' | 'release'
export type QualityDimension = 'coherence' | 'engagement' | 'clarity' | 'consistency' | 'emotional_impact' | 'pacing'
export type ControllerState = 'monitoring' | 'optimizing' | 'escalating' | 'stable'

export interface QualityScore {
  dimension: QualityDimension
  score: number  // 0-100
  delta: number  // change from previous
  threshold: number
  status: 'pass' | 'warning' | 'fail'
}

export interface QualityGateResult {
  gate: QualityGate
  passed: boolean
  scores: QualityScore[]
  overallScore: number
  blockingIssues: string[]
  recommendations: string[]
  timestamp: number
}

export interface ControllerConfig {
  alphaThreshold: number  // minimum overall score to pass alpha
  betaThreshold: number
  gammaThreshold: number
  releaseThreshold: number
  autoOptimize: boolean
  escalationEnabled: boolean
}

export interface ControllerStateObj {
  controllerId: string
  currentGate: QualityGate
  state: ControllerState
  config: ControllerConfig
  qualityHistory: QualityGateResult[]
  subsystemScores: Map<string, number>
  activeOptimizations: string[]
  lastAssessment: number
  escalationLevel: number
}

// Default configuration
export const DEFAULT_CONFIG: ControllerConfig = {
  alphaThreshold: 50,
  betaThreshold: 65,
  gammaThreshold: 80,
  releaseThreshold: 90,
  autoOptimize: true,
  escalationEnabled: true,
}

// Dimension weights for overall score
const DIMENSION_WEIGHTS: Record<QualityDimension, number> = {
  coherence: 0.25,
  engagement: 0.20,
  clarity: 0.15,
  consistency: 0.20,
  emotional_impact: 0.10,
  pacing: 0.10,
}

const GATE_ORDER: QualityGate[] = ['alpha', 'beta', 'gamma', 'release']

// State Management
export function createController(config: Partial<ControllerConfig> = {}): ControllerStateObj {
  return {
    controllerId: 'qc_' + Date.now(),
    currentGate: 'alpha',
    state: 'monitoring',
    config: { ...DEFAULT_CONFIG, ...config },
    qualityHistory: [],
    subsystemScores: new Map(),
    activeOptimizations: [],
    lastAssessment: Date.now(),
    escalationLevel: 0,
  };
}

// Quality Assessment
export function assessQuality(dimensionScores: Record<QualityDimension, number>, config: ControllerConfig): QualityScore[] {
  const results: QualityScore[] = [];
  const thresholds: Record<QualityGate, Record<QualityDimension, number>> = {
    alpha: { coherence: 40, engagement: 35, clarity: 40, consistency: 40, emotional_impact: 30, pacing: 35 },
    beta: { coherence: 55, engagement: 50, clarity: 55, consistency: 55, emotional_impact: 45, pacing: 50 },
    gamma: { coherence: 70, engagement: 65, clarity: 70, consistency: 70, emotional_impact: 60, pacing: 65 },
    release: { coherence: 85, engagement: 80, clarity: 85, consistency: 85, emotional_impact: 75, pacing: 80 },
  };
  
  for (const [dim, score] of Object.entries(dimensionScores) as [QualityDimension, number][]) {
    const threshold = thresholds.beta[dim];  // Default to beta for general assessment
    let status: 'pass' | 'warning' | 'fail' = 'pass';
    if (score < threshold * 0.8) status = 'fail';
    else if (score < threshold) status = 'warning';
    
    results.push({ dimension: dim, score, delta: 0, threshold, status });
  }
  return results;
}

export function calculateOverallScore(scores: QualityScore[]): number {
  let total = 0;
  for (const s of scores) {
    total += s.score * (DIMENSION_WEIGHTS[s.dimension] || 0.1);
  }
  return Math.round(total);
}

// Gate Evaluation
export function evaluateGate(controller: ControllerStateObj, dimensionScores: Record<QualityDimension, number>): QualityGateResult {
  const scores = assessQuality(dimensionScores, controller.config);
  const overallScore = calculateOverallScore(scores);
  
  const threshold = controller.config[controller.currentGate + 'Threshold' as keyof ControllerConfig] as number;
  const passed = overallScore >= threshold;
  
  const blockingIssues = scores.filter(s => s.status === 'fail').map(s => s.dimension + ' below threshold');
  
  const recommendations: string[] = [];
  for (const s of scores.filter(s => s.status !== 'pass')) {
    recommendations.push('Improve ' + s.dimension + ' (current: ' + s.score + ', target: ' + s.threshold + ')');
  }
  
  const result: QualityGateResult = {
    gate: controller.currentGate,
    passed,
    scores,
    overallScore,
    blockingIssues,
    recommendations,
    timestamp: Date.now(),
  };
  
  // Update history
  const newHistory = [...controller.qualityHistory.slice(-19), result];
  return result;
}

// State Transitions
export function updateControllerState(controller: ControllerStateObj, result: QualityGateResult): ControllerStateObj {
  let newGate = controller.currentGate;
  let newState: ControllerState = 'monitoring';
  let newEscalation = controller.escalationLevel;
  
  if (!result.passed) {
    newState = 'escalating';
    newEscalation = Math.min(10, controller.escalationLevel + 1);
  } else if (result.overallScore > 85 && controller.state !== 'stable') {
    newState = 'stable';
    newEscalation = Math.max(0, controller.escalationLevel - 1);
  } else if (result.recommendations.length > 2) {
    newState = 'optimizing';
  } else {
    newState = 'monitoring';
  }
  
  // Auto-advance gate if consistently passing
  if (result.passed && result.overallScore > controller.config[controller.currentGate + 'Threshold' as keyof ControllerConfig] + 10) {
    const currentIdx = GATE_ORDER.indexOf(controller.currentGate);
    if (currentIdx < GATE_ORDER.length - 1) {
      newGate = GATE_ORDER[currentIdx + 1];
    }
  }
  
  return {
    ...controller,
    currentGate: newGate,
    state: newState,
    qualityHistory: [...controller.qualityHistory.slice(-19), result],
    lastAssessment: Date.now(),
    escalationLevel: newEscalation,
  };
}

// Subsystem Integration
export function registerSubsystemScore(controller: ControllerStateObj, subsystem: string, score: number): ControllerStateObj {
  const newScores = new Map(controller.subsystemScores);
  newScores.set(subsystem, score);
  return { ...controller, subsystemScores: newScores };
}

// Optimization Tracking
export function addOptimization(controller: ControllerStateObj, optimization: string): ControllerStateObj {
  if (controller.activeOptimizations.includes(optimization)) return controller;
  return { ...controller, activeOptimizations: [...controller.activeOptimizations, optimization] };
}

export function completeOptimization(controller: ControllerStateObj, optimization: string): ControllerStateObj {
  return { ...controller, activeOptimizations: controller.activeOptimizations.filter(o => o !== optimization) };
}

// Formatters
export function formatGateResult(result: QualityGateResult): string {
  let s = '=== ' + result.gate.toUpperCase() + ' Gate Assessment ===\n';
  s += 'Overall Score: ' + result.overallScore + '%\n';
  s += 'Status: ' + (result.passed ? 'PASSED' : 'FAILED') + '\n';
  
  s += '\n--- Dimension Scores ---\n';
  for (const sc of result.scores) {
    const icon = sc.status === 'pass' ? '✓' : sc.status === 'warning' ? '⚠' : '✗';
    s += icon + ' ' + sc.dimension + ': ' + sc.score + ' (threshold: ' + sc.threshold + ')\n';
  }
  
  if (result.blockingIssues.length) {
    s += '\n--- Blocking Issues ---\n';
    for (const i of result.blockingIssues) s += '✗ ' + i + '\n';
  }
  
  if (result.recommendations.length) {
    s += '\n--- Recommendations ---\n';
    for (const r of result.recommendations) s += '→ ' + r + '\n';
  }
  
  return s;
}

export function formatControllerDashboard(controller: ControllerStateObj): string {
  let s = '=== Narrative Quality Controller Dashboard ===\n';
  s += 'Controller: ' + controller.controllerId + '\n';
  s += 'Current Gate: ' + controller.currentGate.toUpperCase() + '\n';
  s += 'State: ' + controller.state + '\n';
  s += 'Escalation Level: ' + controller.escalationLevel + '/10\n';
  s += 'Assessments: ' + controller.qualityHistory.length + '\n';
  
  if (controller.subsystemScores.size > 0) {
    s += '\n--- Subsystem Scores ---\n';
    for (const [sub, score] of controller.subsystemScores) {
      s += '  ' + sub + ': ' + score + '\n';
    }
  }
  
  if (controller.activeOptimizations.length > 0) {
    s += '\n--- Active Optimizations ---\n';
    for (const o of controller.activeOptimizations) s += '  → ' + o + '\n';
  }
  
  if (controller.qualityHistory.length > 0) {
    const latest = controller.qualityHistory[controller.qualityHistory.length - 1];
    s += '\n--- Latest Assessment ---\n';
    s += '  Score: ' + latest.overallScore + '% (' + latest.gate + ')\n';
    s += '  Status: ' + (latest.passed ? 'PASSED' : 'FAILED') + '\n';
  }
  
  return s;
}
