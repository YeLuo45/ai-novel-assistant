/**
 * V1298 NarrativeStoryArcEngine — Direction I Iter 17/20 (Round 5)
 * Story arc engine: arcs in story
 * Sources: thunderbolt arc + nanobot + ruflo
 */

export type StoryArcType = 'character' | 'plot' | 'theme' | 'relationship' | 'moral' | 'transcendent';
export type StoryArcShape = 'rising' | 'falling' | 'circular' | 'spiral' | 'wave';
export type StoryArcTension = 'low' | 'moderate' | 'high' | 'extreme' | 'climactic';

export interface StoryArcNode {
  arcId: string;
  type: StoryArcType;
  shape: StoryArcShape;
  tension: StoryArcTension;
  description: string;
  trajectory: number;
  satisfaction: number;
  chapter: number;
}

export interface StoryArcCollection {
  collectionId: string,
  arcIds: string[],
  cumulativeTrajectory: number,
  grandeur: number,
}

export interface NarrativeStoryArcEngineState {
  arcs: Map<string, StoryArcNode>;
  collections: Map<string, StoryArcCollection>;
  totalArcs: number;
  totalCollections: number;
  averageTrajectory: number;
  averageSatisfaction: number;
  collectionGrandeur: number;
  storyArcMastery: number;
}

// Factory
export function createNarrativeStoryArcEngineState(): NarrativeStoryArcEngineState {
  return {
    arcs: new Map(),
    collections: new Map(),
    totalArcs: 0,
    totalCollections: 0,
    averageTrajectory: 0.5,
    averageSatisfaction: 0.5,
    collectionGrandeur: 0.5,
    storyArcMastery: 0.5,
  };
}

// Add arc
export function addStoryArcNode(
  state: NarrativeStoryArcEngineState,
  arcId: string,
  type: StoryArcType,
  shape: StoryArcShape,
  tension: StoryArcTension,
  description: string,
  trajectory: number,
  satisfaction: number,
  chapter: number
): NarrativeStoryArcEngineState {
  const arc: StoryArcNode = { arcId, type, shape, tension, description, trajectory, satisfaction, chapter };
  const arcs = new Map(state.arcs).set(arcId, arc);
  return recomputeStoryArc({ ...state, arcs, totalArcs: arcs.size });
}

// Add collection
export function addStoryArcCollection(
  state: NarrativeStoryArcEngineState,
  collectionId: string,
  arcIds: string[]
): NarrativeStoryArcEngineState {
  const arcs = arcIds.map(id => state.arcs.get(id)).filter((a): a is StoryArcNode => a !== undefined);
  const cumulativeTrajectory = arcs.length === 0 ? 0
    : arcs.reduce((s, a) => s + a.trajectory, 0) / arcs.length;
  const typeSet = new Set(arcs.map(a => a.type));
  const grandeur = Math.min(1, typeSet.size / 6);
  const collection: StoryArcCollection = { collectionId, arcIds, cumulativeTrajectory, grandeur };
  const collections = new Map(state.collections).set(collectionId, collection);
  return recomputeStoryArc({ ...state, collections, totalCollections: collections.size });
}

// Get arcs by type
export function getStoryArcNodesByType(state: NarrativeStoryArcEngineState, type: StoryArcType): StoryArcNode[] {
  return Array.from(state.arcs.values()).filter(a => a.type === type);
}

// Get story arc report
export function getStoryArcReport(state: NarrativeStoryArcEngineState): {
  totalArcs: number;
  totalCollections: number;
  averageTrajectory: number;
  averageSatisfaction: number;
  storyArcMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalArcs === 0) recommendations.push('No arcs — add story arc nodes');
  if (state.averageTrajectory < 0.5) recommendations.push('Low trajectory — strengthen');
  if (state.storyArcMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalArcs: state.totalArcs,
    totalCollections: state.totalCollections,
    averageTrajectory: Math.round(state.averageTrajectory * 100) / 100,
    averageSatisfaction: Math.round(state.averageSatisfaction * 100) / 100,
    storyArcMastery: Math.round(state.storyArcMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStoryArc(state: NarrativeStoryArcEngineState): NarrativeStoryArcEngineState {
  const arcs = Array.from(state.arcs.values());
  const averageTrajectory = arcs.length === 0 ? 0.5
    : arcs.reduce((s, a) => s + a.trajectory, 0) / arcs.length;
  const averageSatisfaction = arcs.length === 0 ? 0.5
    : arcs.reduce((s, a) => s + a.satisfaction, 0) / arcs.length;

  const collections = Array.from(state.collections.values());
  const collectionGrandeur = collections.length === 0 ? 0.5
    : collections.reduce((s, c) => s + c.grandeur, 0) / collections.length;

  const storyArcMastery = (averageTrajectory * 0.4 + averageSatisfaction * 0.3 + collectionGrandeur * 0.3);

  return { ...state, averageTrajectory, averageSatisfaction, collectionGrandeur, storyArcMastery };
}

// Reset
export function resetNarrativeStoryArcEngineState(): NarrativeStoryArcEngineState {
  return createNarrativeStoryArcEngineState();
}