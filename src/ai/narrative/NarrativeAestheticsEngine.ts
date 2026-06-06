/**
 * V1048 NarrativeAestheticsEngine — Direction C Iter 12/20 (Round 5)
 * Narrative aesthetics engine: beauty + form of narrative
 * Sources: nanobot aesthetics + thunderbolt + ruflo
 */

export type AestheticPrinciple = 'unity' | 'variety' | 'harmony' | 'contrast' | 'balance' | 'transcendence';
export type AestheticForm = 'classical' | 'romantic' | 'modernist' | 'postmodern' | 'minimalist' | 'maximalist';
export type AestheticImpact = 'pleasant' | 'moving' | 'cathartic' | 'sublime' | 'transcendent';

export interface AestheticElement {
  elementId: string;
  principle: AestheticPrinciple;
  form: AestheticForm;
  impact: AestheticImpact;
  description: string;
  beauty: number;
  form: number;
  chapter: number;
}

export interface AestheticComposition {
  compositionId: string,
  name: string,
  elementIds: string[],
  coherence: number,
  beauty: number,
}

export interface NarrativeAestheticsEngineState {
  elements: Map<string, AestheticElement>;
  compositions: Map<string, AestheticComposition>;
  totalElements: number;
  totalCompositions: number;
  averageBeauty: number;
  averageForm: number;
  compositionCoherence: number;
  aestheticsMastery: number;
}

// Factory
export function createNarrativeAestheticsEngineState(): NarrativeAestheticsEngineState {
  return {
    elements: new Map(),
    compositions: new Map(),
    totalElements: 0,
    totalCompositions: 0,
    averageBeauty: 0.5,
    averageForm: 0.5,
    compositionCoherence: 0.5,
    aestheticsMastery: 0.5,
  };
}

// Add element
export function addAestheticElement(
  state: NarrativeAestheticsEngineState,
  elementId: string,
  principle: AestheticPrinciple,
  form: AestheticForm,
  impact: AestheticImpact,
  description: string,
  beauty: number,
  formScore: number,
  chapter: number
): NarrativeAestheticsEngineState {
  const element: AestheticElement = { elementId, principle, form, impact, description, beauty, form: formScore, chapter };
  const elements = new Map(state.elements).set(elementId, element);
  return recomputeAesthetics({ ...state, elements, totalElements: elements.size });
}

// Add composition
export function addAestheticComposition(
  state: NarrativeAestheticsEngineState,
  compositionId: string,
  name: string,
  elementIds: string[]
): NarrativeAestheticsEngineState {
  const elements = elementIds.map(id => state.elements.get(id)).filter((e): e is AestheticElement => e !== undefined);
  const beauty = elements.length === 0 ? 0
    : elements.reduce((s, e) => s + e.beauty, 0) / elements.length;
  const principleSet = new Set(elements.map(e => e.principle));
  const coherence = Math.min(1, principleSet.size / 6);
  const composition: AestheticComposition = { compositionId, name, elementIds, coherence, beauty };
  const compositions = new Map(state.compositions).set(compositionId, composition);
  return recomputeAesthetics({ ...state, compositions, totalCompositions: compositions.size });
}

// Get elements by principle
export function getElementsByPrinciple(state: NarrativeAestheticsEngineState, principle: AestheticPrinciple): AestheticElement[] {
  return Array.from(state.elements.values()).filter(e => e.principle === principle);
}

// Get aesthetics report
export function getAestheticsReport(state: NarrativeAestheticsEngineState): {
  totalElements: number;
  totalCompositions: number;
  averageBeauty: number;
  averageForm: number;
  aestheticsMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalElements === 0) recommendations.push('No elements — add aesthetic elements');
  if (state.averageBeauty < 0.5) recommendations.push('Low beauty — strengthen');
  if (state.aestheticsMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalElements: state.totalElements,
    totalCompositions: state.totalCompositions,
    averageBeauty: Math.round(state.averageBeauty * 100) / 100,
    averageForm: Math.round(state.averageForm * 100) / 100,
    aestheticsMastery: Math.round(state.aestheticsMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAesthetics(state: NarrativeAestheticsEngineState): NarrativeAestheticsEngineState {
  const elements = Array.from(state.elements.values());
  const averageBeauty = elements.length === 0 ? 0.5
    : elements.reduce((s, e) => s + e.beauty, 0) / elements.length;
  const averageForm = elements.length === 0 ? 0.5
    : elements.reduce((s, e) => s + e.form, 0) / elements.length;

  const compositions = Array.from(state.compositions.values());
  const compositionCoherence = compositions.length === 0 ? 0.5
    : compositions.reduce((s, c) => s + c.coherence, 0) / compositions.length;

  const aestheticsMastery = (averageBeauty * 0.4 + averageForm * 0.3 + compositionCoherence * 0.3);

  return { ...state, averageBeauty, averageForm, compositionCoherence, aestheticsMastery };
}

// Reset
export function resetNarrativeAestheticsEngineState(): NarrativeAestheticsEngineState {
  return createNarrativeAestheticsEngineState();
}