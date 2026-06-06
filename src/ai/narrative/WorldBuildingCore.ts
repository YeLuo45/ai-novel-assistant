/**
 * V862 WorldBuildingCore — Direction B Iter 9/15 (Round 4)
 * World building core: world development + world consistency
 * Sources: nanobot world + thunderbolt + ruflo
 */

export type WorldAspect = 'geography' | 'history' | 'culture' | 'politics' | 'religion' | 'technology';
export type DevelopmentStage = 'conceptual' | 'sketched' | 'developed' | 'detailed' | 'immersive';
export type WorldConsistencyLevel = 'inconsistent' | 'rough' | 'consistent' | 'rigorous' | 'encyclopedic';

export interface WorldElement {
  elementId: string;
  aspect: WorldAspect;
  name: string;
  description: string;
  stage: DevelopmentStage;
  detail: number;
  connections: string[];
  chapters: number[];
}

export interface WorldRule {
  ruleId: string;
  name: string;
  description: string;
  exceptions: string[];
  strength: number;
  enforced: boolean;
}

export interface WorldBuildingCoreState {
  elements: Map<string, WorldElement>;
  rules: Map<string, WorldRule>;
  totalElements: number;
  totalRules: number;
  averageDetail: number;
  aspectCoverage: number;
  worldRichness: number;
  ruleConsistency: number;
  overallDevelopment: number;
}

// Factory
export function createWorldBuildingCoreState(): WorldBuildingCoreState {
  return {
    elements: new Map(),
    rules: new Map(),
    totalElements: 0,
    totalRules: 0,
    averageDetail: 0.5,
    aspectCoverage: 0,
    worldRichness: 0.5,
    ruleConsistency: 0.5,
    overallDevelopment: 0.5,
  };
}

// Add element
export function addWorldElement(
  state: WorldBuildingCoreState,
  elementId: string,
  aspect: WorldAspect,
  name: string,
  description: string,
  detail: number = 0.5
): WorldBuildingCoreState {
  const element: WorldElement = {
    elementId, aspect, name, description,
    stage: 'sketched', detail: Math.min(1, Math.max(0, detail)),
    connections: [], chapters: [],
  };
  const elements = new Map(state.elements).set(elementId, element);
  return recomputeWorld({ ...state, elements, totalElements: elements.size });
}

// Advance element
export function advanceElementStage(state: WorldBuildingCoreState, elementId: string, stage: DevelopmentStage): WorldBuildingCoreState {
  const element = state.elements.get(elementId);
  if (!element) return state;

  const updated: WorldElement = { ...element, stage };
  const elements = new Map(state.elements).set(elementId, updated);
  return recomputeWorld({ ...state, elements });
}

// Add rule
export function addWorldRule(
  state: WorldBuildingCoreState,
  ruleId: string,
  name: string,
  description: string,
  strength: number = 0.5
): WorldBuildingCoreState {
  const rule: WorldRule = { ruleId, name, description, exceptions: [], strength, enforced: true };
  const rules = new Map(state.rules).set(ruleId, rule);
  return recomputeWorld({ ...state, rules, totalRules: rules.size });
}

// Add exception
export function addRuleException(state: WorldBuildingCoreState, ruleId: string, exception: string): WorldBuildingCoreState {
  const rule = state.rules.get(ruleId);
  if (!rule) return state;

  const updated: WorldRule = { ...rule, exceptions: [...rule.exceptions, exception] };
  const rules = new Map(state.rules).set(ruleId, updated);
  return recomputeWorld({ ...state, rules });
}

// Get elements by aspect
export function getElementsByAspect(state: WorldBuildingCoreState, aspect: WorldAspect): WorldElement[] {
  return Array.from(state.elements.values()).filter(e => e.aspect === aspect);
}

// Get world building report
export function getWorldBuildingReport(state: WorldBuildingCoreState): {
  totalElements: number;
  totalRules: number;
  averageDetail: number;
  aspectCoverage: number;
  worldRichness: number;
  overallDevelopment: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalElements === 0) recommendations.push('No elements — add world elements');
  if (state.averageDetail < 0.5) recommendations.push('Low detail — develop more');
  if (state.aspectCoverage < 0.3) recommendations.push('Low coverage — diversify aspects');

  return {
    totalElements: state.totalElements,
    totalRules: state.totalRules,
    averageDetail: Math.round(state.averageDetail * 100) / 100,
    aspectCoverage: Math.round(state.aspectCoverage * 100) / 100,
    worldRichness: Math.round(state.worldRichness * 100) / 100,
    overallDevelopment: Math.round(state.overallDevelopment * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorld(state: WorldBuildingCoreState): WorldBuildingCoreState {
  const elements = Array.from(state.elements.values());
  const averageDetail = elements.length === 0 ? 0.5
    : elements.reduce((s, e) => s + e.detail, 0) / elements.length;
  const aspectSet = new Set(elements.map(e => e.aspect));
  const aspectCoverage = Math.min(1, aspectSet.size / 5);

  const rules = Array.from(state.rules.values());
  const ruleConsistency = rules.length === 0 ? 0.5
    : rules.reduce((s, r) => s + r.strength, 0) / rules.length;

  const worldRichness = (averageDetail * 0.5 + aspectCoverage * 0.3 + ruleConsistency * 0.2);
  const overallDevelopment = worldRichness;

  return { ...state, averageDetail, aspectCoverage, ruleConsistency, worldRichness, overallDevelopment };
}

// Reset world building state
export function resetWorldBuildingCoreState(): WorldBuildingCoreState {
  return createWorldBuildingCoreState();
}