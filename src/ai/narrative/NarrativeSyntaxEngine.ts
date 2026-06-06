/**
 * V1176 NarrativeSyntaxEngine — Direction F Iter 16/20 (Round 5)
 * Syntax engine: syntax patterns in narrative
 * Sources: ruflo syntax + nanobot + thunderbolt
 */

export type SyntaxPattern = 'parataxis' | 'hypotaxis' | 'anaphora' | 'epistrophe' | 'chiasmus' | 'asyndeton';
export type SyntaxComplexity = 'simple' | 'moderate' | 'complex' | 'elaborate' | 'labyrinthine';
export type SyntaxVariation = 'monotonous' | 'subtle' | 'varied' | 'dramatic' | 'arresting';

export interface Syntax {
  syntaxId: string;
  pattern: SyntaxPattern;
  complexity: SyntaxComplexity;
  variation: SyntaxVariation;
  description: string;
  clarity: number;
  impact: number;
  chapter: number;
}

export interface SyntaxLayer {
  layerId: string,
  syntaxIds: string[],
  cumulativeClarity: number,
  breadth: number,
}

export interface NarrativeSyntaxEngineState {
  syntaxes: Map<string, Syntax>;
  layers: Map<string, SyntaxLayer>;
  totalSyntaxes: number;
  totalLayers: number;
  averageClarity: number;
  averageImpact: number;
  layerBreadth: number;
  syntaxMastery: number;
}

// Factory
export function createNarrativeSyntaxEngineState(): NarrativeSyntaxEngineState {
  return {
    syntaxes: new Map(),
    layers: new Map(),
    totalSyntaxes: 0,
    totalLayers: 0,
    averageClarity: 0.5,
    averageImpact: 0.5,
    layerBreadth: 0.5,
    syntaxMastery: 0.5,
  };
}

// Add syntax
export function addSyntax(
  state: NarrativeSyntaxEngineState,
  syntaxId: string,
  pattern: SyntaxPattern,
  complexity: SyntaxComplexity,
  variation: SyntaxVariation,
  description: string,
  clarity: number,
  impact: number,
  chapter: number
): NarrativeSyntaxEngineState {
  const syntax: Syntax = { syntaxId, pattern, complexity, variation, description, clarity, impact, chapter };
  const syntaxes = new Map(state.syntaxes).set(syntaxId, syntax);
  return recomputeSyntax({ ...state, syntaxes, totalSyntaxes: syntaxes.size });
}

// Add layer
export function addSyntaxLayer(
  state: NarrativeSyntaxEngineState,
  layerId: string,
  syntaxIds: string[]
): NarrativeSyntaxEngineState {
  const syntaxes = syntaxIds.map(id => state.syntaxes.get(id)).filter((s): s is Syntax => s !== undefined);
  const cumulativeClarity = syntaxes.length === 0 ? 0
    : syntaxes.reduce((s, sy) => s + sy.clarity, 0) / syntaxes.length;
  const patternSet = new Set(syntaxes.map(s => s.pattern));
  const breadth = Math.min(1, patternSet.size / 6);
  const layer: SyntaxLayer = { layerId, syntaxIds, cumulativeClarity, breadth };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputeSyntax({ ...state, layers, totalLayers: layers.size });
}

// Get syntaxes by pattern
export function getSyntaxesByPattern(state: NarrativeSyntaxEngineState, pattern: SyntaxPattern): Syntax[] {
  return Array.from(state.syntaxes.values()).filter(s => s.pattern === pattern);
}

// Get syntax report
export function getSyntaxReport(state: NarrativeSyntaxEngineState): {
  totalSyntaxes: number;
  totalLayers: number;
  averageClarity: number;
  averageImpact: number;
  syntaxMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSyntaxes === 0) recommendations.push('No syntaxes — add syntaxes');
  if (state.averageClarity < 0.5) recommendations.push('Low clarity — strengthen');
  if (state.syntaxMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalSyntaxes: state.totalSyntaxes,
    totalLayers: state.totalLayers,
    averageClarity: Math.round(state.averageClarity * 100) / 100,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    syntaxMastery: Math.round(state.syntaxMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSyntax(state: NarrativeSyntaxEngineState): NarrativeSyntaxEngineState {
  const syntaxes = Array.from(state.syntaxes.values());
  const averageClarity = syntaxes.length === 0 ? 0.5
    : syntaxes.reduce((s, sy) => s + sy.clarity, 0) / syntaxes.length;
  const averageImpact = syntaxes.length === 0 ? 0.5
    : syntaxes.reduce((s, sy) => s + sy.impact, 0) / syntaxes.length;

  const layers = Array.from(state.layers.values());
  const layerBreadth = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.breadth, 0) / layers.length;

  const syntaxMastery = (averageClarity * 0.4 + averageImpact * 0.3 + layerBreadth * 0.3);

  return { ...state, averageClarity, averageImpact, layerBreadth, syntaxMastery };
}

// Reset
export function resetNarrativeSyntaxEngineState(): NarrativeSyntaxEngineState {
  return createNarrativeSyntaxEngineState();
}