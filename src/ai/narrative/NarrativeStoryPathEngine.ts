/**
 * V1292 NarrativeStoryPathEngine — Direction I Iter 14/20 (Round 5)
 * Story path engine: paths through story
 * Sources: thunderbolt path + nanobot + ruflo
 */

export type StoryPathType = 'straight' | 'curved' | 'winding' | 'spiral' | 'quantum';
export type StoryPathObstacle = 'none' | 'minor' | 'major' | 'formidable' | 'insurmountable';
export type StoryPathReward = 'small' | 'medium' | 'large' | 'legendary' | 'transcendent';

export interface StoryPathNode {
  pathId: string;
  type: StoryPathType;
  obstacle: StoryPathObstacle;
  reward: StoryPathReward;
  description: string;
  difficulty: number;
  growth: number;
  chapter: number;
}

export interface StoryPathSegment {
  segmentId: string,
  pathIds: string[],
  cumulativeDifficulty: number,
  length: number,
}

export interface NarrativeStoryPathEngineState {
  paths: Map<string, StoryPathNode>;
  segments: Map<string, StoryPathSegment>;
  totalPaths: number;
  totalSegments: number;
  averageDifficulty: number;
  averageGrowth: number;
  segmentLength: number;
  storyPathMastery: number;
}

// Factory
export function createNarrativeStoryPathEngineState(): NarrativeStoryPathEngineState {
  return {
    paths: new Map(),
    segments: new Map(),
    totalPaths: 0,
    totalSegments: 0,
    averageDifficulty: 0.5,
    averageGrowth: 0.5,
    segmentLength: 0.5,
    storyPathMastery: 0.5,
  };
}

// Add path
export function addStoryPathNode(
  state: NarrativeStoryPathEngineState,
  pathId: string,
  type: StoryPathType,
  obstacle: StoryPathObstacle,
  reward: StoryPathReward,
  description: string,
  difficulty: number,
  growth: number,
  chapter: number
): NarrativeStoryPathEngineState {
  const path: StoryPathNode = { pathId, type, obstacle, reward, description, difficulty, growth, chapter };
  const paths = new Map(state.paths).set(pathId, path);
  return recomputeStoryPath({ ...state, paths, totalPaths: paths.size });
}

// Add segment
export function addStoryPathSegment(
  state: NarrativeStoryPathEngineState,
  segmentId: string,
  pathIds: string[]
): NarrativeStoryPathEngineState {
  const paths = pathIds.map(id => state.paths.get(id)).filter((p): p is StoryPathNode => p !== undefined);
  const cumulativeDifficulty = paths.length === 0 ? 0
    : paths.reduce((s, p) => s + p.difficulty, 0) / paths.length;
  const typeSet = new Set(paths.map(p => p.type));
  const length = Math.min(1, typeSet.size / 6);
  const segment: StoryPathSegment = { segmentId, pathIds, cumulativeDifficulty, length };
  const segments = new Map(state.segments).set(segmentId, segment);
  return recomputeStoryPath({ ...state, segments, totalSegments: segments.size });
}

// Get paths by type
export function getStoryPathNodesByType(state: NarrativeStoryPathEngineState, type: StoryPathType): StoryPathNode[] {
  return Array.from(state.paths.values()).filter(p => p.type === type);
}

// Get story path report
export function getStoryPathReport(state: NarrativeStoryPathEngineState): {
  totalPaths: number;
  totalSegments: number;
  averageDifficulty: number;
  averageGrowth: number;
  storyPathMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalPaths === 0) recommendations.push('No paths — add story path nodes');
  if (state.averageDifficulty < 0.5) recommendations.push('Low difficulty — strengthen');
  if (state.storyPathMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalPaths: state.totalPaths,
    totalSegments: state.totalSegments,
    averageDifficulty: Math.round(state.averageDifficulty * 100) / 100,
    averageGrowth: Math.round(state.averageGrowth * 100) / 100,
    storyPathMastery: Math.round(state.storyPathMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStoryPath(state: NarrativeStoryPathEngineState): NarrativeStoryPathEngineState {
  const paths = Array.from(state.paths.values());
  const averageDifficulty = paths.length === 0 ? 0.5
    : paths.reduce((s, p) => s + p.difficulty, 0) / paths.length;
  const averageGrowth = paths.length === 0 ? 0.5
    : paths.reduce((s, p) => s + p.growth, 0) / paths.length;

  const segments = Array.from(state.segments.values());
  const segmentLength = segments.length === 0 ? 0.5
    : segments.reduce((s, seg) => s + seg.length, 0) / segments.length;

  const storyPathMastery = (averageDifficulty * 0.4 + averageGrowth * 0.3 + segmentLength * 0.3);

  return { ...state, averageDifficulty, averageGrowth, segmentLength, storyPathMastery };
}

// Reset
export function resetNarrativeStoryPathEngineState(): NarrativeStoryPathEngineState {
  return createNarrativeStoryPathEngineState();
}