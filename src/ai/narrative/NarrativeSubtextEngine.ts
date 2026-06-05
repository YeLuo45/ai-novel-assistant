/**
 * V846 NarrativeSubtextEngine — Direction B Iter 1/15 (Round 4)
 * Narrative subtext engine: subtext + undercurrent + hidden meaning
 * Sources: chatdev subtext + nanobot + thunderbolt
 */

export type SubtextType = 'emotional' | 'thematic' | 'symbolic' | 'social' | 'psychological' | 'narrative';
export type SubtextLayer = 'surface' | 'immediate' | 'personal' | 'cultural' | 'archetypal' | 'universal';
export type SubtextStrength = 'whisper' | 'hint' | 'suggest' | 'imply' | 'declare';

export interface SubtextElement {
  elementId: string;
  type: SubtextType;
  layer: SubtextLayer;
  strength: SubtextStrength;
  surfaceText: string;
  subtext: string;
  readerImpact: number;
  discovered: boolean;
}

export interface SubtextPattern {
  patternId: string;
  name: string;
  occurrences: number;
  effectiveness: number;
  elementIds: string[];
}

export interface NarrativeSubtextEngineState {
  elements: Map<string, SubtextElement>;
  patterns: Map<string, SubtextPattern>;
  totalElements: number;
  totalPatterns: number;
  discoveredElements: number;
  averageImpact: number;
  layerDepth: number;
  patternComplexity: number;
  subtextRichness: number;
}

// Factory
export function createNarrativeSubtextEngineState(): NarrativeSubtextEngineState {
  return {
    elements: new Map(),
    patterns: new Map(),
    totalElements: 0,
    totalPatterns: 0,
    discoveredElements: 0,
    averageImpact: 0.5,
    layerDepth: 0,
    patternComplexity: 0.5,
    subtextRichness: 0.5,
  };
}

// Add subtext
export function addSubtext(
  state: NarrativeSubtextEngineState,
  elementId: string,
  type: SubtextType,
  layer: SubtextLayer,
  surfaceText: string,
  subtext: string,
  strength: SubtextStrength = 'suggest',
  readerImpact: number = 0.5
): NarrativeSubtextEngineState {
  const element: SubtextElement = {
    elementId, type, layer, strength, surfaceText, subtext,
    readerImpact: Math.min(1, Math.max(0, readerImpact)),
    discovered: false,
  };
  const elements = new Map(state.elements).set(elementId, element);
  return recomputeSubtext({ ...state, elements, totalElements: elements.size });
}

// Discover subtext
export function discoverSubtext(state: NarrativeSubtextEngineState, elementId: string): NarrativeSubtextEngineState {
  const element = state.elements.get(elementId);
  if (!element) return state;

  const updated: SubtextElement = { ...element, discovered: true };
  const elements = new Map(state.elements).set(elementId, updated);
  const discoveredElements = element.discovered ? state.discoveredElements : state.discoveredElements + 1;
  return recomputeSubtext({ ...state, elements, discoveredElements });
}

// Add pattern
export function addSubtextPattern(
  state: NarrativeSubtextEngineState,
  patternId: string,
  name: string,
  elementIds: string[],
  effectiveness: number = 0.5
): NarrativeSubtextEngineState {
  const pattern: SubtextPattern = {
    patternId, name, elementIds, effectiveness: Math.min(1, Math.max(0, effectiveness)),
    occurrences: elementIds.length,
  };
  const patterns = new Map(state.patterns).set(patternId, pattern);
  return recomputeSubtext({ ...state, patterns, totalPatterns: patterns.size });
}

// Get subtexts by type
export function getSubtextsByType(state: NarrativeSubtextEngineState, type: SubtextType): SubtextElement[] {
  return Array.from(state.elements.values()).filter(e => e.type === type);
}

// Get subtext report
export function getSubtextReport(state: NarrativeSubtextEngineState): {
  totalElements: number;
  totalPatterns: number;
  discoveredElements: number;
  averageImpact: number;
  layerDepth: number;
  subtextRichness: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalElements === 0) recommendations.push('No subtexts — add subtext elements');
  if (state.layerDepth < 0.3) recommendations.push('Low layer depth — go deeper');
  if (state.subtextRichness < 0.5) recommendations.push('Low richness — add more subtext');

  return {
    totalElements: state.totalElements,
    totalPatterns: state.totalPatterns,
    discoveredElements: state.discoveredElements,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    layerDepth: Math.round(state.layerDepth * 100) / 100,
    subtextRichness: Math.round(state.subtextRichness * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSubtext(state: NarrativeSubtextEngineState): NarrativeSubtextEngineState {
  const elements = Array.from(state.elements.values());
  const averageImpact = elements.length === 0 ? 0.5
    : elements.reduce((s, e) => s + e.readerImpact, 0) / elements.length;

  const layerMap: Record<SubtextLayer, number> = { surface: 0.1, immediate: 0.3, personal: 0.5, cultural: 0.7, archetypal: 0.9, universal: 1.0 };
  const totalLayers = elements.reduce((s, e) => s + layerMap[e.layer], 0);
  const layerDepth = elements.length === 0 ? 0 : totalLayers / elements.length;

  const patterns = Array.from(state.patterns.values());
  const patternComplexity = patterns.length === 0 ? 0.5
    : patterns.reduce((s, p) => s + p.effectiveness, 0) / patterns.length;

  const subtextRichness = (averageImpact * 0.4 + layerDepth * 0.3 + patternComplexity * 0.3);

  return { ...state, averageImpact, layerDepth, patternComplexity, subtextRichness };
}

// Reset subtext state
export function resetNarrativeSubtextEngineState(): NarrativeSubtextEngineState {
  return createNarrativeSubtextEngineState();
}