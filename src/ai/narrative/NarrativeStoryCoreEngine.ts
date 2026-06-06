/**
 * V1302 NarrativeStoryCoreEngine — Direction I Iter 19/20 (Round 5)
 * Story core engine: core of story
 * Sources: nanobot core + thunderbolt + ruflo
 */

export type StoryCoreElement = 'theme' | 'message' | 'question' | 'truth' | 'wisdom' | 'transcendent';
export type StoryCoreDepth = 'surface' | 'shallow' | 'medium' | 'deep' | 'abyssal';
export type StoryCoreResonance = 'faint' | 'weak' | 'moderate' | 'strong' | 'transcendent';

export interface StoryCoreNode {
  coreId: string;
  element: StoryCoreElement;
  depth: StoryCoreDepth;
  resonance: StoryCoreResonance;
  description: string;
  essence: number;
  universality: number;
  chapter: number;
}

export interface StoryCoreEssence {
  essenceId: string,
  coreIds: string[],
  cumulativeEssence: number,
  totality: number,
}

export interface NarrativeStoryCoreEngineState {
  cores: Map<string, StoryCoreNode>;
  essences: Map<string, StoryCoreEssence>;
  totalCores: number;
  totalEssences: number;
  averageEssence: number;
  averageUniversality: number;
  essenceTotality: number;
  storyCoreMastery: number;
}

// Factory
export function createNarrativeStoryCoreEngineState(): NarrativeStoryCoreEngineState {
  return {
    cores: new Map(),
    essences: new Map(),
    totalCores: 0,
    totalEssences: 0,
    averageEssence: 0.5,
    averageUniversality: 0.5,
    essenceTotality: 0.5,
    storyCoreMastery: 0.5,
  };
}

// Add core
export function addStoryCoreNode(
  state: NarrativeStoryCoreEngineState,
  coreId: string,
  element: StoryCoreElement,
  depth: StoryCoreDepth,
  resonance: StoryCoreResonance,
  description: string,
  essence: number,
  universality: number,
  chapter: number
): NarrativeStoryCoreEngineState {
  const core: StoryCoreNode = { coreId, element, depth, resonance, description, essence, universality, chapter };
  const cores = new Map(state.cores).set(coreId, core);
  return recomputeStoryCore({ ...state, cores, totalCores: cores.size });
}

// Add essence
export function addStoryCoreEssence(
  state: NarrativeStoryCoreEngineState,
  essenceId: string,
  coreIds: string[]
): NarrativeStoryCoreEngineState {
  const cores = coreIds.map(id => state.cores.get(id)).filter((c): c is StoryCoreNode => c !== undefined);
  const cumulativeEssence = cores.length === 0 ? 0
    : cores.reduce((s, c) => s + c.essence, 0) / cores.length;
  const elementSet = new Set(cores.map(c => c.element));
  const totality = Math.min(1, elementSet.size / 6);
  const essenceNode: StoryCoreEssence = { essenceId, coreIds, cumulativeEssence, totality };
  const essences = new Map(state.essences).set(essenceId, essenceNode);
  return recomputeStoryCore({ ...state, essences, totalEssences: essences.size });
}

// Get cores by element
export function getStoryCoreNodesByElement(state: NarrativeStoryCoreEngineState, element: StoryCoreElement): StoryCoreNode[] {
  return Array.from(state.cores.values()).filter(c => c.element === element);
}

// Get story core report
export function getStoryCoreReport(state: NarrativeStoryCoreEngineState): {
  totalCores: number;
  totalEssences: number;
  averageEssence: number;
  averageUniversality: number;
  storyCoreMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalCores === 0) recommendations.push('No cores — add story core nodes');
  if (state.averageEssence < 0.5) recommendations.push('Low essence — strengthen');
  if (state.storyCoreMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalCores: state.totalCores,
    totalEssences: state.totalEssences,
    averageEssence: Math.round(state.averageEssence * 100) / 100,
    averageUniversality: Math.round(state.averageUniversality * 100) / 100,
    storyCoreMastery: Math.round(state.storyCoreMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStoryCore(state: NarrativeStoryCoreEngineState): NarrativeStoryCoreEngineState {
  const cores = Array.from(state.cores.values());
  const averageEssence = cores.length === 0 ? 0.5
    : cores.reduce((s, c) => s + c.essence, 0) / cores.length;
  const averageUniversality = cores.length === 0 ? 0.5
    : cores.reduce((s, c) => s + c.universality, 0) / cores.length;

  const essences = Array.from(state.essences.values());
  const essenceTotality = essences.length === 0 ? 0.5
    : essences.reduce((s, e) => s + e.totality, 0) / essences.length;

  const storyCoreMastery = (averageEssence * 0.4 + averageUniversality * 0.3 + essenceTotality * 0.3);

  return { ...state, averageEssence, averageUniversality, essenceTotality, storyCoreMastery };
}

// Reset
export function resetNarrativeStoryCoreEngineState(): NarrativeStoryCoreEngineState {
  return createNarrativeStoryCoreEngineState();
}