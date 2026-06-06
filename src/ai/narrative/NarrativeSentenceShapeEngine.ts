/**
 * V1148 NarrativeSentenceShapeEngine — Direction F Iter 2/20 (Round 5)
 * Sentence shape engine: shape and form of sentences
 * Sources: nanobot shape + ruflo + thunderbolt
 */

export type SentenceShapeType = 'simple' | 'compound' | 'complex' | 'compound_complex' | 'fragment' | 'periodic';
export type SentenceShapeLength = 'terse' | 'short' | 'medium' | 'long' | 'elaborate';
export type SentenceShapeOpenness = 'closed' | 'guarded' | 'balanced' | 'open' | 'expansive';

export interface SentenceShape {
  shapeId: string;
  type: SentenceShapeType;
  length: SentenceShapeLength;
  openness: SentenceShapeOpenness;
  description: string;
  clarity: number;
  impact: number;
  chapter: number;
}

export interface SentenceShapePattern {
  patternId: string,
  shapeIds: string[],
  cumulativeClarity: number,
  variation: number,
}

export interface NarrativeSentenceShapeEngineState {
  shapes: Map<string, SentenceShape>;
  patterns: Map<string, SentenceShapePattern>;
  totalShapes: number;
  totalPatterns: number;
  averageClarity: number;
  averageImpact: number;
  patternVariation: number;
  sentenceShapeMastery: number;
}

// Factory
export function createNarrativeSentenceShapeEngineState(): NarrativeSentenceShapeEngineState {
  return {
    shapes: new Map(),
    patterns: new Map(),
    totalShapes: 0,
    totalPatterns: 0,
    averageClarity: 0.5,
    averageImpact: 0.5,
    patternVariation: 0.5,
    sentenceShapeMastery: 0.5,
  };
}

// Add shape
export function addSentenceShape(
  state: NarrativeSentenceShapeEngineState,
  shapeId: string,
  type: SentenceShapeType,
  length: SentenceShapeLength,
  openness: SentenceShapeOpenness,
  description: string,
  clarity: number,
  impact: number,
  chapter: number
): NarrativeSentenceShapeEngineState {
  const shape: SentenceShape = { shapeId, type, length, openness, description, clarity, impact, chapter };
  const shapes = new Map(state.shapes).set(shapeId, shape);
  return recomputeSentenceShape({ ...state, shapes, totalShapes: shapes.size });
}

// Add pattern
export function addSentenceShapePattern(
  state: NarrativeSentenceShapeEngineState,
  patternId: string,
  shapeIds: string[]
): NarrativeSentenceShapeEngineState {
  const shapes = shapeIds.map(id => state.shapes.get(id)).filter((s): s is SentenceShape => s !== undefined);
  const cumulativeClarity = shapes.length === 0 ? 0
    : shapes.reduce((s, sh) => s + sh.clarity, 0) / shapes.length;
  const typeSet = new Set(shapes.map(s => s.type));
  const variation = Math.min(1, typeSet.size / 6);
  const pattern: SentenceShapePattern = { patternId, shapeIds, cumulativeClarity, variation };
  const patterns = new Map(state.patterns).set(patternId, pattern);
  return recomputeSentenceShape({ ...state, patterns, totalPatterns: patterns.size });
}

// Get shapes by type
export function getSentenceShapesByType(state: NarrativeSentenceShapeEngineState, type: SentenceShapeType): SentenceShape[] {
  return Array.from(state.shapes.values()).filter(s => s.type === type);
}

// Get sentence shape report
export function getSentenceShapeReport(state: NarrativeSentenceShapeEngineState): {
  totalShapes: number;
  totalPatterns: number;
  averageClarity: number;
  averageImpact: number;
  sentenceShapeMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalShapes === 0) recommendations.push('No shapes — add sentence shapes');
  if (state.averageClarity < 0.5) recommendations.push('Low clarity — strengthen');
  if (state.sentenceShapeMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalShapes: state.totalShapes,
    totalPatterns: state.totalPatterns,
    averageClarity: Math.round(state.averageClarity * 100) / 100,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    sentenceShapeMastery: Math.round(state.sentenceShapeMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSentenceShape(state: NarrativeSentenceShapeEngineState): NarrativeSentenceShapeEngineState {
  const shapes = Array.from(state.shapes.values());
  const averageClarity = shapes.length === 0 ? 0.5
    : shapes.reduce((s, sh) => s + sh.clarity, 0) / shapes.length;
  const averageImpact = shapes.length === 0 ? 0.5
    : shapes.reduce((s, sh) => s + sh.impact, 0) / shapes.length;

  const patterns = Array.from(state.patterns.values());
  const patternVariation = patterns.length === 0 ? 0.5
    : patterns.reduce((s, p) => s + p.variation, 0) / patterns.length;

  const sentenceShapeMastery = (averageClarity * 0.4 + averageImpact * 0.3 + patternVariation * 0.3);

  return { ...state, averageClarity, averageImpact, patternVariation, sentenceShapeMastery };
}

// Reset
export function resetNarrativeSentenceShapeEngineState(): NarrativeSentenceShapeEngineState {
  return createNarrativeSentenceShapeEngineState();
}