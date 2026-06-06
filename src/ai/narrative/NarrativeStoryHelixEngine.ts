/**
 * V1286 NarrativeStoryHelixEngine — Direction I Iter 11/20 (Round 5)
 * Story helix engine: helix structure of story
 * Sources: thunderbolt helix + nanobot + ruflo
 */

export type StoryHelixStrand = 'single' | 'double' | 'triple' | 'quadruple' | 'infinite';
export type StoryHelixPitch = 'tight' | 'moderate' | 'wide' | 'expansive' | 'cosmic';
export type StoryHelixRise = 'constant' | 'variable' | 'accelerating' | 'decelerating' | 'spiral';

export interface StoryHelixNode {
  helixId: string;
  strand: StoryHelixStrand;
  pitch: StoryHelixPitch;
  rise: StoryHelixRise;
  description: string;
  progression: number;
  evolution: number;
  chapter: number;
}

export interface StoryHelixTurn {
  turnId: string,
  helixIds: string[],
  cumulativeProgression: number,
  complexity: number,
}

export interface NarrativeStoryHelixEngineState {
  helices: Map<string, StoryHelixNode>;
  turns: Map<string, StoryHelixTurn>;
  totalHelices: number;
  totalTurns: number;
  averageProgression: number;
  averageEvolution: number;
  turnComplexity: number;
  storyHelixMastery: number;
}

// Factory
export function createNarrativeStoryHelixEngineState(): NarrativeStoryHelixEngineState {
  return {
    helices: new Map(),
    turns: new Map(),
    totalHelices: 0,
    totalTurns: 0,
    averageProgression: 0.5,
    averageEvolution: 0.5,
    turnComplexity: 0.5,
    storyHelixMastery: 0.5,
  };
}

// Add helix
export function addStoryHelixNode(
  state: NarrativeStoryHelixEngineState,
  helixId: string,
  strand: StoryHelixStrand,
  pitch: StoryHelixPitch,
  rise: StoryHelixRise,
  description: string,
  progression: number,
  evolution: number,
  chapter: number
): NarrativeStoryHelixEngineState {
  const helix: StoryHelixNode = { helixId, strand, pitch, rise, description, progression, evolution, chapter };
  const helices = new Map(state.helices).set(helixId, helix);
  return recomputeStoryHelix({ ...state, helices, totalHelices: helices.size });
}

// Add turn
export function addStoryHelixTurn(
  state: NarrativeStoryHelixEngineState,
  turnId: string,
  helixIds: string[]
): NarrativeStoryHelixEngineState {
  const helices = helixIds.map(id => state.helices.get(id)).filter((h): h is StoryHelixNode => h !== undefined);
  const cumulativeProgression = helices.length === 0 ? 0
    : helices.reduce((s, h) => s + h.progression, 0) / helices.length;
  const strandSet = new Set(helices.map(h => h.strand));
  const complexity = Math.min(1, strandSet.size / 6);
  const turn: StoryHelixTurn = { turnId, helixIds, cumulativeProgression, complexity };
  const turns = new Map(state.turns).set(turnId, turn);
  return recomputeStoryHelix({ ...state, turns, totalTurns: turns.size });
}

// Get helices by strand
export function getStoryHelixNodesByStrand(state: NarrativeStoryHelixEngineState, strand: StoryHelixStrand): StoryHelixNode[] {
  return Array.from(state.helices.values()).filter(h => h.strand === strand);
}

// Get story helix report
export function getStoryHelixReport(state: NarrativeStoryHelixEngineState): {
  totalHelices: number;
  totalTurns: number;
  averageProgression: number;
  averageEvolution: number;
  storyHelixMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalHelices === 0) recommendations.push('No helices — add story helix nodes');
  if (state.averageProgression < 0.5) recommendations.push('Low progression — strengthen');
  if (state.storyHelixMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalHelices: state.totalHelices,
    totalTurns: state.totalTurns,
    averageProgression: Math.round(state.averageProgression * 100) / 100,
    averageEvolution: Math.round(state.averageEvolution * 100) / 100,
    storyHelixMastery: Math.round(state.storyHelixMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStoryHelix(state: NarrativeStoryHelixEngineState): NarrativeStoryHelixEngineState {
  const helices = Array.from(state.helices.values());
  const averageProgression = helices.length === 0 ? 0.5
    : helices.reduce((s, h) => s + h.progression, 0) / helices.length;
  const averageEvolution = helices.length === 0 ? 0.5
    : helices.reduce((s, h) => s + h.evolution, 0) / helices.length;

  const turns = Array.from(state.turns.values());
  const turnComplexity = turns.length === 0 ? 0.5
    : turns.reduce((s, t) => s + t.complexity, 0) / turns.length;

  const storyHelixMastery = (averageProgression * 0.4 + averageEvolution * 0.3 + turnComplexity * 0.3);

  return { ...state, averageProgression, averageEvolution, turnComplexity, storyHelixMastery };
}

// Reset
export function resetNarrativeStoryHelixEngineState(): NarrativeStoryHelixEngineState {
  return createNarrativeStoryHelixEngineState();
}