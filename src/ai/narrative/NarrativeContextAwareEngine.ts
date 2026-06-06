/**
 * V980 NarrativeContextAwareEngine — Direction A Iter 8/15 (Round 5)
 * Context-aware engine: context awareness + situational understanding
 * Sources: nanobot context + thunderbolt + chatdev
 */

export type ContextLayer = 'immediate' | 'local' | 'global' | 'cultural' | 'historical' | 'universal';
export type ContextClarity = 'blurry' | 'partial' | 'clear' | 'precise' | 'perfect';
export type ContextRelevance = 'irrelevant' | 'tangential' | 'related' | 'relevant' | 'essential';

export interface ContextElement {
  elementId: string;
  layer: ContextLayer;
  clarity: ContextClarity;
  relevance: ContextRelevance;
  content: string;
  importance: number;
  freshness: number;
  chapter: number;
}

export interface ContextFrame {
  frameId: string,
  name: string,
  elementIds: string[],
  completeness: number,
  consistency: number,
}

export interface NarrativeContextAwareEngineState {
  elements: Map<string, ContextElement>;
  frames: Map<string, ContextFrame>;
  totalElements: number;
  totalFrames: number;
  averageImportance: number;
  layerCoverage: number;
  contextClarity: number;
  contextAwarenessMastery: number;
}

// Factory
export function createNarrativeContextAwareEngineState(): NarrativeContextAwareEngineState {
  return {
    elements: new Map(),
    frames: new Map(),
    totalElements: 0,
    totalFrames: 0,
    averageImportance: 0.5,
    layerCoverage: 0,
    contextClarity: 0.5,
    contextAwarenessMastery: 0.5,
  };
}

// Add element
export function addContextElement(
  state: NarrativeContextAwareEngineState,
  elementId: string,
  layer: ContextLayer,
  clarity: ContextClarity,
  relevance: ContextRelevance,
  content: string,
  importance: number,
  freshness: number,
  chapter: number
): NarrativeContextAwareEngineState {
  const element: ContextElement = { elementId, layer, clarity, relevance, content, importance, freshness, chapter };
  const elements = new Map(state.elements).set(elementId, element);
  return recomputeContextAware({ ...state, elements, totalElements: elements.size });
}

// Create frame
export function createContextFrame(
  state: NarrativeContextAwareEngineState,
  frameId: string,
  name: string,
  elementIds: string[]
): NarrativeContextAwareEngineState {
  const elements = elementIds.map(id => state.elements.get(id)).filter((e): e is ContextElement => e !== undefined);
  const layers = new Set(elements.map(e => e.layer));
  const completeness = layers.size / 6;
  const consistency = elements.length === 0 ? 0
    : 1 - (Math.max(...elements.map(e => e.importance)) - Math.min(...elements.map(e => e.importance)));
  const frame: ContextFrame = { frameId, name, elementIds, completeness, consistency };
  const frames = new Map(state.frames).set(frameId, frame);
  return recomputeContextAware({ ...state, frames, totalFrames: frames.size });
}

// Get elements by layer
export function getElementsByLayer(state: NarrativeContextAwareEngineState, layer: ContextLayer): ContextElement[] {
  return Array.from(state.elements.values()).filter(e => e.layer === layer);
}

// Get context report
export function getContextAwareReport(state: NarrativeContextAwareEngineState): {
  totalElements: number;
  totalFrames: number;
  averageImportance: number;
  contextClarity: number;
  contextAwarenessMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalElements === 0) recommendations.push('No elements — add context elements');
  if (state.layerCoverage < 0.3) recommendations.push('Low coverage — diversify');
  if (state.contextAwarenessMastery < 0.5) recommendations.push('Low mastery — improve');

  return {
    totalElements: state.totalElements,
    totalFrames: state.totalFrames,
    averageImportance: Math.round(state.averageImportance * 100) / 100,
    contextClarity: Math.round(state.contextClarity * 100) / 100,
    contextAwarenessMastery: Math.round(state.contextAwarenessMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeContextAware(state: NarrativeContextAwareEngineState): NarrativeContextAwareEngineState {
  const elements = Array.from(state.elements.values());
  const averageImportance = elements.length === 0 ? 0.5
    : elements.reduce((s, e) => s + e.importance, 0) / elements.length;
  const layerSet = new Set(elements.map(e => e.layer));
  const layerCoverage = Math.min(1, layerSet.size / 5);

  const clarityMap: Record<ContextClarity, number> = { blurry: 0.2, partial: 0.4, clear: 0.6, precise: 0.8, perfect: 1.0 };
  const contextClarity = elements.length === 0 ? 0.5
    : elements.reduce((s, e) => s + clarityMap[e.clarity], 0) / elements.length;

  const frames = Array.from(state.frames.values());
  const frameCompleteness = frames.length === 0 ? 0.5
    : frames.reduce((s, f) => s + f.completeness, 0) / frames.length;

  const contextAwarenessMastery = (averageImportance * 0.3 + contextClarity * 0.4 + frameCompleteness * 0.3);

  return { ...state, averageImportance, layerCoverage, contextClarity, contextAwarenessMastery };
}

// Reset
export function resetNarrativeContextAwareEngineState(): NarrativeContextAwareEngineState {
  return createNarrativeContextAwareEngineState();
}