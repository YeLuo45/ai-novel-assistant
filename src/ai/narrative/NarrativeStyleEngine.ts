/**
 * V864 NarrativeStyleEngine — Direction B Iter 10/15 (Round 4)
 * Narrative style engine: writing style + literary techniques
 * Sources: thunderbolt style + chatdev + nanobot
 */

export type StyleElement = 'syntax' | 'vocabulary' | 'imagery' | 'metaphor' | 'rhythm' | 'allusion';
export type StyleComplexity = 'simple' | 'moderate' | 'complex' | 'layered' | 'rich';
export type StyleMode = 'lyrical' | 'sparse' | 'dense' | 'conversational' | 'formal' | 'experimental';

export interface StyleSample {
  sampleId: string;
  text: string;
  elementScores: Map<StyleElement, number>;
  mode: StyleMode;
  complexity: StyleComplexity;
  overallScore: number;
}

export interface StyleTechnique {
  techniqueId: string;
  name: string;
  description: string;
  elements: StyleElement[];
  effectiveness: number;
  usages: number;
}

export interface NarrativeStyleEngineState {
  samples: Map<string, StyleSample>;
  techniques: Map<string, StyleTechnique>;
  totalSamples: number;
  totalTechniques: number;
  averageComplexity: number;
  averageScore: number;
  elementCoverage: number;
  styleConsistency: number;
  styleMastery: number;
}

// Factory
export function createNarrativeStyleEngineState(): NarrativeStyleEngineState {
  return {
    samples: new Map(),
    techniques: new Map(),
    totalSamples: 0,
    totalTechniques: 0,
    averageComplexity: 0.5,
    averageScore: 0.5,
    elementCoverage: 0,
    styleConsistency: 0.5,
    styleMastery: 0.5,
  };
}

// Add sample
export function addStyleSample(
  state: NarrativeStyleEngineState,
  sampleId: string,
  text: string,
  elementScores: Map<StyleElement, number>,
  mode: StyleMode = 'sparse',
  complexity: StyleComplexity = 'moderate'
): NarrativeStyleEngineState {
  const allScores = Array.from(elementScores.values());
  const overallScore = allScores.length === 0 ? 0.5
    : allScores.reduce((s, v) => s + v, 0) / allScores.length;
  const sample: StyleSample = { sampleId, text, elementScores, mode, complexity, overallScore };
  const samples = new Map(state.samples).set(sampleId, sample);
  return recomputeStyleEng({ ...state, samples, totalSamples: samples.size });
}

// Add technique
export function addStyleTechnique(
  state: NarrativeStyleEngineState,
  techniqueId: string,
  name: string,
  description: string,
  elements: StyleElement[],
  effectiveness: number = 0.5
): NarrativeStyleEngineState {
  const technique: StyleTechnique = { techniqueId, name, description, elements, effectiveness, usages: 0 };
  const techniques = new Map(state.techniques).set(techniqueId, technique);
  return recomputeStyleEng({ ...state, techniques, totalTechniques: techniques.size });
}

// Use technique
export function useStyleTechnique(state: NarrativeStyleEngineState, techniqueId: string): NarrativeStyleEngineState {
  const technique = state.techniques.get(techniqueId);
  if (!technique) return state;

  const updated: StyleTechnique = { ...technique, usages: technique.usages + 1 };
  const techniques = new Map(state.techniques).set(techniqueId, updated);
  return recomputeStyleEng({ ...state, techniques });
}

// Get samples by mode
export function getSamplesByMode(state: NarrativeStyleEngineState, mode: StyleMode): StyleSample[] {
  return Array.from(state.samples.values()).filter(s => s.mode === mode);
}

// Get style report
export function getStyleReport(state: NarrativeStyleEngineState): {
  totalSamples: number;
  totalTechniques: number;
  averageComplexity: number;
  averageScore: number;
  styleConsistency: number;
  styleMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSamples === 0) recommendations.push('No samples — add style samples');
  if (state.averageScore < 0.5) recommendations.push('Low score — refine style');
  if (state.styleMastery < 0.5) recommendations.push('Low mastery — improve');

  return {
    totalSamples: state.totalSamples,
    totalTechniques: state.totalTechniques,
    averageComplexity: Math.round(state.averageComplexity * 100) / 100,
    averageScore: Math.round(state.averageScore * 100) / 100,
    styleConsistency: Math.round(state.styleConsistency * 100) / 100,
    styleMastery: Math.round(state.styleMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStyleEng(state: NarrativeStyleEngineState): NarrativeStyleEngineState {
  const samples = Array.from(state.samples.values());
  const averageScore = samples.length === 0 ? 0.5
    : samples.reduce((s, sa) => s + sa.overallScore, 0) / samples.length;

  const complexityMap: Record<StyleComplexity, number> = { simple: 0.2, moderate: 0.4, complex: 0.6, layered: 0.8, rich: 1.0 };
  const averageComplexity = samples.length === 0 ? 0.5
    : samples.reduce((s, sa) => s + complexityMap[sa.complexity], 0) / samples.length;

  const elementSet = new Set<string>();
  samples.forEach(s => s.elementScores.forEach((_, k) => elementSet.add(k)));
  const elementCoverage = Math.min(1, elementSet.size / 6);

  // Consistency: low variance in scores across samples
  const variance = samples.length === 0 ? 0
    : samples.reduce((s, sa) => s + Math.pow(sa.overallScore - averageScore, 2), 0) / samples.length;
  const styleConsistency = Math.max(0, 1 - variance * 4);

  const styleMastery = (averageScore * 0.4 + averageComplexity * 0.3 + styleConsistency * 0.3);

  return { ...state, averageScore, averageComplexity, elementCoverage, styleConsistency, styleMastery };
}

// Reset style state
export function resetNarrativeStyleEngineState(): NarrativeStyleEngineState {
  return createNarrativeStyleEngineState();
}