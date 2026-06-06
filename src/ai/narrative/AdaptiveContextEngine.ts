/**
 * V918 AdaptiveContextEngine — Direction D Iter 7/15 (Round 4)
 * Adaptive context engine: context adaptation + situational awareness
 * Sources: nanobot context + thunderbolt + generic-agent
 */

export type ContextAspect = 'cultural' | 'social' | 'historical' | 'personal' | 'situational' | 'narrative';
export type ContextRelevance = 'irrelevant' | 'peripheral' | 'relevant' | 'central' | 'critical';
export type AdaptationMode = 'ignore' | 'acknowledge' | 'embrace' | 'transform' | 'leverage';

export interface ContextElement {
  elementId: string;
  aspect: ContextAspect;
  description: string;
  relevance: ContextRelevance;
  adaptability: number;
  chapter: number;
}

export interface ContextAdaptation {
  adaptationId: string;
  elementId: string;
  mode: AdaptationMode;
  effectiveness: number;
  description: string;
  chapter: number;
}

export interface AdaptiveContextEngineState {
  elements: Map<string, ContextElement>;
  adaptations: Map<string, ContextAdaptation>;
  totalElements: number;
  totalAdaptations: number;
  averageAdaptability: number;
  contextCoverage: number;
  contextSensitivity: number;
  contextMastery: number;
}

// Factory
export function createAdaptiveContextEngineState(): AdaptiveContextEngineState {
  return {
    elements: new Map(),
    adaptations: new Map(),
    totalElements: 0,
    totalAdaptations: 0,
    averageAdaptability: 0.5,
    contextCoverage: 0,
    contextSensitivity: 0.5,
    contextMastery: 0.5,
  };
}

// Add context element
export function addContextElement(
  state: AdaptiveContextEngineState,
  elementId: string,
  aspect: ContextAspect,
  description: string,
  relevance: ContextRelevance = 'relevant',
  chapter: number = 1,
  adaptability: number = 0.5
): AdaptiveContextEngineState {
  const element: ContextElement = { elementId, aspect, description, relevance, adaptability, chapter };
  const elements = new Map(state.elements).set(elementId, element);
  return recomputeAdaptContext({ ...state, elements, totalElements: elements.size });
}

// Add adaptation
export function addContextAdaptation(
  state: AdaptiveContextEngineState,
  adaptationId: string,
  elementId: string,
  mode: AdaptationMode,
  effectiveness: number,
  description: string,
  chapter: number
): AdaptiveContextEngineState {
  const adaptation: ContextAdaptation = { adaptationId, elementId, mode, effectiveness, description, chapter };
  const adaptations = new Map(state.adaptations).set(adaptationId, adaptation);
  return recomputeAdaptContext({ ...state, adaptations, totalAdaptations: adaptations.size });
}

// Get elements by aspect
export function getElementsByAspect(state: AdaptiveContextEngineState, aspect: ContextAspect): ContextElement[] {
  return Array.from(state.elements.values()).filter(e => e.aspect === aspect);
}

// Get context report
export function getContextReport(state: AdaptiveContextEngineState): {
  totalElements: number;
  totalAdaptations: number;
  averageAdaptability: number;
  contextCoverage: number;
  contextSensitivity: number;
  contextMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalElements === 0) recommendations.push('No elements — add context elements');
  if (state.contextCoverage < 0.3) recommendations.push('Low coverage — diversify');
  if (state.contextSensitivity < 0.4) recommendations.push('Low sensitivity — improve');

  return {
    totalElements: state.totalElements,
    totalAdaptations: state.totalAdaptations,
    averageAdaptability: Math.round(state.averageAdaptability * 100) / 100,
    contextCoverage: Math.round(state.contextCoverage * 100) / 100,
    contextSensitivity: Math.round(state.contextSensitivity * 100) / 100,
    contextMastery: Math.round(state.contextMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAdaptContext(state: AdaptiveContextEngineState): AdaptiveContextEngineState {
  const elements = Array.from(state.elements.values());
  const averageAdaptability = elements.length === 0 ? 0.5
    : elements.reduce((s, e) => s + e.adaptability, 0) / elements.length;
  const aspectSet = new Set(elements.map(e => e.aspect));
  const contextCoverage = Math.min(1, aspectSet.size / 5);

  const adaptations = Array.from(state.adaptations.values());
  const avgEffectiveness = adaptations.length === 0 ? 0.5
    : adaptations.reduce((s, a) => s + a.effectiveness, 0) / adaptations.length;

  // Sensitivity: adaptations per element
  const contextSensitivity = elements.length === 0 ? 0.5
    : Math.min(1, adaptations.length / elements.length);

  const contextMastery = (averageAdaptability * 0.4 + contextCoverage * 0.3 + avgEffectiveness * 0.3);

  return { ...state, averageAdaptability, contextCoverage, contextSensitivity, contextMastery };
}

// Reset context state
export function resetAdaptiveContextEngineState(): AdaptiveContextEngineState {
  return createAdaptiveContextEngineState();
}