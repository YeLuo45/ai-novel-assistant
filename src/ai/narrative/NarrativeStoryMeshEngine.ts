/**
 * V1276 NarrativeStoryMeshEngine — Direction I Iter 6/20 (Round 5)
 * Story mesh engine: mesh of story interactions
 * Sources: ruflo mesh + nanobot + thunderbolt
 */

export type StoryMeshInteraction = 'conflict' | 'alliance' | 'romance' | 'rivalry' | 'mentor' | 'transcendent';
export type StoryMeshIntensity = 'subtle' | 'moderate' | 'strong' | 'intense' | 'overwhelming';
export type StoryMeshOutcome = 'positive' | 'negative' | 'neutral' | 'transformative' | 'paradoxical';

export interface StoryMeshInteractionNode {
  interactionId: string;
  type: StoryMeshInteraction;
  intensity: StoryMeshIntensity;
  outcome: StoryMeshOutcome;
  description: string;
  charge: number;
  complexity: number;
  chapter: number;
}

export interface StoryMeshLayer {
  layerId: string,
  interactionIds: string[],
  cumulativeCharge: number,
  richness: number,
}

export interface NarrativeStoryMeshEngineState {
  interactions: Map<string, StoryMeshInteractionNode>;
  layers: Map<string, StoryMeshLayer>;
  totalInteractions: number;
  totalLayers: number;
  averageCharge: number;
  averageComplexity: number;
  layerRichness: number;
  storyMeshMastery: number;
}

// Factory
export function createNarrativeStoryMeshEngineState(): NarrativeStoryMeshEngineState {
  return {
    interactions: new Map(),
    layers: new Map(),
    totalInteractions: 0,
    totalLayers: 0,
    averageCharge: 0.5,
    averageComplexity: 0.5,
    layerRichness: 0.5,
    storyMeshMastery: 0.5,
  };
}

// Add interaction
export function addStoryMeshInteraction(
  state: NarrativeStoryMeshEngineState,
  interactionId: string,
  type: StoryMeshInteraction,
  intensity: StoryMeshIntensity,
  outcome: StoryMeshOutcome,
  description: string,
  charge: number,
  complexity: number,
  chapter: number
): NarrativeStoryMeshEngineState {
  const interaction: StoryMeshInteractionNode = { interactionId, type, intensity, outcome, description, charge, complexity, chapter };
  const interactions = new Map(state.interactions).set(interactionId, interaction);
  return recomputeStoryMesh({ ...state, interactions, totalInteractions: interactions.size });
}

// Add layer
export function addStoryMeshLayer(
  state: NarrativeStoryMeshEngineState,
  layerId: string,
  interactionIds: string[]
): NarrativeStoryMeshEngineState {
  const interactions = interactionIds.map(id => state.interactions.get(id)).filter((i): i is StoryMeshInteractionNode => i !== undefined);
  const cumulativeCharge = interactions.length === 0 ? 0
    : interactions.reduce((s, i) => s + i.charge, 0) / interactions.length;
  const typeSet = new Set(interactions.map(i => i.type));
  const richness = Math.min(1, typeSet.size / 6);
  const layer: StoryMeshLayer = { layerId, interactionIds, cumulativeCharge, richness };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputeStoryMesh({ ...state, layers, totalLayers: layers.size });
}

// Get interactions by type
export function getStoryMeshInteractionsByType(state: NarrativeStoryMeshEngineState, type: StoryMeshInteraction): StoryMeshInteractionNode[] {
  return Array.from(state.interactions.values()).filter(i => i.type === type);
}

// Get story mesh report
export function getStoryMeshReport(state: NarrativeStoryMeshEngineState): {
  totalInteractions: number;
  totalLayers: number;
  averageCharge: number;
  averageComplexity: number;
  storyMeshMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalInteractions === 0) recommendations.push('No interactions — add story mesh interactions');
  if (state.averageCharge < 0.5) recommendations.push('Low charge — strengthen');
  if (state.storyMeshMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalInteractions: state.totalInteractions,
    totalLayers: state.totalLayers,
    averageCharge: Math.round(state.averageCharge * 100) / 100,
    averageComplexity: Math.round(state.averageComplexity * 100) / 100,
    storyMeshMastery: Math.round(state.storyMeshMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStoryMesh(state: NarrativeStoryMeshEngineState): NarrativeStoryMeshEngineState {
  const interactions = Array.from(state.interactions.values());
  const averageCharge = interactions.length === 0 ? 0.5
    : interactions.reduce((s, i) => s + i.charge, 0) / interactions.length;
  const averageComplexity = interactions.length === 0 ? 0.5
    : interactions.reduce((s, i) => s + i.complexity, 0) / interactions.length;

  const layers = Array.from(state.layers.values());
  const layerRichness = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.richness, 0) / layers.length;

  const storyMeshMastery = (averageCharge * 0.4 + averageComplexity * 0.3 + layerRichness * 0.3);

  return { ...state, averageCharge, averageComplexity, layerRichness, storyMeshMastery };
}

// Reset
export function resetNarrativeStoryMeshEngineState(): NarrativeStoryMeshEngineState {
  return createNarrativeStoryMeshEngineState();
}