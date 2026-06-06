/**
 * V948 NarrativeSynthesisEngine — Direction E Iter 7/15 (Round 4)
 * Narrative synthesis engine: synthesis of disparate elements
 * Sources: nanobot synthesis + thunderbolt + chatdev
 */

export type SynthesisType = 'thematic' | 'character' | 'plot' | 'stylistic' | 'cultural' | 'philosophical';
export type SynthesisProcess = 'combine' | 'integrate' | 'unify' | 'weave' | 'fuse' | 'harmonize';
export type SynthesisResult = 'fragmented' | 'partial' | 'coherent' | 'unified' | 'transcendent';

export interface SynthesisElement {
  elementId: string;
  type: SynthesisType;
  process: SynthesisProcess;
  inputs: string[];
  output: string;
  coherence: number;
  chapter: number;
}

export interface SynthesisPattern {
  patternId: string;
  name: string;
  elementIds: string[];
  effectiveness: number;
  reuse: number;
}

export interface NarrativeSynthesisEngineState {
  elements: Map<string, SynthesisElement>;
  patterns: Map<string, SynthesisPattern>;
  totalElements: number;
  totalPatterns: number;
  averageCoherence: number;
  synthesisReuse: number;
  synthesisMastery: number;
  overallSynthesis: number;
}

// Factory
export function createNarrativeSynthesisEngineState(): NarrativeSynthesisEngineState {
  return {
    elements: new Map(),
    patterns: new Map(),
    totalElements: 0,
    totalPatterns: 0,
    averageCoherence: 0.5,
    synthesisReuse: 0,
    synthesisMastery: 0.5,
    overallSynthesis: 0.5,
  };
}

// Add element
export function addSynthesisElement(
  state: NarrativeSynthesisEngineState,
  elementId: string,
  type: SynthesisType,
  process: SynthesisProcess,
  inputs: string[],
  output: string,
  coherence: number,
  chapter: number
): NarrativeSynthesisEngineState {
  const element: SynthesisElement = { elementId, type, process, inputs, output, coherence, chapter };
  const elements = new Map(state.elements).set(elementId, element);
  return recomputeSynthesis({ ...state, elements, totalElements: elements.size });
}

// Add pattern
export function addSynthesisPattern(
  state: NarrativeSynthesisEngineState,
  patternId: string,
  name: string,
  elementIds: string[]
): NarrativeSynthesisEngineState {
  const elements = elementIds.map(id => state.elements.get(id)).filter((e): e is SynthesisElement => e !== undefined);
  const effectiveness = elements.length === 0 ? 0.5
    : elements.reduce((s, e) => s + e.coherence, 0) / elements.length;
  const pattern: SynthesisPattern = { patternId, name, elementIds, effectiveness, reuse: 0 };
  const patterns = new Map(state.patterns).set(patternId, pattern);
  return recomputeSynthesis({ ...state, patterns, totalPatterns: patterns.size });
}

// Use pattern
export function useSynthesisPattern(state: NarrativeSynthesisEngineState, patternId: string): NarrativeSynthesisEngineState {
  const pattern = state.patterns.get(patternId);
  if (!pattern) return state;

  const updated: SynthesisPattern = { ...pattern, reuse: pattern.reuse + 1 };
  const patterns = new Map(state.patterns).set(patternId, updated);
  return recomputeSynthesis({ ...state, patterns });
}

// Get elements by type
export function getElementsByType(state: NarrativeSynthesisEngineState, type: SynthesisType): SynthesisElement[] {
  return Array.from(state.elements.values()).filter(e => e.type === type);
}

// Get synthesis report
export function getSynthesisReport(state: NarrativeSynthesisEngineState): {
  totalElements: number;
  totalPatterns: number;
  averageCoherence: number;
  synthesisReuse: number;
  synthesisMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalElements === 0) recommendations.push('No elements — add synthesis elements');
  if (state.averageCoherence < 0.5) recommendations.push('Low coherence — improve');
  if (state.synthesisMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalElements: state.totalElements,
    totalPatterns: state.totalPatterns,
    averageCoherence: Math.round(state.averageCoherence * 100) / 100,
    synthesisReuse: Math.round(state.synthesisReuse * 100) / 100,
    synthesisMastery: Math.round(state.synthesisMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSynthesis(state: NarrativeSynthesisEngineState): NarrativeSynthesisEngineState {
  const elements = Array.from(state.elements.values());
  const averageCoherence = elements.length === 0 ? 0.5
    : elements.reduce((s, e) => s + e.coherence, 0) / elements.length;

  const patterns = Array.from(state.patterns.values());
  const totalReuse = patterns.reduce((s, p) => s + p.reuse, 0);
  const synthesisReuse = patterns.length === 0 ? 0
    : Math.min(1, totalReuse / Math.max(1, patterns.length * 2));

  const typeSet = new Set(elements.map(e => e.type));
  const typeCoverage = Math.min(1, typeSet.size / 5);

  const synthesisMastery = (averageCoherence * 0.5 + synthesisReuse * 0.2 + typeCoverage * 0.3);
  const overallSynthesis = synthesisMastery;

  return { ...state, averageCoherence, synthesisReuse, synthesisMastery, overallSynthesis };
}

// Reset synthesis state
export function resetNarrativeSynthesisEngineState(): NarrativeSynthesisEngineState {
  return createNarrativeSynthesisEngineState();
}