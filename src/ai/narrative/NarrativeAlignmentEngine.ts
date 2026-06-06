/**
 * V1094 NarrativeAlignmentEngine — Direction D Iter 15/20 (Round 6)
 * Narrative alignment engine: align narrative elements
 * Sources: ruflo alignment + thunderbolt + nanobot
 */

export type AlignmentType = 'thematic' | 'tonal' | 'stylistic' | 'narrative' | 'moral' | 'aesthetic';
export type AlignmentPrecision = 'loose' | 'approximate' | 'tight' | 'precise' | 'exact';
export type AlignmentScope = 'local' | 'sectional' | 'arc' | 'narrative' | 'meta';

export interface Alignment {
  alignmentId: string;
  type: AlignmentType;
  precision: AlignmentPrecision;
  scope: AlignmentScope;
  description: string;
  coherence: number;
  fidelity: number;
  chapter: number;
}

export interface AlignmentPattern {
  patternId: string,
  alignmentIds: string[],
  cumulativeCoherence: number,
  precision: number,
}

export interface NarrativeAlignmentEngineState {
  alignments: Map<string, Alignment>;
  patterns: Map<string, AlignmentPattern>;
  totalAlignments: number;
  totalPatterns: number;
  averageCoherence: number;
  averageFidelity: number;
  patternPrecision: number;
  alignmentMastery: number;
}

// Factory
export function createNarrativeAlignmentEngineState(): NarrativeAlignmentEngineState {
  return {
    alignments: new Map(),
    patterns: new Map(),
    totalAlignments: 0,
    totalPatterns: 0,
    averageCoherence: 0.5,
    averageFidelity: 0.5,
    patternPrecision: 0.5,
    alignmentMastery: 0.5,
  };
}

// Add alignment
export function addAlignment(
  state: NarrativeAlignmentEngineState,
  alignmentId: string,
  type: AlignmentType,
  precision: AlignmentPrecision,
  scope: AlignmentScope,
  description: string,
  coherence: number,
  fidelity: number,
  chapter: number
): NarrativeAlignmentEngineState {
  const alignment: Alignment = { alignmentId, type, precision, scope, description, coherence, fidelity, chapter };
  const alignments = new Map(state.alignments).set(alignmentId, alignment);
  return recomputeAlignment({ ...state, alignments, totalAlignments: alignments.size });
}

// Add pattern
export function addAlignmentPattern(
  state: NarrativeAlignmentEngineState,
  patternId: string,
  alignmentIds: string[]
): NarrativeAlignmentEngineState {
  const alignments = alignmentIds.map(id => state.alignments.get(id)).filter((a): a is Alignment => a !== undefined);
  const cumulativeCoherence = alignments.length === 0 ? 0
    : alignments.reduce((s, a) => s + a.coherence, 0) / alignments.length;
  const precision = alignments.length === 0 ? 0.5
    : alignments.reduce((s, a) => s + (a.precision === 'exact' ? 1 : a.precision === 'precise' ? 0.85 : a.precision === 'tight' ? 0.7 : a.precision === 'approximate' ? 0.5 : 0.3), 0) / alignments.length;
  const pattern: AlignmentPattern = { patternId, alignmentIds, cumulativeCoherence, precision };
  const patterns = new Map(state.patterns).set(patternId, pattern);
  return recomputeAlignment({ ...state, patterns, totalPatterns: patterns.size });
}

// Get alignments by type
export function getAlignmentsByType(state: NarrativeAlignmentEngineState, type: AlignmentType): Alignment[] {
  return Array.from(state.alignments.values()).filter(a => a.type === type);
}

// Get alignment report
export function getAlignmentReport(state: NarrativeAlignmentEngineState): {
  totalAlignments: number;
  totalPatterns: number;
  averageCoherence: number;
  patternPrecision: number;
  alignmentMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalAlignments === 0) recommendations.push('No alignments — add alignments');
  if (state.averageCoherence < 0.5) recommendations.push('Low coherence — improve');
  if (state.alignmentMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalAlignments: state.totalAlignments,
    totalPatterns: state.totalPatterns,
    averageCoherence: Math.round(state.averageCoherence * 100) / 100,
    patternPrecision: Math.round(state.patternPrecision * 100) / 100,
    alignmentMastery: Math.round(state.alignmentMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAlignment(state: NarrativeAlignmentEngineState): NarrativeAlignmentEngineState {
  const alignments = Array.from(state.alignments.values());
  const averageCoherence = alignments.length === 0 ? 0.5
    : alignments.reduce((s, a) => s + a.coherence, 0) / alignments.length;
  const averageFidelity = alignments.length === 0 ? 0.5
    : alignments.reduce((s, a) => s + a.fidelity, 0) / alignments.length;

  const patterns = Array.from(state.patterns.values());
  const patternPrecision = patterns.length === 0 ? 0.5
    : patterns.reduce((s, p) => s + p.precision, 0) / patterns.length;

  const alignmentMastery = (averageCoherence * 0.4 + averageFidelity * 0.3 + patternPrecision * 0.3);

  return { ...state, averageCoherence, averageFidelity, patternPrecision, alignmentMastery };
}

// Reset
export function resetNarrativeAlignmentEngineState(): NarrativeAlignmentEngineState {
  return createNarrativeAlignmentEngineState();
}