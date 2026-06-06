/**
 * V1282 NarrativeStoryFractalEngine — Direction I Iter 9/20 (Round 5)
 * Story fractal engine: fractal patterns in story
 * Sources: ruflo fractal + nanobot + thunderbolt
 */

export type StoryFractalPattern = 'self_similar' | 'nested' | 'recursive' | 'spiraling' | 'infinite';
export type StoryFractalScale = 'micro' | 'small' | 'medium' | 'large' | 'cosmic';
export type StoryFractalIteration = 'first' | 'second' | 'third' | 'fourth' | 'infinite';

export interface StoryFractalNode {
  fractalId: string;
  pattern: StoryFractalPattern;
  scale: StoryFractalScale;
  iteration: StoryFractalIteration;
  description: string;
  complexity: number;
  elegance: number;
  chapter: number;
}

export interface StoryFractalLevel {
  levelId: string,
  fractalIds: string[],
  cumulativeComplexity: number,
  depth: number,
}

export interface NarrativeStoryFractalEngineState {
  fractals: Map<string, StoryFractalNode>;
  levels: Map<string, StoryFractalLevel>;
  totalFractals: number;
  totalLevels: number;
  averageComplexity: number;
  averageElegance: number;
  levelDepth: number;
  storyFractalMastery: number;
}

// Factory
export function createNarrativeStoryFractalEngineState(): NarrativeStoryFractalEngineState {
  return {
    fractals: new Map(),
    levels: new Map(),
    totalFractals: 0,
    totalLevels: 0,
    averageComplexity: 0.5,
    averageElegance: 0.5,
    levelDepth: 0.5,
    storyFractalMastery: 0.5,
  };
}

// Add fractal
export function addStoryFractalNode(
  state: NarrativeStoryFractalEngineState,
  fractalId: string,
  pattern: StoryFractalPattern,
  scale: StoryFractalScale,
  iteration: StoryFractalIteration,
  description: string,
  complexity: number,
  elegance: number,
  chapter: number
): NarrativeStoryFractalEngineState {
  const fractal: StoryFractalNode = { fractalId, pattern, scale, iteration, description, complexity, elegance, chapter };
  const fractals = new Map(state.fractals).set(fractalId, fractal);
  return recomputeStoryFractal({ ...state, fractals, totalFractals: fractals.size });
}

// Add level
export function addStoryFractalLevel(
  state: NarrativeStoryFractalEngineState,
  levelId: string,
  fractalIds: string[]
): NarrativeStoryFractalEngineState {
  const fractals = fractalIds.map(id => state.fractals.get(id)).filter((f): f is StoryFractalNode => f !== undefined);
  const cumulativeComplexity = fractals.length === 0 ? 0
    : fractals.reduce((s, f) => s + f.complexity, 0) / fractals.length;
  const patternSet = new Set(fractals.map(f => f.pattern));
  const depth = Math.min(1, patternSet.size / 6);
  const level: StoryFractalLevel = { levelId, fractalIds, cumulativeComplexity, depth };
  const levels = new Map(state.levels).set(levelId, level);
  return recomputeStoryFractal({ ...state, levels, totalLevels: levels.size });
}

// Get fractals by pattern
export function getStoryFractalNodesByPattern(state: NarrativeStoryFractalEngineState, pattern: StoryFractalPattern): StoryFractalNode[] {
  return Array.from(state.fractals.values()).filter(f => f.pattern === pattern);
}

// Get story fractal report
export function getStoryFractalReport(state: NarrativeStoryFractalEngineState): {
  totalFractals: number;
  totalLevels: number;
  averageComplexity: number;
  averageElegance: number;
  storyFractalMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalFractals === 0) recommendations.push('No fractals — add story fractal nodes');
  if (state.averageComplexity < 0.5) recommendations.push('Low complexity — strengthen');
  if (state.storyFractalMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalFractals: state.totalFractals,
    totalLevels: state.totalLevels,
    averageComplexity: Math.round(state.averageComplexity * 100) / 100,
    averageElegance: Math.round(state.averageElegance * 100) / 100,
    storyFractalMastery: Math.round(state.storyFractalMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStoryFractal(state: NarrativeStoryFractalEngineState): NarrativeStoryFractalEngineState {
  const fractals = Array.from(state.fractals.values());
  const averageComplexity = fractals.length === 0 ? 0.5
    : fractals.reduce((s, f) => s + f.complexity, 0) / fractals.length;
  const averageElegance = fractals.length === 0 ? 0.5
    : fractals.reduce((s, f) => s + f.elegance, 0) / fractals.length;

  const levels = Array.from(state.levels.values());
  const levelDepth = levels.length === 0 ? 0.5
    : levels.reduce((s, l) => s + l.depth, 0) / levels.length;

  const storyFractalMastery = (averageComplexity * 0.4 + averageElegance * 0.3 + levelDepth * 0.3);

  return { ...state, averageComplexity, averageElegance, levelDepth, storyFractalMastery };
}

// Reset
export function resetNarrativeStoryFractalEngineState(): NarrativeStoryFractalEngineState {
  return createNarrativeStoryFractalEngineState();
}