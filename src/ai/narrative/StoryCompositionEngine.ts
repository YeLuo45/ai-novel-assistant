/**
 * V872 StoryCompositionEngine — Direction B Iter 14/15 (Round 4)
 * Story composition engine: compositional craft + arrangement
 * Sources: thunderbolt composition + chatdev + ruflo
 */

export type CompositionElement = 'opening' | 'setup' | 'development' | 'complication' | 'climax' | 'resolution';
export type CompositionLevel = 'basic' | 'competent' | 'skilled' | 'artful' | 'masterful';
export type CompositionHealth = 'fragmented' | 'rough' | 'coherent' | 'polished' | 'integrated';

export interface CompositionPiece {
  pieceId: string;
  element: CompositionElement;
  description: string;
  position: number;
  effectiveness: number;
  wordCount: number;
  chapter: number;
}

export interface CompositionLayer {
  layerId: string;
  name: string;
  pieceIds: string[];
  visibility: number;
  weight: number;
}

export interface StoryCompositionEngineState {
  pieces: Map<string, CompositionPiece>;
  layers: Map<string, CompositionLayer>;
  totalPieces: number;
  totalLayers: number;
  totalWords: number;
  averageEffectiveness: number;
  layerIntegration: number;
  compositionMastery: number;
  overallHealth: CompositionHealth;
}

// Factory
export function createStoryCompositionEngineState(): StoryCompositionEngineState {
  return {
    pieces: new Map(),
    layers: new Map(),
    totalPieces: 0,
    totalLayers: 0,
    totalWords: 0,
    averageEffectiveness: 0.5,
    layerIntegration: 0.5,
    compositionMastery: 0.5,
    overallHealth: 'coherent',
  };
}

// Add piece
export function addCompositionPiece(
  state: StoryCompositionEngineState,
  pieceId: string,
  element: CompositionElement,
  description: string,
  position: number,
  wordCount: number,
  chapter: number,
  effectiveness: number = 0.5
): StoryCompositionEngineState {
  const piece: CompositionPiece = { pieceId, element, description, position, wordCount, chapter, effectiveness };
  const pieces = new Map(state.pieces).set(pieceId, piece);
  return recomputeComposition({ ...state, pieces, totalPieces: pieces.size });
}

// Create layer
export function createCompositionLayer(
  state: StoryCompositionEngineState,
  layerId: string,
  name: string,
  pieceIds: string[],
  visibility: number = 0.5,
  weight: number = 0.5
): StoryCompositionEngineState {
  const layer: CompositionLayer = { layerId, name, pieceIds, visibility, weight };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputeComposition({ ...state, layers, totalLayers: layers.size });
}

// Get pieces by element
export function getPiecesByElement(state: StoryCompositionEngineState, element: CompositionElement): CompositionPiece[] {
  return Array.from(state.pieces.values()).filter(p => p.element === element);
}

// Get composition report
export function getCompositionReport(state: StoryCompositionEngineState): {
  totalPieces: number;
  totalLayers: number;
  totalWords: number;
  averageEffectiveness: number;
  layerIntegration: number;
  compositionMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalPieces === 0) recommendations.push('No pieces — add composition pieces');
  if (state.averageEffectiveness < 0.5) recommendations.push('Low effectiveness — improve');
  if (state.layerIntegration < 0.4) recommendations.push('Low integration — connect layers');

  return {
    totalPieces: state.totalPieces,
    totalLayers: state.totalLayers,
    totalWords: state.totalWords,
    averageEffectiveness: Math.round(state.averageEffectiveness * 100) / 100,
    layerIntegration: Math.round(state.layerIntegration * 100) / 100,
    compositionMastery: Math.round(state.compositionMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeComposition(state: StoryCompositionEngineState): StoryCompositionEngineState {
  const pieces = Array.from(state.pieces.values());
  const totalWords = pieces.reduce((s, p) => s + p.wordCount, 0);
  const averageEffectiveness = pieces.length === 0 ? 0.5
    : pieces.reduce((s, p) => s + p.effectiveness, 0) / pieces.length;

  const elementSet = new Set(pieces.map(p => p.element));
  const elementCoverage = elementSet.size / 6;

  const layers = Array.from(state.layers.values());
  const layerIntegration = layers.length === 0 || pieces.length === 0 ? 0.5
    : Math.min(1, layers.reduce((s, l) => s + l.pieceIds.length, 0) / (pieces.length * layers.length));

  const compositionMastery = (averageEffectiveness * 0.5 + layerIntegration * 0.3 + elementCoverage * 0.2);

  const overallHealth: CompositionHealth = compositionMastery < 0.4 ? 'fragmented'
    : compositionMastery < 0.55 ? 'rough'
    : compositionMastery < 0.7 ? 'coherent'
    : compositionMastery < 0.85 ? 'polished'
    : 'integrated';

  return { ...state, totalWords, averageEffectiveness, layerIntegration, compositionMastery, overallHealth };
}

// Reset composition state
export function resetStoryCompositionEngineState(): StoryCompositionEngineState {
  return createStoryCompositionEngineState();
}